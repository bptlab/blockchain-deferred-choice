// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

contract BaseDeferredChoice is DeferredChoice {
  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  // Member Variables
  uint256 public activationTime = 0;
  Event[] public events;
  bool public hasFinished = false;
  uint8 public callbackCount = 0;

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

  /*
   * Initially activate this deferred choice scenario.
   * This is equivalent to an event-based gateway being reached.
   */
  function activate() external override {
    // Revert if it has been activated already
    if (activationTime > 0) {
      revert("Deferred choice can only be activated once");
    }

    // Remember the time of activation
    activationTime = block.timestamp;

    // Activate and initially evaluate all events
    for (uint8 i = 0; i < events.length; i++) {
      changeState(i, EventState.ACTIVE);

      // For some events, we have to do some initialization once
      Event storage e = events[i];
      if (e.spec.definition == EventDefinition.CONDITIONAL) {
        // Subscribe to publish/subscribe oracles
        if (Oracle(e.spec.oracle).specification().tense == OracleTense.FUTURE) {
          // Set correlation target as this event itself, since we never call pub/
          // sub oracles again later during the triggering of a concrete other event.
          uint256 correlation = uint256(i) | (uint256(i) << 8);
          AsyncOracle(e.spec.oracle).get(correlation, new bytes(0));
        }
      } else if (e.spec.definition == EventDefinition.EXPLICIT) {
        // Explicit (message and signal) events, by default, evaluate to "the future" until
        // their concrete transaction is sent
        e.evaluation = TOP_TIMESTAMP;
      } else {
        // Otherwise, just evaluate them through the regular interfaces
        evaluateEvent(i, i);
      }
    }

    emit Debug("Activated");
  }

  /*
   * This function will try to trigger the event with the target id. For that, all
   * other events are evaluated as well and the function only proceeds (potentially
   * asynchronously) when we can be sure that this event has "won" the race.
   */
  function tryTrigger(uint8 target) external override {
    // Check if the call is valid
    if (hasFinished) {
      revert("Choice has already finished");
    }
    if (callbackCount > 0) {
      revert("Another event is currently being tried");
    }
    if (target >= events.length) {
      revert("Event with target index does not exist");
    }

    // Evaluate all events if necessary, including the target one
    for (uint8 i = 0; i < events.length; i++) {
      evaluateEvent(i, target);
    }

    // Try to complete the triggering of this event
    tryCompleteTrigger(target);
  }

  /*
   * This function will be called by async oracles to provide the result of the
   * query. Depending on the concrete oracle type, different formats will be given.
   */
  function oracleCallback(address oracle, uint256 correlation, bytes calldata results) external override {
    uint8 target = uint8(correlation);
    uint8 index = uint8(correlation >> 8);

    // Do nothing if we have already finished
    if (hasFinished) {
      return;
    }

    // Do nothing if the event this oracle belongs to has been evaluated already
    // (this filters out duplicate callbacks, or late pub/sub calls)
    if (events[index].evaluation > 0 && events[index].evaluation < TOP_TIMESTAMP) {
      return;
    }

    // Check the conditional event this oracle belongs to
    checkConditionalEvent(index, oracle, results);

    // Reduce the callback count so we know when we have all the data we need
    if (Oracle(oracle).specification().tense != OracleTense.FUTURE) {
      callbackCount--;
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }

  /*
   * Get the state of the event with the given index.
   */
  function getState(uint8 index) external view returns (EventState) {
    return events[index].state;
  }

  /*
   * Change the state of the event with the given index.
   */
  function changeState(uint8 index, EventState newState) private {
    events[index].state = newState;
    emit StateChanged(index, newState);
  }

  /*
   * Evaluate the event with the given index, under the circumstance that the event at the target
   * index is currently attempting to trigger.
   */
  function evaluateEvent(uint8 index, uint8 target) internal {
    EventSpecification memory spec = events[index].spec;

    if (spec.definition == EventDefinition.EXPLICIT) {
      // For explicit events, we just "evaluate" them if they are the target
      if (index == target) {
        events[index].evaluation = block.timestamp;
      }
    } else if (events[index].evaluation == 0 || events[index].evaluation == TOP_TIMESTAMP) {
      // Otherwise, evaluate them if they did not yet resolve
      if (spec.definition == EventDefinition.TIMER_ABSOLUTE) {
        // Check if deadline has passed
        if (spec.timer <= block.timestamp) {
          if (spec.timer < activationTime) {
            events[index].evaluation = activationTime;
          } else {
            events[index].evaluation = spec.timer;
          }
        } else {
          events[index].evaluation = TOP_TIMESTAMP;
        }
      } else if (spec.definition == EventDefinition.TIMER_RELATIVE) {
        // Check if enough time has passed since activation
        if (activationTime + spec.timer <= block.timestamp) {
          events[index].evaluation = activationTime + spec.timer;
        } else {
          events[index].evaluation = TOP_TIMESTAMP;
        }
      } else if (spec.definition == EventDefinition.CONDITIONAL) {
        if (Oracle(spec.oracle).specification().tense != OracleTense.FUTURE) {
          // Get the oracle value and evaluate it
          bytes memory params;
          if (Oracle(spec.oracle).specification().tense == OracleTense.PAST) {
            params = abi.encode(this.activationTime);
          } else {
            params = new bytes(0);
          }
          if (Oracle(spec.oracle).specification().mode == OracleMode.SYNC) {
            bytes memory result = SyncOracle(spec.oracle).get(params);
            checkConditionalEvent(index, spec.oracle, result);
          } else {
            uint256 correlation = uint256(target) | (uint256(index) << 8);
            AsyncOracle(spec.oracle).get(correlation, params);
            callbackCount++;
          }
        }
      }
    }
  }

  /*
   * Check the conditional event at the given index using the results returned from the given
   * oracle. We need the oracle information to properly decode the results.
   */
  function checkConditionalEvent(uint8 index, address oracle, bytes memory results) private {
    // By default, we assume the condition has not been fulfilled and set the evaluation time
    // to "the future"
    uint256 evaluation = TOP_TIMESTAMP;

    if (Oracle(oracle).specification().tense == OracleTense.PAST) {
      // For PAST oracles, the results are an array of historical values
      uint256[] memory values = abi.decode(results, (uint256[]));

      // Find the first of those values which fulfilled the condition
      for (uint16 i = 0; i < values.length; i += 2) {
        if (checkCondition(events[index].spec.condition, values[i+1])) {
          if (values[i] < activationTime) {
            evaluation = activationTime;
          } else {
            evaluation = values[i];
          }
          break;
        }
      }
    } else {
      // For PRESENT and FUTURE oracles, we just get a single value to check
      uint256 value = abi.decode(results, (uint256));
      if (checkCondition(events[index].spec.condition, value)) {
        evaluation = block.timestamp;
      }
    }

    events[index].evaluation = evaluation;
    emit Debug("Oracle evaluated");
  }

  /*
   * Helper function that returns true if the given condition is satisfied by the value.
   */
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

  /*
   * This function completes the current trigger attempt if possible by either completing
   * or aborting the target event.
   */
  function tryCompleteTrigger(uint8 target) private {
    // We can only complete the trigger if there are no oracle values left to receive
    if (callbackCount > 0) {
      emit Debug("Missing required oracle evaluations");
      return;
    }
    for (uint8 i = 0; i < events.length; i++) {
      if (events[i].evaluation == 0) {
        emit Debug("Missing initial oracle evaluations");
      }
    }

    // Find minimum evaluation timestamp of any implicit event
    uint256 min = TOP_TIMESTAMP;
    uint8 minIndex = 0;
    for (uint8 i = 0; i < events.length; i++) {
      if (events[i].spec.definition != EventDefinition.EXPLICIT) {
        if (events[i].evaluation < min) {
          min = events[i].evaluation;
          minIndex = i;
        }
      }
    }

    bool canTrigger = false;
    uint8 toTrigger = 0;
    if (events[target].spec.definition == EventDefinition.EXPLICIT &&
        events[target].evaluation <= min) {
      // If target is explicit and no implicit one fired before, trigger it
      canTrigger = true;
      toTrigger = target;
    } else {
      // Otherwise, fire the implicit one with the lowest timestamp if possible
      // and prefer the target at the same time
      if (min < TOP_TIMESTAMP) {
        canTrigger = true;
        if (events[target].spec.definition != EventDefinition.EXPLICIT &&
            events[target].evaluation == min) {
          toTrigger = target;
        } else {
          toTrigger = minIndex;
        }
      }
    }

    // Change the states of events according to the observations
    if (canTrigger) {
      for (uint8 i = 0; i < events.length; i++) {
        if (i == toTrigger) {
          changeState(i, EventState.COMPLETED);
        } else {
          changeState(i, EventState.ABORTED);
        }
      }
      hasFinished = true;
    }
  }
}
