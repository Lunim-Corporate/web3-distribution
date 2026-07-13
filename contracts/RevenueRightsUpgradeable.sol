// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title RevenueRightsUpgradeable
 * @author LUNIM Team
 * @notice Fixed-split revenue distribution contract for creative rights holders.
 *         UUPS upgradeable variant that allows future upgrades via governance.
 * @dev Uses UUPSUpgradeable + OwnableUpgradeable + PausableUpgradeable.
 *      Deploy with hardhat-upgrades deployProxy() for automatic proxy setup.
 */
contract RevenueRightsUpgradeable is
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    /// @notice Represents a single rights holder with their allocation
    struct RightsHolder {
        address payable wallet;
        string fullName;
        string role;
        uint256 basisPoints;
    }

    /// @notice Array of all rights holders (set at initialization, immutable after init)
    RightsHolder[] public rightsHolders;

    /// @notice Cumulative ETH distributed through this contract (wei)
    uint256 public totalDistributed;

    /// @notice Pull-payment balances available for each holder to claim
    mapping(address => uint256) public accruedBalances;

    /// @notice Flag to prevent re-initialization
    bool public initialized;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event RevenueDistributed(address indexed sender, uint256 totalAmount, uint256 timestamp);
    event HolderPaid(address indexed recipient, string fullName, string role, uint256 amount, uint256 basisPoints);
    event HolderClaimed(address indexed recipient, uint256 amount);
    event EmergencyPaused(address indexed by, uint256 timestamp);
    event EmergencyUnpaused(address indexed by, uint256 timestamp);

    // ──────────────────────────────────────────────
    // Constructor: prevent implementation contract initialization
    // ──────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ──────────────────────────────────────────────
    // Initializer (replaces constructor)
    // ──────────────────────────────────────────────

    /**
     * @notice Initialize with a fixed set of rights holders.
     * @param _wallets    Payable wallet addresses for each holder
     * @param _names      Full names of each holder
     * @param _roles      Role descriptions (e.g., "Director", "Producer")
     * @param _basisPoints Allocation in basis points — MUST sum to exactly 10000
     */
    function initialize(
        address payable[] memory _wallets,
        string[]   memory _names,
        string[]   memory _roles,
        uint256[]  memory _basisPoints
    ) external initializer {
        require(!initialized, "Already initialized");
        initialized = true;

        __Ownable_init(msg.sender);
        __Pausable_init();

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
    // UUPS: only owner can upgrade
    // ──────────────────────────────────────────────

    /**
     * @notice Authorize an upgrade to a new implementation.
     * @dev Only the contract owner can authorize upgrades.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // ──────────────────────────────────────────────
    // Receive & Distribute
    // ──────────────────────────────────────────────

    receive() external payable {
        _distributeRevenue();
    }

    function distributeRevenue() external payable {
        require(msg.value > 0, "Must send ETH");
        _distributeRevenue();
    }

    function _distributeRevenue() internal whenNotPaused {
        uint256 remaining = msg.value;
        uint256 len = rightsHolders.length;

        for (uint256 i = 0; i < len; ) {
            uint256 share;
            if (i == len - 1) {
                share = remaining;
            } else {
                share = (msg.value * rightsHolders[i].basisPoints) / 10000;
                remaining -= share;
            }

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

    function claim() external whenNotPaused {
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

    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    function getRightsHolders() external view returns (RightsHolder[] memory) {
        return rightsHolders;
    }

    function getHolderCount() external view returns (uint256) {
        return rightsHolders.length;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTotalDistributed() external view returns (uint256) {
        return totalDistributed;
    }

    // ──────────────────────────────────────────────
    // Storage gap for future upgrades
    // ──────────────────────────────────────────────

    /// @dev Gap to allow adding variables in future upgrades
    uint256[50] private __gap;
}
