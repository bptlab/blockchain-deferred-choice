// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

/*
 * General base interface with structures and enumerations which all contracts
 * regularly need access to.
 */
interface Base {
  struct Condition {
    Operator operator;
    uint256 value;
  }

  enum Operator {
    GREATER,
    GREATER_EQUAL,
    EQUAL,
    LESS_EQUAL,
    LESS
  }
}

/*
 * Base interface for all oracles, including ways to get the concrete specification.
 */
interface Oracle is Base {
}

interface OracleValueConsumer is Base {
  function oracleCallback(address oracle, uint256 correlation, uint256 value) external;
}

interface OracleValueArrayConsumer is Base {
  function oracleCallback(address oracle, uint256 correlation, uint256[] calldata values) external;
}

interface DeferredChoice {
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

  function activate() external;
  function tryTrigger(uint8 target) external;
}
