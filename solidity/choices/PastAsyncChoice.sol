// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PastAsyncOracle.sol";

contract PastAsyncChoice is AbstractAsyncChoice, ExpressionChecker {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    uint256[] memory values = abi.decode(result, (uint256[]));

    // Find the first of those values which fulfilled the expression
    for (uint16 i = 0; i < values.length; i += 2) {
      if (checkExpression(events[index].expression, values[i+1])) {
        if (values[i] < activationTime) {
          evals[index] = activationTime;
        } else {
          evals[index] = values[i];
        }
        break;
      }
    }
    if (evals[index] == 0) {
      evals[index] = TOP_TIMESTAMP;
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      PastAsyncOracle(events[index].oracle).get(index, activationTime);
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
