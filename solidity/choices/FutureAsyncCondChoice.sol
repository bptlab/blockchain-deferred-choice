// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/FutureAsyncCondOracle.sol";

contract FutureAsyncCondChoice is AbstractChoice, OracleBoolConsumer {
  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  function activateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      // Subscribe to publish/subscribe oracles.
      // Set correlation target as this event itself, since we never call pub/
      // sub oracles again later during the triggering of a concrete other event.
      uint256 correlation = encodeCorrelation(index, index);
      FutureAsyncCondOracle(events[index].oracle).get(correlation, events[index].condition);
      return;
    }

    super.activateEvent(index);
  }

  function tryCompleteTrigger(uint8 target) internal override {
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0) {
        emit Debug("Missing initial oracle evaluations");
        return;
      }
    }
    super.tryCompleteTrigger(target);
  }

  function oracleCallback(uint256 correlation, bool value) external override {
    // Do nothing if we have already finished
    if (winner >= 0) {
      return;
    }

    (uint8 index, uint8 target) = decodeCorrelation(correlation);

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
      evaluateEvent(i, target);
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }
}
