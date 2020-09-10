// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractSyncChoice.sol";
import "./../oracles/PresentSyncCondOracle.sol";

contract PresentSyncCondChoice is AbstractSyncChoice {
  constructor(Event[] memory specs) AbstractSyncChoice(specs) {
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      bool result = abi.decode(
        PresentSyncCondOracle(events[index].oracle).query(abi.encode(
          events[index].expression
        )),
        (bool)
      );
      if (result) {
        evals[index] = block.timestamp;
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index);
  }
}
