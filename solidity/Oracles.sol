// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

// Storage oracle
contract PresentSyncOracle is SyncOracle {
  uint256 value;

  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.SYNC,
      OracleTense.PRESENT,
      OraclePattern.STANDARD
    );
  }

  function set(uint256 newValue) external {
    value = newValue;
  }

  function get(bytes calldata) external override returns (bytes memory results) {
    results = abi.encode(value);
  }
}

// Request-response oracle
contract PresentAsyncOracle is AsyncOracle {
  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.ASYNC,
      OracleTense.PRESENT,
      OraclePattern.STANDARD
    );
  }
}

// On-chain history oracle
contract PastSyncOracle is SyncOracle {
  uint256[] timedValues;

  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.SYNC,
      OracleTense.PAST,
      OraclePattern.STANDARD
    );
  }

  function set(uint256 newValue) external {
    timedValues.push() = block.timestamp;
    timedValues.push() = newValue;
  }

  function get(bytes calldata /* payload */) external override returns (bytes memory results) {
    //uint256 from = abi.decode(payload, (uint256));
    //TODO only from the given timestamp
    results = abi.encode(timedValues);
  }
}

// Request-response oracle
contract PastAsyncOracle is AsyncOracle {
  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.ASYNC,
      OracleTense.PAST,
      OraclePattern.STANDARD
    );
  }
}

// Publish-subscribe oracle
contract FutureAsyncOracle is AsyncOracle {
  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.ASYNC,
      OracleTense.FUTURE,
      OraclePattern.STANDARD
    );
  }
}
