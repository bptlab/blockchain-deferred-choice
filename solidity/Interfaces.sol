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

/*
 * Base interface for all oracles, including ways to get the concrete specification.
 */
interface Oracle is Base {
  struct OracleSpecification {
    OracleMode mode;
    OracleTense tense;
    OraclePattern pattern;
  }

  function specification() external pure returns (OracleSpecification memory);
}

/*
 * Base interface for synchronous oracles.
 */
abstract contract SyncOracle is Oracle {
  /*
   * Get the current value of the oracle.
   * Optionally, concrete oracles may require further abi encoded parameters.
   * Results are returned abi encoded as well.
   */
  function get(bytes calldata params) external virtual returns (bytes memory results);
}

/*
 * Base interface for asynchronous oracles.
 */
abstract contract AsyncOracle is Oracle {
  /*
   * Event that is fired when a query (request, subscription, ...) is registered.
   */
  event Query(
    address sender,
    uint256 correlation,
    bytes params
  );

  /*
   * Get the current value of the oracle in a later callback (see OracleConsumer).
   * The additional correlation information can be used to correlate the later callback to
   * the concrete query in the consumer smart contract.
   * Optionally, concrete oracles may require further abi encoded parameters.
   */
  function get(uint256 correlation, bytes calldata params) external {
    emit Query(msg.sender, correlation, params);
  }
}

/*
 * Base interface for oracle consumers who wish to receive asynchronous callbacks.
 */
interface OracleConsumer is Base {
  /*
   * Called by asynchronous oracles with the results of a query.
   * The address identifies the oracle which was originally called.
   * The correlation information will be the same as the one specified when querying the oracle.
   * The results are provided as an abi encoded bytes array.
   */
  function oracleCallback(address oracle, uint256 correlation, bytes calldata results) external;
}

interface DeferredChoice is OracleConsumer {
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
