// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract FutureAsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation
  );

  function get(uint256 correlation) external {
    emit Query(msg.sender, correlation);
  }
}
