// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

abstract contract AbstractChoice is Base {
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
    EXPLICIT
  }

  struct EventSpecification {
    EventDefinition definition;
    // Timer specification
    uint256 timer;
    // Conditional specification
    address oracle;
    Base.Condition condition;
  }

  // Structures
  struct Event {
    EventSpecification spec;
    EventState state;
    uint256 evaluation;
  }

  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  // Member Variables
  uint256 public activationTime = 0;
  Event[] public events;
  bool public hasFinished = false;

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
  function activate() external {
    // Revert if it has been activated already
    if (activationTime > 0) {
      revert("Deferred choice can only be activated once");
    }

    // Remember the time of activation
    activationTime = block.timestamp;

    // Activate all events
    for (uint8 i = 0; i < events.length; i++) {
      changeState(i, EventState.ACTIVE);
      activateEvent(i);
    }

    emit Debug("Activated");
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

  function activateEvent(uint8 index) internal {
    if (events[index].spec.definition == EventDefinition.EXPLICIT) {
      // Explicit (message and signal) events, by default, evaluate to "the future" until
      // their concrete transaction is sent
      events[index].evaluation = TOP_TIMESTAMP;
      return;
    }

    // Otherwise, just evaluate them through the regular interfaces
    evaluateEvent(index, index);
  }

  /*
   * Evaluate the event with the given index, under the circumstance that the event at the target
   * index is currently attempting to trigger.
   */
  function evaluateEvent(uint8 index, uint8 target) internal {
    EventSpecification memory spec = events[index].spec;

    // For explicit events, we just "evaluate" them if they are the target
    if (spec.definition == EventDefinition.EXPLICIT) {
      if (index == target) {
        events[index].evaluation = block.timestamp;
      }
      return;
    }

    // Check if deadline has passed
    if (spec.definition == EventDefinition.TIMER_ABSOLUTE) {
      if (spec.timer <= block.timestamp) {
        if (spec.timer < activationTime) {
          events[index].evaluation = activationTime;
        } else {
          events[index].evaluation = spec.timer;
        }
      } else {
        events[index].evaluation = TOP_TIMESTAMP;
      }
      return;
    }

    // Check if enough time has passed since activation
    if (spec.definition == EventDefinition.TIMER_RELATIVE) {
      if (activationTime + spec.timer <= block.timestamp) {
        events[index].evaluation = activationTime + spec.timer;
      } else {
        events[index].evaluation = TOP_TIMESTAMP;
      }
    }
  }

  /*
   * This function will try to trigger the event with the target id. For that, all
   * other events are evaluated as well and the function only proceeds (potentially
   * asynchronously) when we can be sure that this event has "won" the race.
   */
  function tryTrigger(uint8 target) public {
    // Check if the call is valid
    if (hasFinished) {
      revert("Choice has already finished");
    }
    if (target >= events.length) {
      revert("Event with target index does not exist");
    }

    // Evaluate all events if necessary
    for (uint8 i = 0; i < events.length; i++) {
      if (events[i].evaluation > 0 && events[i].evaluation < TOP_TIMESTAMP) {
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
  function tryCompleteTrigger(uint8 target) internal {
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
