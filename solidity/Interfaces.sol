// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;

interface Oracle {
    function getValue(uint16) external returns (bool, int256);
}

interface OracleConsumer {
    function oracleCallback(Oracle oracle, uint256 correlation, int256 value) external;
}
