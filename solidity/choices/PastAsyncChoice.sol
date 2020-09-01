// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractCallbackCounterChoice.sol";
import "./../oracles/PastAsyncOracle.sol";

contract PastAsyncChoice is AbstractCallbackCounterChoice, OracleValueArrayConsumer {

  constructor(Event[] memory specs) AbstractCallbackCounterChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, uint256[] calldata values) external override {
    callbackCount--;

    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    (uint8 index, uint8 target) = decodeCorrelation(correlation);

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
    tryCompleteTrigger(target);
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 correlation = encodeCorrelation(index, target);
      PastAsyncOracle(events[index].oracle).get(correlation, activationTime);
      callbackCount++;
      return;
    }

    super.evaluateEvent(index, target);
  }
}
