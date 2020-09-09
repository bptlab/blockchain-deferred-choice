// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PresentAsyncOracle.sol";

contract PresentAsyncChoice is AbstractAsyncChoice, ExpressionChecker {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    uint256 value = abi.decode(result, (uint256));

    // Check the conditional event this oracle belongs to
    if (checkExpression(events[index].expression, value)) {
      evals[index] = block.timestamp;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      PresentAsyncOracle(events[index].oracle).get(index);
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
