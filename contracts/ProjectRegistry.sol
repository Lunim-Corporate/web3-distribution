// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IProjectRegistry.sol";

contract ProjectRegistry is IProjectRegistry, Ownable, ReentrancyGuard {
    mapping(string => Project) private projects;
    mapping(string => bool) private projectExists;
    string[] private projectIds;

    constructor() Ownable(msg.sender) {}

    function registerProject(
        string calldata projectId,
        string calldata name,
        address[] calldata contributors,
        uint256[] calldata shares
    ) external override onlyOwner {
        require(!projectExists[projectId], "Project already exists");
        require(contributors.length > 0, "No contributors provided");
        require(contributors.length == shares.length, "Contributors and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(contributors[i] != address(0), "Invalid contributor address");
            require(shares[i] > 0, "Share must be greater than 0");
            totalShares += shares[i];
        }
        require(totalShares == 100, "Total shares must equal 100");

        projects[projectId] = Project({
            projectId: projectId,
            name: name,
            contributors: contributors,
            shares: shares,
            totalRevenue: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        projectExists[projectId] = true;
        projectIds.push(projectId);

        emit ProjectRegistered(projectId, name, contributors, shares, block.timestamp);
    }

    function updateProject(
        string calldata projectId,
        address[] calldata contributors,
        uint256[] calldata shares
    ) external override onlyOwner {
        require(projectExists[projectId], "Project does not exist");
        require(contributors.length > 0, "No contributors provided");
        require(contributors.length == shares.length, "Contributors and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(contributors[i] != address(0), "Invalid contributor address");
            require(shares[i] > 0, "Share must be greater than 0");
            totalShares += shares[i];
        }
        require(totalShares == 100, "Total shares must equal 100");

        Project storage project = projects[projectId];
        project.contributors = contributors;
        project.shares = shares;

        emit ProjectUpdated(projectId, block.timestamp);
    }

    function deactivateProject(string calldata projectId) external override onlyOwner {
        require(projectExists[projectId], "Project does not exist");
        projects[projectId].isActive = false;
        emit ProjectDeactivated(projectId, block.timestamp);
    }

    function getProject(string calldata projectId) external view override returns (Project memory) {
        require(projectExists[projectId], "Project does not exist");
        return projects[projectId];
    }

    function isProjectActive(string calldata projectId) external view override returns (bool) {
        return projectExists[projectId] && projects[projectId].isActive;
    }

    function getAllProjectIds() external view returns (string[] memory) {
        return projectIds;
    }

    function incrementTotalRevenue(string calldata projectId, uint256 amount) external onlyOwner {
        require(projectExists[projectId], "Project does not exist");
        projects[projectId].totalRevenue += amount;
    }
}
