// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

interface Base {
  struct Condition {
    Operator operator;
    int256 value;
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

interface SyncOracle is Oracle {
  function get(bytes calldata params) external returns (bytes memory results);
}

interface AsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation,
    bytes params
  );
  function get(uint256 correlation, bytes calldata params) external;
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

  function activate() external;
  function tryTrigger(uint8 target) external;
}

// // Present oracles
// interface SyncPresentOracle is Oracle {
//   // Storage oracle
//   function get() external returns (int256 value);
// }

// interface SyncPresentConditionalOracle is Oracle {
//   // Conditional storage oracle
//   function get(Condition memory condition) external returns (bool result);
// }

// interface AsyncPresentOracle is Oracle {
//   // Request/response oracle
//   function get(uint16 correlation) external;
// }

// interface AsyncPresentConditionalOracle is Oracle {
//   // Request/response oracle
//   function get(uint16 correlation, Condition memory condition) external;
// }

// // Past oracles
// interface SyncPastOracle is Oracle {
//   // On-chain history oracle
//   function get(uint256 from) external returns (bytes memory values);
// }

// interface SyncPastConditionalOracle is Oracle {
//   // Conditional on-chain history oracle
//   function get(uint256 from, Condition memory condition) external returns (bool result, uint256 timestamp);
// }

// interface AsyncPastOracle is Oracle {
//   // Off-chain history oracle
//   function get(uint16 correlation, uint256 from) external;
// }

// interface AsyncPastConditionalOracle is Oracle {
//   // Conditional off-chain history oracle
//   function get(uint16 correlation, uint256 from, Condition memory condition) external;
// }

// // Future oracles
// interface AsyncFutureOracle is Oracle {
//   // Publish/subscribe oracle
//   function get(uint16 correlation) external;
// }

// interface AsyncFutureConditionalOracle is Oracle {
//   // Conditional publish/subscribe oracle
//   function get(uint16 correlation, Condition memory condition) external;
// }
