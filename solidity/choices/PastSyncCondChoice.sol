// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractSyncChoice.sol";
import "./../oracles/PastSyncCondOracle.sol";

contract PastSyncCondChoice is AbstractSyncChoice {
  constructor(Event[] memory specs) AbstractSyncChoice(specs) {
  }

  function evaluateEvent(uint8 index) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      evals[index] = abi.decode(
        PastSyncCondOracle(events[index].oracle).query(abi.encode(
          activationTime,
          events[index].expression
        )),
        (uint256)
      );
      return;
    }

    super.evaluateEvent(index);
  }
}
