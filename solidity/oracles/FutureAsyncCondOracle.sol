// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract FutureAsyncCondOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation,
    Condition condition
  );

  function get(uint256 correlation, Condition calldata condition) external {
    emit Query(msg.sender, correlation, condition);
  }
}
