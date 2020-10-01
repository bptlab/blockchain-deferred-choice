// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractSyncChoice.sol";

contract PresentSyncChoice is AbstractSyncChoice {
  constructor(Event[] memory specs) AbstractSyncChoice(specs) {
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256 value = abi.decode(
        SyncOracle(events[index].oracle).query(new bytes(0)),
        (uint256)
      );
      if (checkExpression(events[index].expression, value)) {
        evals[index] = block.timestamp;
      } else {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index);
  }
}
