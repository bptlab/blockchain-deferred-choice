// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

contract RequestResponseOracle is AsyncOracle {
  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.ASYNC,
      OracleTense.PRESENT,
      OraclePattern.STANDARD
    );
  }

  function get(uint256 correlation, bytes calldata params) external override {
    emit Query(msg.sender, correlation, params);
  }
}

contract PublishSubscribeOracle is AsyncOracle {
  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.ASYNC,
      OracleTense.FUTURE,
      OraclePattern.STANDARD
    );
  }

  function get(uint256 correlation, bytes calldata params) external override {
    emit Query(msg.sender, correlation, params);
  }
}

contract StorageOracle is SyncOracle {
  int256 value;

  function specification() external pure override returns (OracleSpecification memory) {
    return OracleSpecification(
      OracleMode.SYNC,
      OracleTense.PRESENT,
      OraclePattern.STANDARD
    );
  }

  function set(int256 newValue) external {
    value = newValue;
  }

  function get(bytes calldata) external override returns (bytes memory results) {
    results = abi.encode(value);
  }
}

// contract HistoryOracle is SyncOracle {
//   int256[] values;

//   function set(int256 newValue) external {
//     values.push(block.timestamp);
//     values.push(newValue);
//   }

//   function get(bytes calldata) external override returns (bytes memory results) {
//     //TODO return all values from 'from' given in calldata
//   }
// }


