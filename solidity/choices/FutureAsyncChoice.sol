// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../AbstractChoice.sol";
import "./../Oracles.sol";

contract FutureAsyncChoice is AbstractChoice, OracleValueConsumer {
  constructor(EventSpecification[] memory specs) AbstractChoice(specs) public {
  }

  function activateEvent(uint8 index) internal override {
    if (events[index].spec.definition == EventDefinition.CONDITIONAL) {
      // Subscribe to publish/subscribe oracles.
      // Set correlation target as this event itself, since we never call pub/
      // sub oracles again later during the triggering of a concrete other event.
      uint256 correlation = uint256(index) | (uint256(index) << 8);
      FutureAsyncOracle(events[index].spec.oracle).get(correlation);
      return;
    }

    super.activateEvent(index);
  }

  function oracleCallback(address oracle, uint256 correlation, uint256 value) external override {
    uint8 target = uint8(correlation);
    uint8 index = uint8(correlation >> 8);

    // Do nothing if we have already finished
    if (hasFinished) {
      return;
    }

    // Do nothing if the event this oracle belongs to has been evaluated already
    // (this filters out duplicate callbacks, or late pub/sub calls)
    if (events[index].evaluation > 0 && events[index].evaluation < TOP_TIMESTAMP) {
      return;
    }

    // Check the conditional event this oracle belongs to
    if (checkCondition(events[index].spec.condition, value)) {
      events[index].evaluation = block.timestamp;
    } else {
      events[index].evaluation = TOP_TIMESTAMP;
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }
}
