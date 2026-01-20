import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContractService Integration Tests", function () {
  let projectRegistry: any;
  let revenueDistributor: any;
  let owner: any;
  let contributor1: any;
  let contributor2: any;

  beforeEach(async function () {
    [owner, contributor1, contributor2] = await ethers.getSigners();

    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    projectRegistry = await ProjectRegistry.deploy();
    await projectRegistry.waitForDeployment();

    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = await RevenueDistributor.deploy(
      await projectRegistry.getAddress()
    );
    await revenueDistributor.waitForDeployment();
  });

  describe("Project Registration", function () {
    it("Should register a new project", async function () {
      const projectId = "project-001";
      const projectName = "Test Project";
      const contributors = [contributor1.address, contributor2.address];
      const shares = [60, 40];

      await projectRegistry.registerProject(
        projectId,
        projectName,
        contributors,
        shares
      );

      const project = await projectRegistry.getProject(projectId);
      expect(project.projectId).to.equal(projectId);
      expect(project.name).to.equal(projectName);
      expect(project.isActive).to.be.true;
    });

    it("Should reject project with invalid shares", async function () {
      const projectId = "project-002";
      const projectName = "Invalid Project";
      const contributors = [contributor1.address, contributor2.address];
      const shares = [60, 30];

      await expect(
        projectRegistry.registerProject(
          projectId,
          projectName,
          contributors,
          shares
        )
      ).to.be.revertedWith("Total shares must equal 100");
    });

    it("Should reject duplicate project registration", async function () {
      const projectId = "project-003";
      const projectName = "Duplicate Project";
      const contributors = [contributor1.address];
      const shares = [100];

      await projectRegistry.registerProject(
        projectId,
        projectName,
        contributors,
        shares
      );

      await expect(
        projectRegistry.registerProject(
          projectId,
          projectName,
          contributors,
          shares
        )
      ).to.be.revertedWith("Project already exists");
    });
  });

  describe("Revenue Distribution", function () {
    beforeEach(async function () {
      const projectId = "project-revenue";
      const projectName = "Revenue Test";
      const contributors = [contributor1.address, contributor2.address];
      const shares = [70, 30];

      await projectRegistry.registerProject(
        projectId,
        projectName,
        contributors,
        shares
      );
    });

    it("Should distribute revenue correctly", async function () {
      const projectId = "project-revenue";
      const amount = ethers.parseEther("1.0");

      await revenueDistributor.distributeRevenue(projectId, { value: amount });

      const balance1 = await revenueDistributor.getContributorBalance(
        contributor1.address
      );
      const balance2 = await revenueDistributor.getContributorBalance(
        contributor2.address
      );

      expect(balance1).to.equal(ethers.parseEther("0.7"));
      expect(balance2).to.equal(ethers.parseEther("0.3"));
    });

    it("Should allow contributors to withdraw", async function () {
      const projectId = "project-revenue";
      const amount = ethers.parseEther("1.0");

      await revenueDistributor.distributeRevenue(projectId, { value: amount });

      const initialBalance = await ethers.provider.getBalance(
        contributor1.address
      );

      const tx = await revenueDistributor
        .connect(contributor1)
        .withdrawContributorBalance();
      const receipt = await tx.wait();

      const finalBalance = await ethers.provider.getBalance(contributor1.address);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("0.7") - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should reject distribution to inactive project", async function () {
      const projectId = "project-revenue";
      await projectRegistry.deactivateProject(projectId);

      const amount = ethers.parseEther("1.0");

      await expect(
        revenueDistributor.distributeRevenue(projectId, { value: amount })
      ).to.be.revertedWith("Project is not active");
    });
  });

  describe("Contributor Share Queries", function () {
    beforeEach(async function () {
      const projectId = "project-query";
      const projectName = "Query Test";
      const contributors = [contributor1.address, contributor2.address];
      const shares = [80, 20];

      await projectRegistry.registerProject(
        projectId,
        projectName,
        contributors,
        shares
      );
    });

    it("Should return correct contributor share", async function () {
      const projectId = "project-query";
      const share = await revenueDistributor.getContributorShare(
        projectId,
        contributor1.address
      );

      expect(share).to.equal(80);
    });

    it("Should return zero for non-contributor", async function () {
      const projectId = "project-query";
      const [, , , nonContributor] = await ethers.getSigners();
      const share = await revenueDistributor.getContributorShare(
        projectId,
        nonContributor.address
      );

      expect(share).to.equal(0);
    });
  });

  describe("Project Updates", function () {
    it("Should update project contributors and shares", async function () {
      const projectId = "project-update";
      const projectName = "Update Test";
      const contributors = [contributor1.address];
      const shares = [100];

      await projectRegistry.registerProject(
        projectId,
        projectName,
        contributors,
        shares
      );

      const newContributors = [contributor1.address, contributor2.address];
      const newShares = [50, 50];

      await projectRegistry.updateProject(projectId, newContributors, newShares);

      const project = await projectRegistry.getProject(projectId);
      expect(project.contributors.length).to.equal(2);
      expect(project.shares[0]).to.equal(50);
      expect(project.shares[1]).to.equal(50);
    });
  });
});
