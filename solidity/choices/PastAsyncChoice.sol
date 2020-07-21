// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";
import "./../oracles/PastAsyncOracle.sol";

contract PastAsyncChoice is AbstractChoice, OracleValueArrayConsumer {
  uint8 public callbackCount = 0;

  constructor(EventSpecification[] memory specs) AbstractChoice(specs) public {
  }

  function tryTrigger(uint8 target) public override {
    if (callbackCount > 0) {
      revert("Another event is currently being tried");
    }
    super.tryTrigger(target);
  }

  function tryCompleteTrigger(uint8 target) internal override {
    // We can only complete the trigger if there are no oracle values left to receive
    if (callbackCount > 0) {
      emit Debug("Missing required oracle evaluations");
      return;
    }
    super.tryCompleteTrigger(target);
  }

  function oracleCallback(uint256 correlation, uint256[] calldata values) external override {
    callbackCount--;

    // Do nothing if we have already finished
    if (hasFinished) {
      return;
    }

    uint8 target = uint8(correlation);
    uint8 index = uint8(correlation >> 8);

    // Find the first of those values which fulfilled the condition
    for (uint16 i = 0; i < values.length; i += 2) {
      if (checkCondition(events[index].spec.condition, values[i+1])) {
        if (values[i] < activationTime) {
          events[index].evaluation = activationTime;
        } else {
          events[index].evaluation = values[i];
        }
        break;
      }
      if (events[index].evaluation == 0) {
        events[index].evaluation = TOP_TIMESTAMP;
      }
    }

    // Try to trigger the correlated original target of this trigger attempt
    tryCompleteTrigger(target);
  }

  function evaluateEvent(uint8 index, uint8 target) internal override {
    EventSpecification memory spec = events[index].spec;

    if (spec.definition == EventDefinition.CONDITIONAL) {
      uint256 correlation = uint256(target) | (uint256(index) << 8);
      PastAsyncOracle(spec.oracle).get(correlation, activationTime);
      callbackCount++;
      return;
    }

    super.evaluateEvent(index, target);
  }
}
