// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

contract DeferredChoice is OracleConsumer {

    // Events
    event StateChanged(
      uint8 index,
      EventState newState
    );

    event Debug(string text);

    // Enumerations
    enum EventState {
      INACTIVE,
      ACTIVE,
      COMPLETED,
      ABORTED
    }

    enum EventDefinition {
      TIMER_ABSOLUTE,
      TIMER_RELATIVE,
      CONDITIONAL,
      MESSAGE,
      SIGNAL
    }

    // Structures
    struct Event {
      uint8 index;
      EventDefinition definition;
      EventState state;
      // Timer specification
      uint256 timer;
      // Conditional specification
      Oracle oracle;
      Base.Condition condition;
    }

    uint256 constant BOTTOM_TIMESTAMP = 1;

    struct Step {
      uint8 target; // target event
      uint256 timestamp;
      mapping(uint8 => uint256) evaluations; // event evaluations
    }

    // Member Variables
    uint256 public activationTime;
    uint16 public stepCounter = 0;
    mapping(uint16 => Step) public steps;
    Event[] public events;

    modifier hasNotFinished() {
      for (uint8 i = 0; i < events.length; i++) {
        if (events[i].state == EventState.COMPLETED) {
          revert("An event has already completed");
        }
      }
      _;
    }

    // Functions
    constructor() public {
      // static debug configuration
      events.push(Event(
        0,
        EventDefinition.CONDITIONAL,
        EventState.INACTIVE,
        0,
        Oracle(0x919338c0226eEf2c1C084FdA0Ca0dDdB063BcF0A),
        Condition(
          Operator.LESS,
          10
        )
      ));
    }

    function activate() external {
      // TODO get time, maybe with callback
      activationTime = block.timestamp;

      for (uint8 i = 0; i < events.length; i++) {
        changeState(i, EventState.ACTIVE);
      }

      emit Debug("Activated");
    }

    function changeState(uint8 index, EventState newState) internal {
      events[index].state = newState;
      emit StateChanged(index, newState);
    }


    function startStep(uint8 index) external hasNotFinished() {
      if (index >= events.length) {
        revert("Event index does not exist");
      }

      uint16 step = stepCounter;
      stepCounter++;
      steps[step] = Step(index, 0);
      Step storage curStep = steps[step];

      // TODO update with other methods of getting the current timestamp
      curStep.timestamp = block.timestamp;

      // evaluate events
      for (uint8 i = 0; i < events.length; i++) {
        Event memory e = events[i];
        if (e.definition == EventDefinition.CONDITIONAL) {
          // get the oracle value and evaluate it
          Oracle oracle = e.oracle;
          if (oracle.specification().mode == OracleMode.SYNC) {
            bytes memory result = SyncOracle(address(oracle)).get(new bytes(0));
            evaluateConditionalEvent(step, e.index, oracle, result);
          } else {
            uint256 correlation = uint256(step) | (uint256(i) << 16);
            AsyncOracle(address(oracle)).get(correlation, new bytes(0));
          }
        } else if (e.definition == EventDefinition.TIMER_ABSOLUTE) {
          // check if deadline has passed
          if (e.timer <= curStep.timestamp) {
            if (e.timer < activationTime) {
              curStep.evaluations[e.index] = activationTime;
            } else {
              curStep.evaluations[e.index] = e.timer;
            }
          } else {
            curStep.evaluations[e.index] = BOTTOM_TIMESTAMP;
          }
        } else if (e.definition == EventDefinition.TIMER_RELATIVE) {
          // check if enough time has passed since activation
          if (activationTime + e.timer <= curStep.timestamp) {
            curStep.evaluations[e.index] = activationTime + e.timer;
          } else {
            curStep.evaluations[e.index] = BOTTOM_TIMESTAMP;
          }
        } else if (e.definition == EventDefinition.MESSAGE) {
          // check if the target of the step is this event
          if (curStep.target == e.index) {
            curStep.evaluations[e.index] = curStep.timestamp;
          } else {
            curStep.evaluations[e.index] = BOTTOM_TIMESTAMP;
          }
        }
      }

      tryCompleteStep(step);
    }

    function oracleCallback(Oracle oracle, uint256 correlation, bytes calldata results) external override {
      uint16 step = uint16(correlation);
      uint8 index = uint8(correlation >> 16);
      evaluateConditionalEvent(step, index, oracle, results);
      tryCompleteStep(step);
    }

    function evaluateConditionalEvent(uint16 step, uint8 index, Oracle oracle, bytes memory results) private {
      emit Debug("Oracle evaluated");

      //TODO check which oracle we have and how we have to decode the results
      int256 value = abi.decode(results, (int256));

      bool result = false;
      Condition storage c = events[index].condition;
      if (c.operator == Operator.GREATER) {
          result = value > c.value;
      } else if (c.operator == Operator.GREATER_EQUAL) {
          result = value >= c.value;
      } else if (c.operator == Operator.EQUAL) {
          result = value == c.value;
      } else if (c.operator == Operator.LESS_EQUAL) {
          result = value <= c.value;
      } else if (c.operator == Operator.LESS) {
          result = value < c.value;
      }

      if (result) {
          // TODO proper timestamp
          steps[step].evaluations[index] = block.timestamp;
      }
    }

    function tryCompleteStep(uint16 step) private {
      emit Debug("Trying to complete step");

      // We need to have a timestamp
      if (steps[step].timestamp == 0) {
        return;
      }

      // We need to have all oracle evaluation timestamps
      for (uint8 i = 0; i < events.length; i++) {
        if (events[i].definition == EventDefinition.CONDITIONAL) {
          if (steps[step].evaluations[i] == 0) {
            return;
          }
        }
      }

      // Good to go!
      completeStep(step);
    }

    function completeStep(uint16 step) private {
      emit Debug("Completing step");
      // TODO find set of events with lowest timestamp and check if the target is one of them
      changeState(steps[step].target, EventState.COMPLETED);
    }
}
