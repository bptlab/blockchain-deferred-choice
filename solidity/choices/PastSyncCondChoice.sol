// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractSyncChoice.sol";
import "./../oracles/PastSyncCondOracle.sol";

contract PastSyncCondChoice is AbstractSyncChoice {
  constructor(Event[] memory specs) AbstractSyncChoice(specs) public {
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      evals[index] = PastSyncCondOracle(events[index].oracle).get(activationTime, events[index].expression);
      return;
    }

    super.evaluateEvent(index);
  }
}
