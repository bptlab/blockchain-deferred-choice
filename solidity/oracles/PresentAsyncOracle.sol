// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./../Interfaces.sol";

contract PresentAsyncOracle is AsyncOracle {
  event Query(
    address sender,
    uint256 correlation
  );

  function get(uint256 correlation) external {
    emit Query(msg.sender, correlation);
  }
}
