// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";

abstract contract AbstractCallbackCounterChoice is AbstractChoice {
  uint8 public callbackCount = 0;

  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  function trigger(uint8 target) public override {
    if (callbackCount > 0) {
      revert("Another event is currently being tried");
    }
    super.trigger(target);
  }

  function tryCompleteTrigger(uint8 target) internal override {
    // We can only complete the trigger if there are no oracle values left to receive
    if (callbackCount > 0) {
      emit Debug("Missing required oracle evaluations");
      return;
    }
    super.tryCompleteTrigger(target);
  }
}
