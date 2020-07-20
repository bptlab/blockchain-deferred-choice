// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";
import "./Oracles.sol";

contract BaseDeferredChoice is DeferredChoice
// <%- if (PAST) { _%>
  , OracleValueArrayConsumer
// <%- } else { _%>
  , OracleValueConsumer
// <%- } _%>
{
  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  // Member Variables
  uint256 public activationTime = 0;
  Event[] public events;
  bool public hasFinished = false;
// <%- if (ASYNC && !FUTURE) { _%>
  uint8 public callbackCount = 0;
// <%- } _%>

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
      Event storage e = events[i];
      changeState(i, EventState.ACTIVE);

// <%- if (ASYNC && FUTURE) { _%>
      if (e.spec.definition == EventDefinition.CONDITIONAL) {
        // Subscribe to publish/subscribe oracles.
        // Set correlation target as this event itself, since we never call pub/
        // sub oracles again later during the triggering of a concrete other event.
        uint256 correlation = uint256(i) | (uint256(i) << 8);
        FutureAsyncOracle(e.spec.oracle).get(correlation);
        continue;
      }
// <%- } _%>
      
      if (e.spec.definition == EventDefinition.EXPLICIT) {
        // Explicit (message and signal) events, by default, evaluate to "the future" until
        // their concrete transaction is sent
        e.evaluation = TOP_TIMESTAMP;
        continue;
      }

      // Otherwise, just evaluate them through the regular interfaces
      evaluateEvent(i, i);
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
    if (target >= events.length) {
      revert("Event with target index does not exist");
    }
// <%- if (ASYNC) { _%>
    if (callbackCount > 0) {
      revert("Another event is currently being tried");
    }
// <%- } _%>

    // Evaluate all events if necessary, including the target one
    for (uint8 i = 0; i < events.length; i++) {
      evaluateEvent(i, target);
    }

    // Try to complete the triggering of this event
    tryCompleteTrigger(target);
  }

// <%- if (ASYNC) { _%>
// <%- if (PAST) { _%>
  function oracleCallback(address oracle, uint256 correlation, uint256[] calldata results) external override {
// <%- } else { _%>
  function oracleCallback(address oracle, uint256 correlation, uint256 results) external override {
// <%- } _%>
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

// <%- if (!FUTURE) { _%>
    // Reduce the callback count so we know when we have all the data we need
    callbackCount--;
// <%- } _%>

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }
// <%- } _%>

  /*
   * Get the state of the event with the given index.
   */
  function getState(uint8 index) external view override returns (EventState) {
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
// <%- if (ASYNC) { _%>
        uint256 correlation = uint256(target) | (uint256(index) << 8);
// <%- } _%>
// <%- if (ASYNC && PAST) { _%>
        PastAsyncOracle(spec.oracle).get(correlation, activationTime);
        callbackCount++;
// <%- } else if (ASYNC && PRESENT) { _%>
        PresentAsyncOracle(spec.oracle).get(correlation);
        callbackCount++;
// <%- } else if (ASYNC && FUTURE) { _%>
        // For FutureAsyncOracles, we do not have to query them again here
// <%- } else if (SYNC && PAST) { _%>
        uint256[] memory values = PastSyncOracle(spec.oracle).get(activationTime);
        checkConditionalEvent(index, spec.oracle, values);
// <%- } else if (SYNC && PRESENT) { _%>
        uint256 value = PresentSyncOracle(spec.oracle).get();
        checkConditionalEvent(index, spec.oracle, value);
// <%- } _%>
      }
    }
  }

// <%- if (!PAST) { _%>
  function checkConditionalEvent(uint8 index, address oracle, uint256 value) private {
    uint256 evaluation = TOP_TIMESTAMP;

    // For PRESENT and FUTURE oracles, we just get a single value to check
    if (checkCondition(events[index].spec.condition, value)) {
      evaluation = block.timestamp;
    }

    events[index].evaluation = evaluation;
}
// <%- } else { _%>
  function checkConditionalEvent(uint8 index, address oracle, uint256[] memory values) private {
    uint256 evaluation = TOP_TIMESTAMP;

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

    events[index].evaluation = evaluation;
  }
// <%- } _%>

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
// <%- if (ASYNC && !FUTURE) { _%>
    // We can only complete the trigger if there are no oracle values left to receive
    if (callbackCount > 0) {
      emit Debug("Missing required oracle evaluations");
      return;
    }
// <%- } _%>
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
