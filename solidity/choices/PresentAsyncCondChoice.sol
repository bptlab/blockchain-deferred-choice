// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PresentAsyncCondOracle.sol";

contract PresentAsyncCondChoice is AbstractAsyncChoice {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) {
  }

  function oracleCallback(uint16 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    bool checkResult = abi.decode(result, (bool));

    // Check the conditional event this oracle belongs to
    if (checkResult) {
      evals[index] = block.timestamp;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      PresentAsyncCondOracle(events[index].oracle).query(index, abi.encode(events[index].expression));
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
