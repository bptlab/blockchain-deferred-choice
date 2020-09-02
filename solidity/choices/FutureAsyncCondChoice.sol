// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractAsyncChoice.sol";
import "./../oracles/FutureAsyncCondOracle.sol";

contract FutureAsyncCondChoice is AbstractAsyncChoice, OracleBoolConsumer {
  constructor(Event[] memory specs) AbstractAsyncChoice(specs) public {
  }

  function activateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      // Subscribe to publish/subscribe oracles.
      FutureAsyncCondOracle(events[index].oracle).get(index, events[index].expression);
      evals[index] = TOP_TIMESTAMP;
      return;
    }

    super.activateEvent(index);
  }

  function oracleCallback(uint256 correlation, bool value) external override {
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
    if (value) {
      evals[index] = block.timestamp;
    } else {
      evals[index] = TOP_TIMESTAMP;
    }

    // Additionally, re-evaluate all timer events since they may have become true
    // by now. We have to do this here since oracle callbacks are independent of any
    // concrete trigger attempt in the FutureAsync scenario.
    for (uint8 i = 0; i < events.length; i++) {
      evaluateEvent(i);
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger();
  }
}
