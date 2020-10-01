// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";

contract PresentAsyncChoice is AbstractAsyncChoice {

  uint256 triggerTime;

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) {
  }

  function activate(uint8 targetEvent) public override {
    super.activate(targetEvent);
    triggerTime = block.timestamp;
  }

  function trigger(uint8 targetEvent) public override {
    super.trigger(targetEvent);
    triggerTime = block.timestamp;
  }

  function oracleCallback(uint16 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    uint256 value = abi.decode(result, (uint256));

    // Check the conditional event this oracle belongs to
    if (checkExpression(events[index].expression, value)) {
      evals[index] = triggerTime;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      AsyncOracle(events[index].oracle).query(index, new bytes(0));
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
