// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProjectRegistry {
    struct Project {
        string projectId;
        string name;
        address[] contributors;
        uint256[] shares;
        uint256 totalRevenue;
        bool isActive;
        uint256 createdAt;
    }

    event ProjectRegistered(
        string indexed projectId,
        string name,
        address[] contributors,
        uint256[] shares,
        uint256 timestamp
    );

    event ProjectUpdated(
        string indexed projectId,
        uint256 timestamp
    );

    event ProjectDeactivated(
        string indexed projectId,
        uint256 timestamp
    );

    function registerProject(
        string calldata projectId,
        string calldata name,
        address[] calldata contributors,
        uint256[] calldata shares
    ) external;

    function updateProject(
        string calldata projectId,
        address[] calldata contributors,
        uint256[] calldata shares
    ) external;

    function deactivateProject(string calldata projectId) external;

    function getProject(string calldata projectId) external view returns (Project memory);

    function isProjectActive(string calldata projectId) external view returns (bool);
}
