// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRevenueDistributor {
    event RevenueDistributed(
        string indexed projectId,
        uint256 amount,
        uint256 timestamp
    );

    event ContributorPaid(
        string indexed projectId,
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );

    function distributeRevenue(string calldata projectId) external payable;
    
    function getContributorShare(
        string calldata projectId,
        address contributor
    ) external view returns (uint256);
    
    function withdrawContributorBalance() external;
}
