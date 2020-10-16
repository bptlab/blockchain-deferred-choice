// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

abstract contract AbstractChoice is Choice, Base {
  // Events
  event Winner(uint8 winner);
  // #ifdef DEBUG
  event Debug(string);
  event DebugUint(uint256);
  event DebugLabeledUint(string, uint256);
  event DebugBool(bool);
  // #endif

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
  bool useTransactionDriven;

  constructor(Event[] memory specs, bool transactionDriven) {
    // We have to copy the specs array manually since Solidity does not yet
    // support copying whole memory arrays into storage arrays.
    for (uint8 i = 0; i < specs.length; i++) {
      events.push() = specs[i];
    }
    useTransactionDriven = transactionDriven;
  }

  function activate(uint8 targetEvent) public virtual override {
    if (activationTime > 0) {
      revert(
        // #ifdef DEBUG
        "Deferred choice can only be activated once"
        // #endif
      );
    }
    target = targetEvent;

    // Remember the time of activation
    activationTime = block.timestamp;

    // Activate all events
    for (uint8 i = 0; i < events.length; i++) {
      // Small "hack": for timer events, the timer value is actually the offset from
      // activation, which we have to change here. This accounts for the deployment
      // delay of the choice instances.
      if (events[i].definition == EventDefinition.TIMER) {
        events[i].timer += activationTime;
        // #ifdef DEBUG
        emit DebugUint(events[i].timer);
        // #endif
      }

      activateEvent(i);
    }

    // #ifdef DEBUG
    emit DebugLabeledUint("Activated", activationTime);
    // #endif

    // Try to complete the triggering of this event
    tryCompleteTrigger();
  }

  function activateEvent(uint8 index) internal virtual {
    if (events[index].definition == EventDefinition.EXPLICIT) {
      // Explicit (message and signal) events, by default, evaluate to "the future"
      // unless they are the immediate target of the activation
      if (index == target) {
        evals[index] = block.timestamp;
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
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
  function trigger(uint8 targetEvent) public virtual override {
    // Check if the call is valid
    if (activationTime == 0) {
      revert(
        // #ifdef DEBUG
        "Choice has not been activated yet"
        // #endif
      );
    }
    if (target < events.length) {
      revert(
        // #ifdef DEBUG
        "Another target is currently being triggered"
        // #endif
      );
    }
    if (winner >= 0) {
      revert(
        // #ifdef DEBUG
        "Choice has already finished"
        // #endif
      );
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
    // #ifdef DEBUG
    emit DebugLabeledUint("Try complete trigger", target);
    // #endif

    uint8 toTrigger = uint8(events.length);

    if (useTransactionDriven) {
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

      // Check if the target can be triggered
      if (target < events.length && evals[target] <= min && evals[target] < TOP_TIMESTAMP) {
        toTrigger = target;
      } else if (min < TOP_TIMESTAMP) {
        // Otherwise, fire the implicit one with the lowest timestamp if there is one
        toTrigger = minIndex;
      }
    } else {
      // Check if we can trigger the target
      if (target < events.length && evals[target] < TOP_TIMESTAMP) {
        toTrigger = target;
      } else {
        // If not, get the first event that can trigger
        for (uint8 i = 0; i < events.length; i++) {
          if (evals[i] < TOP_TIMESTAMP) {
            toTrigger = i;
            break;
          }
        }
      }
    }

    // Change the states of events according to the observations
    if (toTrigger < events.length) {
      winner = int8(toTrigger);
      emit Winner(toTrigger);
    }
    target = type(uint8).max;
  }
}
