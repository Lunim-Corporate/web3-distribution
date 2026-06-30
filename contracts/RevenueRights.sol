// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RevenueRights
 * @author LUNIM Team
 * @notice Fixed-split revenue distribution contract for creative rights holders.
 *         Revenue sent to this contract is split according to immutable basis-point
 *         allocations and made claimable via a pull-payment pattern.
 * @dev Uses OpenZeppelin's ReentrancyGuard, Ownable, and Pausable.
 *      Basis points are set at deployment and cannot be changed (immutable split).
 *      The last holder receives the remainder to prevent dust loss.
 */
contract RevenueRights is ReentrancyGuard, Ownable, Pausable {

    /// @notice Represents a single rights holder with their allocation
    struct RightsHolder {
        address payable wallet;
        string fullName;
        string role;
        uint256 basisPoints; // out of 10000 (100% = 10000)
    }

    /// @notice Array of all rights holders (set at construction, immutable)
    RightsHolder[] public rightsHolders;

    /// @notice Cumulative ETH distributed through this contract (wei)
    uint256 public totalDistributed;

    /// @notice Pull-payment balances available for each holder to claim
    mapping(address => uint256) public accruedBalances;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when revenue is distributed across all holders
    event RevenueDistributed(
        address indexed sender,
        uint256 totalAmount,
        uint256 timestamp
    );

    /// @notice Emitted for each holder's share during distribution
    event HolderPaid(
        address indexed recipient,
        string fullName,
        string role,
        uint256 amount,
        uint256 basisPoints
    );

    /// @notice Emitted when a holder claims their accrued balance
    event HolderClaimed(
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when the contract is paused for emergency
    event EmergencyPaused(address indexed by, uint256 timestamp);

    /// @notice Emitted when the contract is unpaused
    event EmergencyUnpaused(address indexed by, uint256 timestamp);

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /**
     * @notice Deploy with a fixed set of rights holders.
     * @param _wallets    Payable wallet addresses for each holder
     * @param _names      Full names of each holder
     * @param _roles      Role descriptions (e.g., "Director", "Producer")
     * @param _basisPoints Allocation in basis points — MUST sum to exactly 10000
     */
    constructor(
        address payable[] memory _wallets,
        string[]   memory _names,
        string[]   memory _roles,
        uint256[]  memory _basisPoints
    ) Ownable(msg.sender) {
        require(
            _wallets.length == _names.length &&
            _names.length   == _roles.length &&
            _roles.length   == _basisPoints.length,
            "Array length mismatch"
        );
        require(_wallets.length > 0, "At least one holder required");

        uint256 total = 0;
        for (uint256 i = 0; i < _wallets.length; ) {
            require(_wallets[i] != address(0), "Zero address holder");
            total += _basisPoints[i];
            rightsHolders.push(RightsHolder({
                wallet:      _wallets[i],
                fullName:    _names[i],
                role:        _roles[i],
                basisPoints: _basisPoints[i]
            }));
            unchecked { ++i; }
        }
        require(total == 10000, "Basis points must sum to 10000");
    }

    // ──────────────────────────────────────────────
    // Receive & Distribute
    // ──────────────────────────────────────────────

    /**
     * @notice Fallback: automatically distributes any ETH sent directly.
     * @dev Triggers _distributeRevenue() on plain ETH transfers.
     */
    receive() external payable {
        _distributeRevenue();
    }

    /**
     * @notice Distribute ETH to all rights holders according to their basis points.
     * @dev Anyone can call this — not restricted to owner. The caller sends ETH
     *      which is split and made available for holders to claim.
     */
    function distributeRevenue() external payable {
        require(msg.value > 0, "Must send ETH");
        _distributeRevenue();
    }

    /**
     * @dev Internal distribution logic. Splits msg.value proportionally.
     *      The last holder receives the remainder to prevent wei dust loss.
     */
    function _distributeRevenue() internal nonReentrant whenNotPaused {
        uint256 remaining = msg.value;
        uint256 len = rightsHolders.length;

        for (uint256 i = 0; i < len; ) {
            uint256 share;
            if (i == len - 1) {
                // Last holder gets remainder — prevents dust loss
                share = remaining;
            } else {
                share = (msg.value * rightsHolders[i].basisPoints) / 10000;
                remaining -= share;
            }
            
            // Record split inside accruedBalances (Pull Payment Pattern)
            accruedBalances[rightsHolders[i].wallet] += share;
            
            emit HolderPaid(
                rightsHolders[i].wallet,
                rightsHolders[i].fullName,
                rightsHolders[i].role,
                share,
                rightsHolders[i].basisPoints
            );

            unchecked { ++i; }
        }

        totalDistributed += msg.value;
        emit RevenueDistributed(msg.sender, msg.value, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // Claim (Pull Payment)
    // ──────────────────────────────────────────────

    /**
     * @notice Claim all accrued revenue. Transfers ETH to the caller.
     * @dev Uses the checks-effects-interactions pattern. Balance is zeroed
     *      before the external call to prevent reentrancy.
     */
    function claim() external nonReentrant whenNotPaused {
        uint256 balance = accruedBalances[msg.sender];
        require(balance > 0, "No balance to claim");

        accruedBalances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        emit HolderClaimed(msg.sender, balance);
    }

    // ──────────────────────────────────────────────
    // Emergency Controls
    // ──────────────────────────────────────────────

    /**
     * @notice Pause all distributions and claims. Emergency use only.
     * @dev Only the contract owner can pause.
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Resume distributions and claims after an emergency.
     * @dev Only the contract owner can unpause.
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns all rights holders and their allocations.
     * @return Array of RightsHolder structs
     */
    function getRightsHolders() external view
    returns (RightsHolder[] memory) {
        return rightsHolders;
    }

    /**
     * @notice Returns the number of rights holders.
     * @return Count of holders
     */
    function getHolderCount() external view returns (uint256) {
        return rightsHolders.length;
    }

    /**
     * @notice Returns the current ETH balance held by the contract.
     * @return Balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the cumulative ETH distributed through this contract.
     * @return Total distributed in wei
     */
    function getTotalDistributed() external view returns (uint256) {
        return totalDistributed;
    }
}
