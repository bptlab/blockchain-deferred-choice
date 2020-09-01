// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastSyncCondOracle is SyncOracle, ExpressionChecker {
  uint256[] public values;

  function set(uint256 newValue) external {
    values.push() = block.timestamp;
    values.push() = newValue;
  }

  function get(uint256 from, Expression calldata expression) external view returns (uint256 result) {
    uint16 first = 0;
    while (first + 2 < values.length && values[first + 2] < from) {
      first += 2;
    }

    while (first < values.length) {
      if (checkExpression(expression, values[first + 1])) {
        if (from > values[first]) {
          return from;
        } else {
          return values[first];
        }
      }
      first += 2;
    }
    return TOP_TIMESTAMP;
  }
}
