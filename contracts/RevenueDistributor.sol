// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRevenueDistributor.sol";
import "./interfaces/IProjectRegistry.sol";

contract RevenueDistributor is IRevenueDistributor, Ownable, ReentrancyGuard {
    IProjectRegistry public projectRegistry;
    
    mapping(address => uint256) private contributorBalances;
    mapping(string => uint256) private projectTotalDistributed;

    constructor(address _projectRegistry) Ownable(msg.sender) {
        require(_projectRegistry != address(0), "Invalid registry address");
        projectRegistry = IProjectRegistry(_projectRegistry);
    }

    function distributeRevenue(string calldata projectId) 
        external 
        payable 
        override 
        nonReentrant 
    {
        require(msg.value > 0, "No revenue to distribute");
        require(projectRegistry.isProjectActive(projectId), "Project is not active");

        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        require(project.contributors.length > 0, "No contributors in project");

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < project.contributors.length; i++) {
            uint256 share = (msg.value * project.shares[i]) / 100;
            contributorBalances[project.contributors[i]] += share;
            totalDistributed += share;

            emit ContributorPaid(
                projectId,
                project.contributors[i],
                share,
                block.timestamp
            );
        }

        projectTotalDistributed[projectId] += totalDistributed;

        emit RevenueDistributed(projectId, msg.value, block.timestamp);
    }

    function getContributorShare(
        string calldata projectId,
        address contributor
    ) external view override returns (uint256) {
        require(projectRegistry.isProjectActive(projectId), "Project is not active");
        
        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        
        for (uint256 i = 0; i < project.contributors.length; i++) {
            if (project.contributors[i] == contributor) {
                return project.shares[i];
            }
        }
        
        return 0;
    }

    function withdrawContributorBalance() external override nonReentrant {
        uint256 balance = contributorBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        contributorBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getContributorBalance(address contributor) external view returns (uint256) {
        return contributorBalances[contributor];
    }

    function getProjectTotalDistributed(string calldata projectId) external view returns (uint256) {
        return projectTotalDistributed[projectId];
    }

    function updateProjectRegistry(address _projectRegistry) external onlyOwner {
        require(_projectRegistry != address(0), "Invalid registry address");
        projectRegistry = IProjectRegistry(_projectRegistry);
    }

    receive() external payable {
        revert("Direct payments not allowed. Use distributeRevenue()");
    }
}
