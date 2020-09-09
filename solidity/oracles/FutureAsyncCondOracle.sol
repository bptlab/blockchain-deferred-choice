// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract FutureAsyncCondOracle is AsyncOracle {
  event Query(
    address sender,
    uint256 correlation,
    Expression expression
  );

  function get(uint256 correlation, Expression calldata expression) external {
    emit Query(msg.sender, correlation, expression);
  }
}
