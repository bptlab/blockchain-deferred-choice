// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./AbstractChoice.sol";

abstract contract AbstractAsyncChoice is AbstractChoice, OracleConsumer {

  constructor(Event[] memory specs, bool transactionDriven) AbstractChoice(specs, transactionDriven) {
  }

  function tryCompleteTrigger() internal override {
    for (uint8 i = 0; i < events.length; i++) {
      if (evals[i] == 0) {
        // #ifdef DEBUG
        emit Debug("Missing required event evaluations");
        // #endif
        return;
      }
    }
    super.tryCompleteTrigger();
  }
}
