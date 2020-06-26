// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;

import "./Interfaces.sol";

contract DeferredChoice is OracleConsumer {

    // Events
    event StateChanged(
        uint8 index,
        EventState newState
    );

    event Started();

    // Enumerations
    enum EventState {
        INACTIVE,
        ACTIVE,
        COMPLETED,
        ABORTED
    }

    enum EventDefinition {
        TimerAbsolute,
        TimerRelative,
        Conditional,
        Message,
        Signal
    }

    enum Operator {
        Greather,
        GreaterOrEqual,
        Equal,
        LessOrEqual,
        Less
    }

    // Structures
    struct Comparison {
        Operator operator;
        uint256 comparison;
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
        mapping(Oracle => uint256) oracleTimestamp;
    }

    // Member Variables
    uint256 activationTime;
    uint16 stepCounter = 0;
    mapping(uint16 => Step) steps;

    Event[] events;

    // Functions
    constructor() public {

    }

    function activate() external {
        // TODO get time, maybe with callback
        activationTime = block.timestamp;

        for (uint8 i = 0; i < events.length; i++) {
            changeState(events[i], EventState.ACTIVE);
        }
    }

    function changeState(Event storage e, EventState newState) internal {
        e.state = newState;
        emit StateChanged(e.index, newState);
    }

    function startStep(uint8 index) external {
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
            if (events[i].definition == EventDefinition.Conditional) {
                // TODO get oracle value
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
        // TODO do something with value, i.e., the evaluation
        steps[step].oracleTimestamp[oracle] = block.timestamp;
    }

    function tryCompleteStep(uint16 step) private {
        // We need to have a timestamp
        if (steps[step].timestamp == 0) {
            return;
        }

        // We need to have all oracle evaluation timestamps, if any
        for (uint8 i = 0; i < events.length; i++) {
            if (events[i].definition == EventDefinition.Conditional) {
                if (steps[step].oracleTimestamp[events[i].oracle] == 0) {
                    return;
                }
            }
        }

        // Good to go!
        completeStep(step);
    }

    function completeStep(uint16 step) private {
        // TODO find set of events with lowest timestamp and check if the target is one of them
        changeState(steps[step].target, EventState.COMPLETED);
    }
}
