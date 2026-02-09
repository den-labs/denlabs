// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISpray {
    function disperseNative(
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external payable;
}

/// @notice Test-only contract that attempts reentrancy on Spray.disperseNative
contract ReentrantAttacker {
    ISpray public immutable spray;
    bool public attacked;

    constructor(address _spray) {
        spray = ISpray(_spray);
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            address[] memory recipients = new address[](1);
            recipients[0] = address(this);
            uint256[] memory amounts = new uint256[](1);
            amounts[0] = msg.value;
            spray.disperseNative{value: msg.value}(recipients, amounts);
        }
    }
}
