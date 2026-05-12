// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StableFlowSplitter
 * @dev A lightweight splitter contract for USDC on Arc Testnet.
 * Designed to take a single payment and distribute it to multiple wallets.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

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
     * @param basisPoints Array of percentages in basis points (100% = 10000).
     * @param totalAmount The total amount to be split.
     */
    function executeSplit(
        address token,
        address[] calldata recipients,
        uint256[] calldata basisPoints,
        uint256 totalAmount
    ) external {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == basisPoints.length, "Mismatch lengths");
        require(totalAmount > 0, "Amount must be > 0");

        uint256 totalBasisPoints = 0;
        for (uint256 i = 0; i < basisPoints.length; i++) {
            totalBasisPoints += basisPoints[i];
        }
        require(totalBasisPoints == 10000, "Must sum to 100%");

        // Transfer total amount from sender to this contract
        require(IERC20(token).transferFrom(msg.sender, address(this), totalAmount), "TransferFrom failed");

        uint256 remaining = totalAmount;
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount = (totalAmount * basisPoints[i]) / 10000;
            
            if (amount > 0) {
                if (i == recipients.length - 1) {
                    // Send remaining to the last recipient to handle rounding
                    require(IERC20(token).transfer(recipients[i], remaining), "Transfer failed");
                } else {
                    require(IERC20(token).transfer(recipients[i], amount), "Transfer failed");
                    remaining -= amount;
                }
            }
        }

        emit FlowExecuted(msg.sender, token, totalAmount, recipients.length);
    }
}
