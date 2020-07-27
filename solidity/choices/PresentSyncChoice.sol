// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PresentSyncOracle.sol";

contract PresentSyncChoice is AbstractChoice {
  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 value = PresentSyncOracle(events[index].oracle).get();
      if (checkCondition(events[index].condition, value)) {
        evals[index] = block.timestamp;
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index, target);
  }
}
