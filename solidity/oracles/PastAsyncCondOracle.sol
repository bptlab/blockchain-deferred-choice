// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PastAsyncCondOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation,
    Condition condition,
    uint256 from
  );

  function get(uint256 correlation, Condition calldata condition, uint256 from) external {
    emit Query(msg.sender, correlation, condition, from);
  }
}
