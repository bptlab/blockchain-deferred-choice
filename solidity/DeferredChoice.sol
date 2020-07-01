// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

contract BaseDeferredChoice is DeferredChoice {

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
      address oracle;
      Base.Condition condition;
    }

    uint256 constant TOP_TIMESTAMP = type(uint256).max;

    // Member Variables
    uint256 public activationTime;
    Event[] public events;
    uint256[] public evaluations; // event evaluations
    ChoiceState public state = ChoiceState.CREATED;

    // Functions
    constructor() public {
      // static debug configuration
      events.push(Event(
        0,
        EventDefinition.CONDITIONAL,
        EventState.INACTIVE,
        0,
        0xcBa7af7EE37DD792123b05C1472935E9577EaC6A,
        Condition(
          Operator.EQUAL,
          10
        )
      ));
      events.push(Event(
        0,
        EventDefinition.TIMER_RELATIVE,
        EventState.INACTIVE,
        10,
        address(0x0),
        Condition(
          Operator.EQUAL,
          0
        )
      ));
      evaluations.push(0);
      evaluations.push(0);
    }


    function activate() external override {
      if (state != ChoiceState.CREATED) {
        revert("Choice can only be started once");
      }

      // start the choice
      state = ChoiceState.RUNNING;
      activationTime = block.timestamp;

      // activate and initially evaluate all events
      for (uint8 i = 0; i < events.length; i++) {
        changeState(i, EventState.ACTIVE);

        // subscribe to publish/subscribe oracles
        Event memory e = events[i];
        if (e.definition == EventDefinition.CONDITIONAL) {
          if (Oracle(e.oracle).specification().tense == OracleTense.FUTURE) {
            // set correlation target as this event itself
            uint256 correlation = uint256(i) | (uint256(i) << 8);
            AsyncOracle(e.oracle).get(correlation, new bytes(0));
          }
        }

        // mark non-implicit events with the top timestamp
        if (e.definition == EventDefinition.MESSAGE) {
          evaluations[i] = TOP_TIMESTAMP;
        }

        evaluateEvent(i, i);
      }

      emit Debug("Activated");
    }

    function tryTrigger(uint8 target) external override {
      if (target >= events.length) {
        revert("Event with target index does not exist");
      }

      Event memory e = events[target];

      if (events[target].state != EventState.ACTIVE) {
        revert("Event with target index is not active");
      }

      // It can happen that triggering a message has been tried before, but not
      // all oracle values were gathered yet. Thus, we "remember" that timestamp
      // so the message can be correctly sent afterwards. Otherwise, set the
      // evaluation timestamp to the current one.
      if (e.definition == EventDefinition.MESSAGE && evaluations[target] == TOP_TIMESTAMP) {
        evaluations[target] = block.timestamp;
      }

      // Evaluate all other events
      for (uint8 i = 0; i < events.length; i++) {
        // Reset evaluation of non-FUTURE oracles
        if (events[i].definition == EventDefinition.CONDITIONAL) {
          if (Oracle(events[i].oracle).specification().tense != OracleTense.FUTURE) {
            if (evaluations[i] == TOP_TIMESTAMP) {
              evaluations[i] = 0;
            }
          }
        }
        evaluateEvent(i, target);
      }

      tryCompleteTrigger(target);
    }

    function oracleCallback(address oracle, uint256 correlation, bytes calldata results) external override {
      uint8 target = uint8(correlation);
      uint8 index = uint8(correlation >> 8);
      //TODO Figure out when and if we have to do this.
      checkConditionalEvent(index, oracle, results);
      tryCompleteTrigger(target);
    }


    function changeState(uint8 index, EventState newState) private {
      events[index].state = newState;
      emit StateChanged(index, newState);
    }

    function evaluateEvent(uint8 index, uint8 target) internal {
      Event memory e = events[index];
      if (e.state == EventState.ACTIVE && (evaluations[index] == 0 || evaluations[index] == TOP_TIMESTAMP)) {
        if (e.definition == EventDefinition.TIMER_ABSOLUTE) {
          // Check if deadline has passed
          if (e.timer <= block.timestamp) {
            if (e.timer < activationTime) {
              evaluations[index] = activationTime;
            } else {
              evaluations[index] = e.timer;
            }
          } else {
            evaluations[index] = TOP_TIMESTAMP;
          }
        } else if (e.definition == EventDefinition.TIMER_RELATIVE) {
          // Check if enough time has passed since activation
          if (activationTime + e.timer <= block.timestamp) {
            evaluations[index] = activationTime + e.timer;
          } else {
            evaluations[index] = TOP_TIMESTAMP;
          }
        } else if (e.definition == EventDefinition.CONDITIONAL) {
          if (Oracle(e.oracle).specification().tense != OracleTense.FUTURE) {
            // Get the oracle value and evaluate it
            if (Oracle(e.oracle).specification().mode == OracleMode.SYNC) {
              bytes memory result = SyncOracle(e.oracle).get(new bytes(0));
              checkConditionalEvent(index, e.oracle, result);
            } else {
              uint256 correlation = uint256(target) | (uint256(index) << 8);
              AsyncOracle(e.oracle).get(correlation, new bytes(0));
            }
          }
        }
      }
    }

    function checkConditionalEvent(uint8 index, address oracle, bytes memory results) private {
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
        evaluations[index] = block.timestamp;
      } else {
        evaluations[index] = TOP_TIMESTAMP;
      }
    }

    function tryCompleteTrigger(uint8 target) private {
      emit Debug("Trying to complete step");

      // Find minimum evaluation timestamp other than 0, which means that
      // no evaluation has been performed yet
      bool canComplete = true;
      uint256 min = TOP_TIMESTAMP;
      for (uint8 i = 0; i < events.length; i++) {
        if (evaluations[i] == 0) {
          canComplete = false;
        } else if (evaluations[i] < min) {
          min = evaluations[i];
        }
      }
      if (min == TOP_TIMESTAMP) {
        return;
      }
      canComplete = canComplete && evaluations[target] == min;

      // Change the states of events according to the observations
      for (uint8 i = 0; i < events.length; i++) {
        if (canComplete) {
          if (target == i) {
            changeState(i, EventState.COMPLETED);
          } else {
            changeState(i, EventState.ABORTED);
          }
        } else {
          if (min < evaluations[i]) {
            // This event can not win the race anymore, since there is already
            // one with an earlier evaluation. So even though we can not complete
            // yet, we still do not have to check this one anymore.
            changeState(i, EventState.ABORTED);
          }
        }
      }
    }
}
