// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PresentSyncOracle is SyncOracle {
  uint256 value;

  function set(bytes memory newValue) external override {
    value = abi.decode(newValue, (uint256));
  }

  function query(bytes memory) public view override returns (bytes memory result) {
    return abi.encode(value);
  }
}
