// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastAsyncCondOracle is AsyncOracle {
  event Query(
    address sender,
    uint256 correlation,
    Expression expression,
    uint256 from
  );

  function get(uint256 correlation, Expression calldata expression, uint256 from) external {
    emit Query(msg.sender, correlation, expression, from);
  }
}
