// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PresentSyncOracle is SyncOracle {
  uint256 value;

  function set(uint256 newValue) external override {
    value = newValue;
  }

  function query(bytes memory) public view override returns (bytes memory result) {
    return abi.encode(value);
  }
}
