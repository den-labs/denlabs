// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/// @custom:security-contact wolfcito.learn+security@gmail.com
contract Spray is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_RECIPIENTS = 200;

    error TooManyRecipients(uint256 count, uint256 max);
    error ZeroAddress(uint256 index);
    error ZeroAmount(uint256 index);
    error LengthMismatch(uint256 recipientsLength, uint256 amountsLength);
    error EmptyRecipients();
    error IncorrectNativeValue(uint256 sent, uint256 required);
    error InsufficientAllowance(uint256 available, uint256 required);
    error InvalidTokenAddress();

    event NativeDispersed(
        address indexed sender,
        address[] recipients,
        uint256[] amounts,
        uint256 totalValue
    );

    event TokenDispersed(
        address indexed sender,
        address token,
        address[] recipients,
        uint256[] amounts,
        uint256 totalValue
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function disperseNative(
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external payable nonReentrant whenNotPaused {
        uint256 totalValue = _validateRecipients(_recipients, _amounts);

        if (msg.value != totalValue) {
            revert IncorrectNativeValue(msg.value, totalValue);
        }

        for (uint256 i = 0; i < _recipients.length; i++) {
            Address.sendValue(payable(_recipients[i]), _amounts[i]);
        }

        emit NativeDispersed(msg.sender, _recipients, _amounts, totalValue);
    }

    function disperseToken(
        address tokenAddress,
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external nonReentrant whenNotPaused {
        if (tokenAddress == address(0)) {
            revert InvalidTokenAddress();
        }

        uint256 totalValue = _validateRecipients(_recipients, _amounts);

        IERC20 token = IERC20(tokenAddress);

        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < totalValue) {
            revert InsufficientAllowance(allowance, totalValue);
        }

        token.safeTransferFrom(msg.sender, address(this), totalValue);

        for (uint256 i = 0; i < _recipients.length; i++) {
            token.safeTransfer(_recipients[i], _amounts[i]);
        }

        emit TokenDispersed(
            msg.sender,
            tokenAddress,
            _recipients,
            _amounts,
            totalValue
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function rescueNative() external onlyOwner {
        Address.sendValue(payable(owner()), address(this).balance);
    }

    function rescueToken(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) {
            revert InvalidTokenAddress();
        }
        IERC20 token = IERC20(tokenAddress);
        token.safeTransfer(owner(), token.balanceOf(address(this)));
    }

    function _validateRecipients(
        address[] memory recipients,
        uint256[] memory amounts
    ) private pure returns (uint256 totalValue) {
        if (recipients.length != amounts.length) {
            revert LengthMismatch(recipients.length, amounts.length);
        }

        if (recipients.length == 0) {
            revert EmptyRecipients();
        }

        if (recipients.length > MAX_RECIPIENTS) {
            revert TooManyRecipients(recipients.length, MAX_RECIPIENTS);
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) {
                revert ZeroAddress(i);
            }
            if (amounts[i] == 0) {
                revert ZeroAmount(i);
            }
            totalValue += amounts[i];
        }
    }
}
