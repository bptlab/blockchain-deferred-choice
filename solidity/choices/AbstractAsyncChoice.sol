// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";

abstract contract AbstractAsyncChoice is AbstractChoice {

  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  // function trigger(uint8 target) public override {
  //   // Do we need something like this?
  //   // if (callbackCount > 0) {
  //   //   revert("Another event is currently being tried");
  //   // }
  //   super.trigger(target);
  // }

  function tryCompleteTrigger(uint8 target) internal override {
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0) {
        emit Debug("Missing required event evaluations");
        return;
      }
    }
    super.tryCompleteTrigger(target);
  }
}
