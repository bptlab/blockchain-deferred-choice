// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PresentSyncOracle is SyncOracle {
  uint256 value;

  function set(uint256 newValue) external {
    value = newValue;
  }

  function get() external view returns (uint256) {
    return value;
  }
}
