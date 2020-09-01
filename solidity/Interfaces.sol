// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

/*
 * General base interface with structures and enumerations which all contracts
 * regularly need access to.
 */
abstract contract Base {
  struct Expression {
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

abstract contract SyncChoice is Base {
}

abstract contract AsyncChoice is Base {
}

abstract contract SyncOracle is Base {
}

abstract contract AsyncOracle is Base {
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

abstract contract ExpressionChecker is Base {
  /*
   * Helper function that returns true if the given expression is satisfied by the value.
   */
  function checkExpression(Expression memory c, uint256 value) internal pure returns (bool result) {
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
}
