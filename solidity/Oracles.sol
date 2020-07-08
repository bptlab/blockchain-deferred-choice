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
  uint256[] public timedValues;

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

  function get(bytes calldata params) external override returns (bytes memory results) {
    uint256 from = abi.decode(params, (uint256));
    uint16 first = 0;

    while (first + 2 < timedValues.length && timedValues[first + 2] < from) {
      first += 2;
    }

    uint256[] memory output = new uint256[](timedValues.length - first);
    for (uint16 i = first; i < timedValues.length; i++) {
      output[i - first] = timedValues[i];
    }
    results = abi.encode(output);
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
