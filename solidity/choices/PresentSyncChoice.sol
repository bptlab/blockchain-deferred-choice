// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PresentSyncOracle.sol";

contract PresentSyncChoice is AbstractChoice {
  constructor(EventSpecification[] memory specs) AbstractChoice(specs) public {
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    EventSpecification memory spec = events[index].spec;

    if (spec.definition == EventDefinition.CONDITIONAL) {
      uint256 value = PresentSyncOracle(spec.oracle).get();
      if (checkCondition(spec.condition, value)) {
        events[index].evaluation = block.timestamp;
      } else {
        events[index].evaluation = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index, target);
  }
}
