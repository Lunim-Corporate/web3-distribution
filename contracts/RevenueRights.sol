// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevenueRights {

    struct RightsHolder {
        address payable wallet;
        string fullName;
        string role;
        uint256 basisPoints; // out of 10000 (100% = 10000)
    }

    RightsHolder[] public rightsHolders;
    address public owner;
    uint256 public totalDistributed;

    event RevenueDistributed(
        address indexed sender,
        uint256 totalAmount,
        uint256 timestamp
    );

    event HolderPaid(
        address indexed recipient,
        string fullName,
        string role,
        uint256 amount,
        uint256 basisPoints
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        address payable[] memory _wallets,
        string[]   memory _names,
        string[]   memory _roles,
        uint256[]  memory _basisPoints
    ) {
        require(
            _wallets.length == _names.length &&
            _names.length   == _roles.length &&
            _roles.length   == _basisPoints.length,
            "Array length mismatch"
        );
        uint256 total = 0;
        for (uint i = 0; i < _wallets.length; i++) {
            total += _basisPoints[i];
            rightsHolders.push(RightsHolder({
                wallet:      _wallets[i],
                fullName:    _names[i],
                role:        _roles[i],
                basisPoints: _basisPoints[i]
            }));
        }
        require(total == 10000, "Basis points must sum to 10000");
        owner = msg.sender;
    }

    /**
     * @dev Fallback function to handle direct ETH transfers.
     * Automatically triggers the distribution logic.
     */
    receive() external payable {
        this.distributeRevenue{value: msg.value}();
    }

    function distributeRevenue() external payable {
        require(msg.value > 0, "Must send ETH");
        uint256 remaining = msg.value;
        uint256 len = rightsHolders.length;

        for (uint i = 0; i < len; i++) {
            uint256 share;
            if (i == len - 1) {
                share = remaining;
            } else {
                share = (msg.value * rightsHolders[i].basisPoints) / 10000;
                remaining -= share;
            }
            rightsHolders[i].wallet.transfer(share);
            emit HolderPaid(
                rightsHolders[i].wallet,
                rightsHolders[i].fullName,
                rightsHolders[i].role,
                share,
                rightsHolders[i].basisPoints
            );
        }

        totalDistributed += msg.value;
        emit RevenueDistributed(msg.sender, msg.value, block.timestamp);
    }

    function getRightsHolders() external view
    returns (RightsHolder[] memory) {
        return rightsHolders;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTotalDistributed() external view returns (uint256) {
        return totalDistributed;
    }
}
