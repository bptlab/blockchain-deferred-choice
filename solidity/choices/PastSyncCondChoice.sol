// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PastSyncCondOracle.sol";

contract PastSyncCondChoice is AbstractChoice {
  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      evals[index] = PastSyncCondOracle(events[index].oracle).get(activationTime, events[index].condition);
      return;
    }

    super.evaluateEvent(index, target);
  }
}
