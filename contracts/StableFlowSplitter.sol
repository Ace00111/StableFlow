// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StableFlowSplitter
 * @dev A lightweight splitter contract for USDC on Arc Testnet.
 * Designed to take a single payment and distribute it to multiple wallets atomically.
 */
contract StableFlowSplitter {
    event FlowExecuted(
        address indexed sender,
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount
    );

    /**
     * @dev Executes a split of ERC20 tokens.
     * @param token The address of the token (e.g. USDC).
     * @param recipients Array of recipient addresses.
     * @param basisPoints Array of percentages in basis points (10000 = 100.00%).
     * @param totalAmount The total amount to be split.
     */
    function executeSplit(
        address token,
        address[] calldata recipients,
        uint256[] calldata basisPoints,
        uint256 totalAmount
    ) external {
        uint256 len = recipients.length;
        require(len > 0, "No recipients");
        require(len == basisPoints.length, "Mismatch lengths");
        require(totalAmount > 0, "Amount must be > 0");

        // Pull total amount from sender to this contract
        _safeTransferFrom(token, msg.sender, address(this), totalAmount);

        uint256 totalBasisPoints = 0;
        uint256 remaining = totalAmount;

        for (uint256 i = 0; i < len; i++) {
            totalBasisPoints += basisPoints[i];
            
            if (i == len - 1) {
                // Last recipient gets exactly what's left to ensure 100% distribution
                if (remaining > 0) {
                    _safeTransfer(token, recipients[i], remaining);
                }
            } else {
                uint256 amount = (totalAmount * basisPoints[i]) / 10000;
                if (amount > 0) {
                    _safeTransfer(token, recipients[i], amount);
                    remaining -= amount;
                }
            }
        }

        require(totalBasisPoints == 10000, "Must sum to 100%");
        emit FlowExecuted(msg.sender, token, totalAmount, len);
    }

    /**
     * @dev Low-level safe transfer to handle tokens that don't return bool.
     */
    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    /**
     * @dev Low-level safe transferFrom to handle tokens that don't return bool.
     */
    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferFrom failed");
    }
}
