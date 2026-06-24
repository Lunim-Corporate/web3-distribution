// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Dynamic Revenue Splitter
 * @dev Handles ETH payouts securely mapping shares dynamically.
 */
contract RevenueSplitter {
    address public owner;
    
    uint256 public totalShares;
    uint256 public totalReleased;

    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;
    address[] public payees;

    event PayeeAdded(address account, uint256 shares);
    event SharesUpdated(address account, uint256 oldShares, uint256 newShares);
    event PaymentReleased(address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    bool private locked;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can configure payees");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Allows the contract to receive ETH tracking deposits.
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Configures a new payee dynamically. Only the owner can issue this.
     */
    function addPayee(address account, uint256 shares_) external onlyOwner {
        require(account != address(0), "Account is zero address");
        require(shares_ > 0, "Shares must be > 0");
        require(shares[account] == 0, "Account already has shares allocated");

        payees.push(account);
        shares[account] = shares_;
        totalShares = totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }

    /**
     * @dev Triggers a transfer to a specified payee of their owed percentage relative to network scale.
     */
    function release(address payable account) external nonReentrant {
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
     * @dev Updates shares for a payee. Only the owner can configure payees.
     */
    function updateShares(address account, uint256 newShares) external onlyOwner {
        require(account != address(0), "Account is zero address");
        require(shares[account] > 0, "Account has no shares allocated");
        require(newShares > 0, "Shares must be > 0");

        uint256 oldShares = shares[account];
        shares[account] = newShares;
        totalShares = totalShares - oldShares + newShares;
        emit SharesUpdated(account, oldShares, newShares);
    }
}
