// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";

abstract contract AbstractSyncChoice is AbstractChoice {

  constructor(Event[] memory specs) AbstractChoice(specs) {
  }

}
