// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PresentAsyncOracle.sol";

contract PresentAsyncChoice is AbstractAsyncChoice, OracleValueConsumer, ExpressionChecker {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, uint256 value) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    (uint8 index, uint8 target) = decodeCorrelation(correlation);

    // Check the conditional event this oracle belongs to
    if (checkExpression(events[index].expression, value)) {
      evals[index] = block.timestamp;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    tryCompleteTrigger(target);
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 correlation = encodeCorrelation(index, target);
      PresentAsyncOracle(events[index].oracle).get(correlation);
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index, target);
  }
}
