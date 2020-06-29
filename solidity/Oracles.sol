// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.9;

import "./Interfaces.sol";

contract RequestResponseOracle is Oracle {
    event Request(address requester, uint16 correlation);

    function getValue(uint16 correlation) external override returns (bool, int256) {
        emit Request(msg.sender, correlation);
        return (true, 0);
    }
}

contract PublishSubscribeOracle is Oracle {
    event Subscription(address subscriber, uint16 correlation);

    function getValue(uint16 correlation) external override returns (bool, int256) {
        emit Subscription(msg.sender, correlation);
        return (true, 0);
    }
}

contract StorageOracle is Oracle {
    int256 value;

    function setValue(int256 newValue) external {
        value = newValue;
    }

    function getValue(uint16) external override returns (bool, int256) {
        return (false, value);
    }
}
