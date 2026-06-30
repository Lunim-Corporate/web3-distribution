// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Dynamic Revenue Splitter
 * @author LUNIM Team
 * @notice Handles dynamic ETH payouts by mapping shares dynamically.
 *         Allows the owner to add payees, update shares, remove payees,
 *         and emergency pause the operations.
 * @dev Uses OpenZeppelin's ReentrancyGuard, Ownable, and Pausable.
 *      Payees can claim their share of contract balance dynamically.
 */
contract RevenueSplitter is ReentrancyGuard, Ownable, Pausable {
    
    /// @notice Total shares allocated across all payees
    uint256 public totalShares;
    
    /// @notice Total amount of ETH released/paid out to payees (wei)
    uint256 public totalReleased;

    /// @notice Mapping from payee address to their allocated shares
    mapping(address => uint256) public shares;
    
    /// @notice Mapping from payee address to the amount of ETH already released (wei)
    mapping(address => uint256) public released;
    
    /// @notice List of all configured payee addresses
    address[] public payees;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a payee is added to the splitter
    event PayeeAdded(address indexed account, uint256 shares);
    
    /// @notice Emitted when shares are updated for a payee
    event SharesUpdated(address indexed account, uint256 oldShares, uint256 newShares);
    
    /// @notice Emitted when a payee is removed from the splitter
    event PayeeRemoved(address indexed account, uint256 settledAmount);
    
    /// @notice Emitted when payment is released to a payee
    event PaymentReleased(address indexed to, uint256 amount);
    
    /// @notice Emitted when the contract receives ETH
    event PaymentReceived(address indexed from, uint256 amount);

    /// @notice Emitted when the contract is paused
    event EmergencyPaused(address indexed by, uint256 timestamp);

    /// @notice Emitted when the contract is unpaused
    event EmergencyUnpaused(address indexed by, uint256 timestamp);

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Allows the contract to receive ETH tracking deposits.
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @notice Configures a new payee dynamically. Only the owner can issue this.
     * @param account Wallet address of the payee
     * @param shares_ Number of shares to allocate
     */
    function addPayee(address account, uint256 shares_) external onlyOwner whenNotPaused {
        require(account != address(0), "Account is zero address");
        require(shares_ > 0, "Shares must be > 0");
        require(shares[account] == 0, "Account already has shares allocated");

        payees.push(account);
        shares[account] = shares_;
        totalShares = totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }

    /**
     * @notice Triggers a transfer to a specified payee of their owed percentage.
     * @param account The address to release funds to
     */
    function release(address payable account) external nonReentrant whenNotPaused {
        require(shares[account] > 0, "Account has no shares");

        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];

        require(payment > 0, "Account is not due payment");

        released[account] = released[account] + payment;
        totalReleased = totalReleased + payment;

        (bool success, ) = account.call{value: payment}("");
        require(success, "Transfer failed");
        emit PaymentReleased(account, payment);
    }

    /**
     * @notice Updates shares for a payee. Only the owner can configure payees.
     * @param account Wallet address of the payee
     * @param newShares New number of shares to allocate
     */
    function updateShares(address account, uint256 newShares) external onlyOwner whenNotPaused {
        require(account != address(0), "Account is zero address");
        require(shares[account] > 0, "Account has no shares allocated");
        require(newShares > 0, "Shares must be > 0");

        uint256 oldShares = shares[account];
        shares[account] = newShares;
        totalShares = totalShares - oldShares + newShares;
        emit SharesUpdated(account, oldShares, newShares);
    }

    /**
     * @notice Removes a payee from the splitter, settling any outstanding due payments.
     * @dev Settles any pending balance for the payee before setting shares to zero.
     * @param account Wallet address of the payee to remove
     */
    function removePayee(address payable account) external onlyOwner nonReentrant whenNotPaused {
        require(shares[account] > 0, "Account has no shares allocated");

        // 1. Calculate due payment
        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];

        // 2. Perform settlement first if any
        if (payment > 0) {
            released[account] = released[account] + payment;
            totalReleased = totalReleased + payment;
            (bool success, ) = account.call{value: payment}("");
            require(success, "Settlement transfer failed");
            emit PaymentReleased(account, payment);
        }

        // 3. Remove payee from shares and totalShares
        uint256 oldShares = shares[account];
        shares[account] = 0;
        totalShares = totalShares - oldShares;

        // 4. Remove payee from the payees array
        uint256 len = payees.length;
        for (uint256 i = 0; i < len; ) {
            if (payees[i] == account) {
                payees[i] = payees[len - 1];
                payees.pop();
                break;
            }
            unchecked { ++i; }
        }

        emit PayeeRemoved(account, payment);
    }

    // ──────────────────────────────────────────────
    // Emergency Controls
    // ──────────────────────────────────────────────

    /**
     * @notice Pause all operations. Emergency use only.
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Resume operations.
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns all configured payee addresses.
     * @return Array of addresses
     */
    function getPayees() external view returns (address[] memory) {
        return payees;
    }

    /**
     * @notice Returns share and release info for a payee.
     * @param account Payee address
     * @return allocatedShares The number of shares allocated
     * @return totalPaid The total amount paid to this payee (wei)
     * @return amountDue The current amount due to this payee (wei)
     */
    function getPayeeInfo(address account) external view returns (
        uint256 allocatedShares,
        uint256 totalPaid,
        uint256 amountDue
    ) {
        allocatedShares = shares[account];
        totalPaid = released[account];
        
        if (allocatedShares > 0) {
            uint256 totalReceived = address(this).balance + totalReleased;
            uint256 payment = (totalReceived * allocatedShares) / totalShares - totalPaid;
            amountDue = payment;
        } else {
            amountDue = 0;
        }
    }
}
