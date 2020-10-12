// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastSyncOracle is SyncOracle {
  uint256[] public values;

  function set(bytes memory newValue) external override {
    values.push() = block.timestamp;
    values.push() = abi.decode(newValue, (uint256));
  }

  function query(bytes memory parameters) public view override returns (bytes memory result) {
    uint256 from = abi.decode(parameters, (uint256));

    uint16 first = 0;
    while (first + 2 < values.length && values[first + 2] < from) {
      first += 2;
    }

    uint256[] memory output = new uint256[](values.length - first);
    for (uint16 i = first; i < values.length; i++) {
      output[i - first] = values[i];
    }

    return abi.encode(output);
  }
}
