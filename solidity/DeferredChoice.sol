// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

contract BaseDeferredChoice is DeferredChoice {
  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  // Member Variables
  uint256 public activationTime;
  Event[] public events;
  ChoiceState public state = ChoiceState.CREATED;

  // Functions
  constructor(EventSpecification[] memory specs) public {
    for (uint8 i = 0; i < specs.length; i++) {
      EventSpecification memory spec = specs[i];
      events.push(Event(
        spec,
        EventState.INACTIVE,
        0
      ));
    }
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
      if (e.spec.definition == EventDefinition.CONDITIONAL) {
        if (Oracle(e.spec.oracle).specification().tense == OracleTense.FUTURE) {
          // set correlation target as this event itself
          uint256 correlation = uint256(i) | (uint256(i) << 8);
          AsyncOracle(e.spec.oracle).get(correlation, new bytes(0));
        }
      }

      // mark non-implicit events with the top timestamp
      if (e.spec.definition == EventDefinition.MESSAGE) {
        events[i].evaluation = TOP_TIMESTAMP;
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
    if (e.spec.definition == EventDefinition.MESSAGE && events[target].evaluation == TOP_TIMESTAMP) {
      events[target].evaluation = block.timestamp;
    }

    // Evaluate all other events
    for (uint8 i = 0; i < events.length; i++) {
      // Reset evaluation of non-FUTURE oracles
      if (events[i].spec.definition == EventDefinition.CONDITIONAL) {
        if (Oracle(events[i].spec.oracle).specification().tense != OracleTense.FUTURE) {
          if (events[i].evaluation == TOP_TIMESTAMP) {
            events[i].evaluation = 0;
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
    if (e.state == EventState.ACTIVE && (events[index].evaluation == 0 || events[index].evaluation == TOP_TIMESTAMP)) {
      if (e.spec.definition == EventDefinition.TIMER_ABSOLUTE) {
        // Check if deadline has passed
        if (e.spec.timer <= block.timestamp) {
          if (e.spec.timer < activationTime) {
            events[index].evaluation = activationTime;
          } else {
            events[index].evaluation = e.spec.timer;
          }
        } else {
          events[index].evaluation = TOP_TIMESTAMP;
        }
      } else if (e.spec.definition == EventDefinition.TIMER_RELATIVE) {
        // Check if enough time has passed since activation
        if (activationTime + e.spec.timer <= block.timestamp) {
          events[index].evaluation = activationTime + e.spec.timer;
        } else {
          events[index].evaluation = TOP_TIMESTAMP;
        }
      } else if (e.spec.definition == EventDefinition.CONDITIONAL) {
        if (Oracle(e.spec.oracle).specification().tense != OracleTense.FUTURE) {
          // Get the oracle value and evaluate it
          if (Oracle(e.spec.oracle).specification().mode == OracleMode.SYNC) {
            bytes memory result = SyncOracle(e.spec.oracle).get(new bytes(0));
            checkConditionalEvent(index, e.spec.oracle, result);
          } else {
            uint256 correlation = uint256(target) | (uint256(index) << 8);
            AsyncOracle(e.spec.oracle).get(correlation, new bytes(0));
          }
        }
      }
    }
  }

  function checkConditionalEvent(uint8 index, address oracle, bytes memory results) private {
    emit Debug("Oracle evaluated");

    if (events[index].evaluation == 0 || events[index].evaluation == TOP_TIMESTAMP) {
      uint256 evaluation = TOP_TIMESTAMP;
      OracleTense tense = Oracle(oracle).specification().tense;
      Condition memory c = events[index].spec.condition;
      if (tense == OracleTense.PAST) {
        uint256[] memory values = abi.decode(results, (uint256[]));
        for (uint16 i = 0; i < values.length; i += 2) {
          if (checkCondition(c, values[i+1])) {
            evaluation = values[i];
            break;
          }
        }
      } else { // if (tense == OracleTense.PRESENT || tense == OracleTense.FUTURE) {
        uint256 value = abi.decode(results, (uint256));
        if (checkCondition(c, value)) {
          evaluation = block.timestamp;
        }
      }

      events[index].evaluation = evaluation;
    }
  }

  function checkCondition(Condition memory c, uint256 value) private pure returns (bool result) {
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
  }

  function tryCompleteTrigger(uint8 target) private {
    emit Debug("Trying to complete step");

    // Find minimum evaluation timestamp other than 0, which means that
    // no evaluation has been performed yet
    bool canComplete = true;
    uint256 min = TOP_TIMESTAMP;
    for (uint8 i = 0; i < events.length; i++) {
      if (events[i].evaluation == 0) {
        canComplete = false;
      } else if (events[i].evaluation < min) {
        min = events[i].evaluation;
      }
    }
    if (min == TOP_TIMESTAMP) {
      return;
    }
    canComplete = canComplete && events[target].evaluation == min;

    // Change the states of events according to the observations
    for (uint8 i = 0; i < events.length; i++) {
      if (canComplete) {
        if (target == i) {
          changeState(i, EventState.COMPLETED);
        } else {
          changeState(i, EventState.ABORTED);
        }
      } else {
        if (min < events[i].evaluation) {
          // This event can not win the race anymore, since there is already
          // one with an earlier evaluation. So even though we can not complete
          // yet, we still do not have to check this one anymore.
          changeState(i, EventState.ABORTED);
        }
      }
    }
  }
}
