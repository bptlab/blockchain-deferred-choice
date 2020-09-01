// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PastSyncOracle.sol";

contract PastSyncChoice is AbstractChoice, ExpressionChecker {
  constructor(Event[] memory specs) AbstractChoice(specs) public {
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    if (events[index].definition == EventDefinition.CONDITIONAL) {
      uint256[] memory values = PastSyncOracle(events[index].oracle).get(activationTime);
      for (uint16 i = 0; i < values.length; i += 2) {
        if (checkExpression(events[index].expression, values[i+1])) {
          if (values[i] < activationTime) {
            evals[index] = activationTime;
          } else {
            evals[index] = values[i];
          }
          break;
        }
      }
      if (evals[index] == 0) {
        evals[index] = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index, target);
  }
}
