// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./Interfaces.sol";

// Storage oracle
contract PresentSyncOracle is Oracle {
  uint256 value;

  function set(uint256 newValue) external {
    value = newValue;
  }

  function get() external view returns (uint256) {
    return value;
  }
}

// Request-response oracle
contract PresentAsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation
  );

  function get(uint256 correlation) external {
    emit Query(msg.sender, correlation);
  }
}

// On-chain history oracle
contract PastSyncOracle is Oracle {
  uint256[] public values;

  function set(uint256 newValue) external {
    values.push() = block.timestamp;
    values.push() = newValue;
  }

  function get(uint256 from) external view returns (uint256[] memory) {
    uint16 first = 0;
    while (first + 2 < values.length && values[first + 2] < from) {
      first += 2;
    }

    uint256[] memory output = new uint256[](values.length - first);
    for (uint16 i = first; i < values.length; i++) {
      output[i - first] = values[i];
    }
    return output;
  }
}

// Request-response oracle
contract PastAsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation,
    uint256 from
  );

  function get(uint256 correlation, uint256 from) external {
    emit Query(msg.sender, correlation, from);
  }
}

// Publish-subscribe oracle
contract FutureAsyncOracle is Oracle {
  event Query(
    address sender,
    uint256 correlation
  );

  function get(uint256 correlation) external {
    emit Query(msg.sender, correlation);
  }
}
