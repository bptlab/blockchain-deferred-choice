// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/FutureAsyncOracle.sol";

contract FutureAsyncChoice is AbstractAsyncChoice {
  constructor(Event[] memory specs) AbstractAsyncChoice(specs) {
  }

  function activateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      // Subscribe to publish/subscribe oracles.
      FutureAsyncOracle(events[index].oracle).query(index, new bytes(0));
      evals[index] = 0;
      return;
    }

    super.activateEvent(index);
  }

  function oracleCallback(uint16 correlation, bytes calldata result) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    uint8 index = uint8(correlation);

    // Do nothing if the event this oracle belongs to has been evaluated already
    // (this filters out duplicate callbacks, or late pub/sub calls)
    if (evals[index] > 0 && evals[index] < TOP_TIMESTAMP) {
      return;
    }

    // Check the conditional event this oracle belongs to
    uint256 value = abi.decode(result, (uint256));
    if (checkExpression(events[index].expression, value)) {
      if (evals[index] == 0) {
        evals[index] = activationTime;
      } else {
        evals[index] = block.timestamp;
      }
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    // Additionally, re-evaluate all timer events since they may have become true
    // by now. We have to do this here since oracle callbacks are independent of any
    // concrete trigger attempt in the FutureAsync scenario.
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0 || evals[i] == TOP_TIMESTAMP) {
        evaluateEvent(i);
      }
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger();
  }
}
