// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PresentSyncCondOracle is SyncOracle {
  uint256 value;

  function set(uint256 newValue) external override {
    value = newValue;
  }

  function query(bytes memory parameters) public view override returns (bytes memory result) {
    Expression memory expression = abi.decode(parameters, (Expression));
    return abi.encode(checkExpression(expression, value));
  }
}
