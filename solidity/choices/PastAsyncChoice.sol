// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";

contract PastAsyncChoice is AbstractAsyncChoice {

  constructor(Event[] memory specs, bool transactionDriven) AbstractAsyncChoice(specs, transactionDriven) {
  }

  function oracleCallback(uint16 correlation, bytes calldata result) external override {
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
      AsyncOracle(events[index].oracle).query(index, abi.encode(activationTime));
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
