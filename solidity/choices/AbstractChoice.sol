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
    TIMER,
    CONDITIONAL,
    EXPLICIT
  }

  struct Event {
    EventDefinition definition;
    // Timer specification
    uint256 timer;
    // Conditional specification
    address oracle;
    Base.Expression expression;
  }

  // Member Variables
  Event[] events;
  uint256 public activationTime = 0;
  mapping(uint8 => uint256) public evals;
  int8 public winner = -1;
  uint8 public target = type(uint8).max;

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
    evaluateEvent(index);
  }

  /*
   * Evaluate the event with the given index, under the circumstance that the event at the target
   * index is currently attempting to trigger.
   */
  function evaluateEvent(uint8 index) internal virtual {
    Event memory e = events[index];

    // For explicit events, we just "evaluate" them if they are the target
    if (e.definition == EventDefinition.EXPLICIT) {
      if (index == target) {
        evals[index] = block.timestamp;
      }
      return;
    }

    // Check if deadline has passed
    if (e.definition == EventDefinition.TIMER) {
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
  }

  /*
   * This function will try to trigger the event with the target id. For that, all
   * other events are evaluated as well and the function only proceeds (potentially
   * asynchronously) when we can be sure that this event has "won" the race.
   */
  function trigger(uint8 targetEvent) public {
    // Check if the call is valid
    if (target < events.length) {
      revert("Another target is currently being triggered");
    }
    if (winner >= 0) {
      revert("Choice has already finished");
    }
    if (targetEvent >= events.length) {
      revert("Event with target index does not exist");
    }
    target = targetEvent;

    // Evaluate all events if necessary
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0 || evals[i] == TOP_TIMESTAMP) {
        evaluateEvent(i);
      }
    }

    // Try to complete the triggering of this event
    tryCompleteTrigger();
  }

  /*
   * This function completes the current trigger attempt if possible by either completing
   * or aborting the target event.
   */
  function tryCompleteTrigger() internal virtual {
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

    uint8 toTrigger = uint8(events.length);

    // Check if the target can be triggered
    if (target < events.length && evals[target] <= min && evals[target] < TOP_TIMESTAMP) {
      toTrigger = target;
    } else if (min < TOP_TIMESTAMP) {
      // Otherwise, fire the implicit one with the lowest timestamp if there is one
      toTrigger = minIndex;
    }

    // Change the states of events according to the observations
    if (toTrigger < events.length) {
      winner = int8(toTrigger);
      emit Winner(toTrigger);
    }
    target = type(uint8).max;
  }
}
