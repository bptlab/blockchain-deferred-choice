// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

abstract contract AbstractChoice is Base {
  // Events
  event Winner(uint8 winner);
  event Debug(string text);
  event DebugUint(uint256 value);

  // Enumerations
  enum EventDefinition {
    TIMER_ABSOLUTE,
    TIMER_RELATIVE,
    CONDITIONAL,
    EXPLICIT
  }

  struct Event {
    EventDefinition definition;
    // Timer specification
    uint256 timer;
    // Conditional specification
    address oracle;
    Base.Condition condition;
  }

  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  // Member Variables
  Event[] events;
  uint256 public activationTime = 0;
  mapping(uint8 => uint256) public evals;
  int8 public winner = -1;

  constructor(Event[] memory specs) public {
    // We have to copy the specs array manually since Solidity does not yet
    // support copying whole memory arrays into storage arrays.
    for (uint8 i = 0; i < specs.length; i++) {
      events.push() = specs[i];
    }
  }

  /*
   * Initially activate this deferred choice scenario.
   * This is equivalent to an event-based gateway being reached.
   */
  function activate() external {
    // Revert if it has been activated already
    if (activationTime > 0) {
      revert("Deferred choice can only be activated once");
    }

    // Remember the time of activation
    activationTime = block.timestamp;

    // Activate all events
    for (uint8 i = 0; i < events.length; i++) {
      activateEvent(i);
    }

    emit Debug("Activated");
  }

  function activateEvent(uint8 index) internal virtual {
    if (events[index].definition == EventDefinition.EXPLICIT) {
      // Explicit (message and signal) events, by default, evaluate to "the future" until
      // their concrete transaction is sent
      evals[index] = TOP_TIMESTAMP;
      return;
    }

    // Otherwise, just evaluate them through the regular interfaces
    evaluateEvent(index, index);
  }

  /*
   * Evaluate the event with the given index, under the circumstance that the event at the target
   * index is currently attempting to trigger.
   */
  function evaluateEvent(uint8 index, uint8 target) internal virtual {
    Event memory e = events[index];

    // For explicit events, we just "evaluate" them if they are the target
    if (e.definition == EventDefinition.EXPLICIT) {
      if (index == target) {
        evals[index] = block.timestamp;
      }
      return;
    }

    // Check if deadline has passed
    if (e.definition == EventDefinition.TIMER_ABSOLUTE) {
      if (e.timer <= block.timestamp) {
        if (e.timer < activationTime) {
          evals[index] = activationTime;
        } else {
          evals[index] = e.timer;
        }
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }

    // Check if enough time has passed since activation
    if (e.definition == EventDefinition.TIMER_RELATIVE) {
      if (activationTime + e.timer <= block.timestamp) {
        evals[index] = activationTime + e.timer;
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }
  }

  /*
   * This function will try to trigger the event with the target id. For that, all
   * other events are evaluated as well and the function only proceeds (potentially
   * asynchronously) when we can be sure that this event has "won" the race.
   */
  function trigger(uint8 target) public virtual {
    // Check if the call is valid
    if (winner >= 0) {
      revert("Choice has already finished");
    }
    if (target >= events.length) {
      revert("Event with target index does not exist");
    }

    // Evaluate all events if necessary
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0 || evals[i] == TOP_TIMESTAMP) {
        evaluateEvent(i, target);
      }
    }

    // Try to complete the triggering of this event
    tryCompleteTrigger(target);
  }

  /*
   * Helper function that returns true if the given condition is satisfied by the value.
   */
  function checkCondition(Condition memory c, uint256 value) internal pure returns (bool result) {
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
  function tryCompleteTrigger(uint8 target) internal virtual {
    // Find minimum evaluation timestamp of any implicit event
    uint256 min = TOP_TIMESTAMP;
    uint8 minIndex = 0;
    for (uint8 i = 0; i < events.length; i++) {
      if (events[i].definition != EventDefinition.EXPLICIT) {
        if (evals[i] < min) {
          min = evals[i];
          minIndex = i;
        }
      }
    }

    // At this point, we should have an evaluation (maybe TOP_TIMESTAMP) for
    // each implicit event. If not, something internal went wrong.
    assert(min > 0);

    bool canTrigger = false;
    uint8 toTrigger = 0;
    if (events[target].definition == EventDefinition.EXPLICIT &&
        evals[target] <= min) {
      // If target is explicit and no implicit one fired before, trigger it
      canTrigger = true;
      toTrigger = target;
    } else {
      // Otherwise, fire the implicit one with the lowest timestamp if possible
      // and prefer the target at the same time
      if (min < TOP_TIMESTAMP) {
        canTrigger = true;
        if (events[target].definition != EventDefinition.EXPLICIT &&
            evals[target] == min) {
          toTrigger = target;
        } else {
          toTrigger = minIndex;
        }
      }
    }

    // Change the states of events according to the observations
    if (canTrigger) {
      winner = int8(toTrigger);
      emit Winner(toTrigger);
    }
  }

  function encodeCorrelation(uint8 index, uint8 target) internal pure returns (uint256) {
    return (uint256(index) << 8) | uint256(target);
  }

  function decodeCorrelation(uint256 correlation) internal pure returns (uint8, uint8) {
    return (uint8(correlation >> 8), uint8(correlation));
  }
}
