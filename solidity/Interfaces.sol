// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

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

  enum OracleMode {
    SYNC,
    ASYNC
  }

  enum OracleTense {
    PRESENT,
    PAST,
    FUTURE
  }

  enum OraclePattern {
    STANDARD,
    CONDITIONAL
  }
}

interface Oracle is Base {
  struct OracleSpecification {
    OracleMode mode;
    OracleTense tense;
    OraclePattern pattern;
  }

  function specification() external pure returns (OracleSpecification memory);
}

abstract contract SyncOracle is Oracle {
  function get(bytes calldata params) external virtual returns (bytes memory results);
}

abstract contract AsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation,
    bytes params
  );

  function get(uint256 correlation, bytes calldata params) external {
    emit Query(msg.sender, correlation, params);
  }
}

// Consumer interfaces
interface OracleConsumer is Base {
  function oracleCallback(address oracle, uint256 correlation, bytes calldata results) external;
}

interface DeferredChoice is OracleConsumer {
  // Events
  event StateChanged(
    uint8 index,
    EventState newState
  );

  event Debug(string text);

  enum ChoiceState {
    CREATED,
    RUNNING,
    FINISHED
  }

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
