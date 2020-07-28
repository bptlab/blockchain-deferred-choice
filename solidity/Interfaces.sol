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

interface Oracle is Base {
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
