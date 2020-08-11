// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

/*
 * General base interface with structures and enumerations which all contracts
 * regularly need access to.
 */
abstract contract Base {
  struct Condition {
    Operator operator;
    uint256 value;
  }

  uint256 constant TOP_TIMESTAMP = type(uint256).max;

  enum Operator {
    GREATER,
    GREATER_EQUAL,
    EQUAL,
    LESS_EQUAL,
    LESS
  }
}

abstract contract Oracle is Base {
}

interface OracleValueConsumer {
  function oracleCallback(uint256 correlation, uint256 value) external;
}

interface OracleBoolConsumer {
  function oracleCallback(uint256 correlation, bool result) external;
}

interface OracleValueArrayConsumer {
  function oracleCallback(uint256 correlation, uint256[] calldata values) external;
}
