// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PastAsyncCondOracle.sol";

contract PastAsyncCondChoice is AbstractAsyncChoice, OracleValueConsumer {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) public {
  }

  function oracleCallback(uint256 correlation, uint256 value) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    evals[index] = value;
    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      PastAsyncCondOracle(events[index].oracle).get(index, events[index].expression, activationTime);
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
