// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevenueRights {
    struct RightsHolder {
        address payable wallet;
        string name;
        string role;
        uint256 basisPoints; // out of 10000
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
        string name,
        string role,
        uint256 amount,
        uint256 basisPoints
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        address payable[] memory wallets,
        string[] memory names,
        string[] memory roles,
        uint256[] memory basisPointsArr
    ) {
        require(
            wallets.length == names.length &&
            names.length == roles.length &&
            roles.length == basisPointsArr.length,
            "Array length mismatch"
        );
        uint256 total = 0;
        for (uint i = 0; i < wallets.length; i++) {
            total += basisPointsArr[i];
            rightsHolders.push(RightsHolder({
                wallet: wallets[i],
                name: names[i],
                role: roles[i],
                basisPoints: basisPointsArr[i]
            }));
        }
        require(total == 10000, "Basis points must sum to 10000");
        owner = msg.sender;
    }

    function distributeRevenue() external payable {
        require(msg.value > 0, "Must send ETH");
        uint256 remaining = msg.value;

        for (uint i = 0; i < rightsHolders.length; i++) {
            uint256 share;
            if (i == rightsHolders.length - 1) {
                share = remaining;
            } else {
                share = (msg.value * rightsHolders[i].basisPoints) / 10000;
                remaining -= share;
            }
            rightsHolders[i].wallet.transfer(share);
            emit HolderPaid(
                rightsHolders[i].wallet,
                rightsHolders[i].name,
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
