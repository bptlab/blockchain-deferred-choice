// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastSyncOracle is Oracle {
  uint256[] public values;

  function set(uint256 newValue) external {
    values.push() = block.timestamp;
    values.push() = newValue;
  }

  function get(uint256 from) external view returns (uint256[] memory) {
    uint16 first = 0;
    while (first + 2 < values.length && values[first + 2] < from) {
      first += 2;
    }

    uint256[] memory output = new uint256[](values.length - first);
    for (uint16 i = first; i < values.length; i++) {
      output[i - first] = values[i];
    }
    return output;
  }
}
