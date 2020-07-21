// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./../AbstractChoice.sol";
import "./../Oracles.sol";

contract PastSyncChoice is AbstractChoice {
  constructor(EventSpecification[] memory specs) AbstractChoice(specs) public {
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    EventSpecification memory spec = events[index].spec;

    if (spec.definition == EventDefinition.CONDITIONAL) {
      uint256[] memory values = PastSyncOracle(spec.oracle).get(activationTime);
      for (uint16 i = 0; i < values.length; i += 2) {
        if (checkCondition(spec.condition, values[i+1])) {
          if (values[i] < activationTime) {
            events[index].evaluation = activationTime;
          } else {
            events[index].evaluation = values[i];
          }
          break;
        }
      }
      if (events[index].evaluation == 0) {
        events[index].evaluation = TOP_TIMESTAMP;
      }
      return;
    }

    super.evaluateEvent(index, target);
  }
}
