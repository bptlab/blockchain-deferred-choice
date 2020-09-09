// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastSyncCondOracle is SyncOracle {
  uint256[] public values;

  function set(uint256 newValue) external override {
    values.push() = block.timestamp;
    values.push() = newValue;
  }

  function query(bytes memory parameters) public view override returns (bytes memory result) {
    (uint256 from, Expression memory expression) = abi.decode(parameters, (uint256, Expression));

    uint16 first = 0;
    while (first + 2 < values.length && values[first + 2] < from) {
      first += 2;
    }

    while (first < values.length) {
      if (checkExpression(expression, values[first + 1])) {
        if (from > values[first]) {
          return abi.encode(from);
        } else {
          return abi.encode(values[first]);
        }
      }
      first += 2;
    }
    return abi.encode(TOP_TIMESTAMP);
  }
}
