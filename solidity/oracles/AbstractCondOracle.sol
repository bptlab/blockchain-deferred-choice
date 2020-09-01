// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

abstract contract AbstractCondOracle is Oracle {
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
