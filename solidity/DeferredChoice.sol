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

    enum Operator {
        GREATER,
        GREATER_EQUAL,
        EQUAL,
        LESS_EQUAL,
        LESS
    }

    // Structures
    struct Comparison {
        Operator operator;
        int256 value;
    }

    struct Event {
        uint8 index;
        EventDefinition definition;
        EventState state;
        // Timer specification
        uint256 timer;
        // Conditional specification
        Oracle oracle;
        Comparison comparison;
    }

    struct Step {
        Event target;
        uint256 timestamp;
        mapping(Oracle => bool) oracleAnswers;
        mapping(Oracle => uint256) oracleEvaluations;
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
            Oracle(0x4AB4A096bBfDA3156a7f95c0c8002Bb05f3722D0),
            Comparison(
                Operator.LESS,
                10
            )
        ));
    }

    function activate() external {
        // TODO get time, maybe with callback
        activationTime = block.timestamp;

        for (uint8 i = 0; i < events.length; i++) {
            changeState(events[i], EventState.ACTIVE);
        }

        emit Debug("Activated");
    }

    function changeState(Event storage e, EventState newState) internal {
        e.state = newState;
        emit StateChanged(e.index, newState);
    }

    function startStep(uint8 index) hasNotFinished() external {
        if (index >= events.length) {
            revert("Event index does not exist");
        }

        uint16 step = stepCounter;
        stepCounter++;
        steps[step] = Step(events[index], 0);

        acquireTimestamp(step);
        acquireOracleEvaluations(step);

        tryCompleteStep(step);
    }

    function acquireTimestamp(uint16 step) private {
        // TODO update with other methods of getting the current timestamp
        steps[step].timestamp = block.timestamp;
    }

    function acquireOracleEvaluations(uint16 step) private {
        for (uint8 i = 0; i < events.length; i++) {
            if (events[i].definition == EventDefinition.CONDITIONAL) {
                (bool hasCallback, int256 value) = events[i].oracle.getValue(step);
                if (!hasCallback) {
                    evaluateOracle(step, events[i].oracle, value);
                }
            }
        }
    }

    function oracleCallback(Oracle oracle, uint256 correlation, int256 value) external override {
        uint16 step = uint16(correlation);
        evaluateOracle(step, oracle, value);
        tryCompleteStep(step);
    }

    function evaluateOracle(uint16 step, Oracle oracle, int256 value) private {
        emit Debug("Oracle evaluated");

        bool result = false;
        Comparison storage c = steps[step].target.comparison;
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

        steps[step].oracleAnswers[oracle] = true;
        if (result) {
            // TODO proper timestamp
            steps[step].oracleEvaluations[oracle] = block.timestamp;
        }
    }

    function tryCompleteStep(uint16 step) private {
        emit Debug("Trying to complete step");

        // We need to have a timestamp
        if (steps[step].timestamp == 0) {
            return;
        }

        // We need to have all oracle evaluation timestamps, if any
        for (uint8 i = 0; i < events.length; i++) {
            if (events[i].definition == EventDefinition.CONDITIONAL) {
                if (!steps[step].oracleAnswers[events[i].oracle]) {
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
