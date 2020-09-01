// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractCallbackCounterChoice.sol";
import "./../oracles/PastAsyncCondOracle.sol";

contract PastAsyncCondChoice is AbstractCallbackCounterChoice, OracleValueConsumer {

  constructor(Event[] memory specs) AbstractCallbackCounterChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, uint256 value) external override {
    callbackCount--;

    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    (uint8 index, uint8 target) = decodeCorrelation(correlation);
    evals[index] = value;
    tryCompleteTrigger(target);
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 correlation = encodeCorrelation(index, target);
      PastAsyncCondOracle(events[index].oracle).get(correlation, events[index].expression, activationTime);
      callbackCount++;
      return;
    }

    super.evaluateEvent(index, target);
  }
}
