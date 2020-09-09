// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/PastAsyncCondOracle.sol";

contract PastAsyncCondChoice is AbstractAsyncChoice {

  constructor(Event[] memory specs) AbstractAsyncChoice(specs) {
  }

  function oracleCallback(uint256 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);
    uint256 value = abi.decode(result, (uint256));

    evals[index] = value;
    tryCompleteTrigger();
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      PastAsyncCondOracle(events[index].oracle).query(
        index,
        abi.encode(events[index].expression, activationTime)
      );
      evals[index] = 0;
      return;
    }

    super.evaluateEvent(index);
  }
}
