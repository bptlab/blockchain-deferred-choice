// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PresentAsyncOracle.sol";

contract PresentAsyncChoice is AbstractChoice, OracleValueConsumer {
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
    if (callbackCount > 0) {
      emit Debug("Missing required oracle evaluations");
      return;
    }
    super.tryCompleteTrigger(target);
  }

  function oracleCallback(uint256 correlation, uint256 value) external override {
    callbackCount--;

    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 target = uint8(correlation);
    uint8 index = uint8(correlation >> 8);

    // Check the conditional event this oracle belongs to
    if (checkCondition(events[index].condition, value)) {
      evals[index] = block.timestamp;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 correlation = uint256(target) | (uint256(index) << 8);
      PresentAsyncOracle(events[index].oracle).get(correlation);
      callbackCount++;
      return;
    }

    super.evaluateEvent(index, target);
  }
}
