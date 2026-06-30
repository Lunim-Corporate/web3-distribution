const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("RevenueSplitter", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol, outsider] = await ethers.getSigners();

    const RevenueSplitter = await ethers.getContractFactory("RevenueSplitter");
    const contract = await RevenueSplitter.deploy();
    await contract.waitForDeployment();

    return {
      contract,
      owner,
      alice,
      bob,
      carol,
      outsider,
    };
  }

  describe("Deployment", function () {
    it("should set correct owner", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should start with zero shares and released", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.totalShares()).to.equal(0);
      expect(await contract.totalReleased()).to.equal(0);
    });
  });

  describe("addPayee()", function () {
    it("should allow owner to add a payee", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(contract.addPayee(alice.address, 50))
        .to.emit(contract, "PayeeAdded")
        .withArgs(alice.address, 50);

      expect(await contract.shares(alice.address)).to.equal(50);
      expect(await contract.totalShares()).to.equal(50);
      expect(await contract.payees(0)).to.equal(alice.address);
    });

    it("should revert if caller is not the owner", async function () {
      const { contract, alice, outsider } = await loadFixture(deployFixture);
      await expect(
        contract.connect(outsider).addPayee(alice.address, 50)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
       .withArgs(outsider.address);
    });

    it("should revert if account is zero address", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.addPayee(ethers.ZeroAddress, 50)
      ).to.be.revertedWith("Account is zero address");
    });

    it("should revert if shares are 0", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await expect(
        contract.addPayee(alice.address, 0)
      ).to.be.revertedWith("Shares must be > 0");
    });

    it("should revert if payee already added", async function () {
      const { contract, alice } = await loadFixture(deployFixture);
      await contract.addPayee(alice.address, 50);
      await expect(
        contract.addPayee(alice.address, 30)
      ).to.be.revertedWith("Account already has shares allocated");
    });
  });

  describe("release()", function () {
    async function deployWithPayeesFixture() {
      const fixture = await deployFixture();
      const { contract, alice, bob } = fixture;
      await contract.addPayee(alice.address, 70); // 70%
      await contract.addPayee(bob.address, 30);  // 30%
      return fixture;
    }

    it("should revert if account has no shares", async function () {
      const { contract, outsider } = await loadFixture(deployWithPayeesFixture);
      await expect(contract.release(outsider.address)).to.be.revertedWith(
        "Account has no shares"
      );
    });

    it("should revert if no payment is due", async function () {
      const { contract, alice } = await loadFixture(deployWithPayeesFixture);
      await expect(contract.release(alice.address)).to.be.revertedWith(
        "Account is not due payment"
      );
    });

    it("should release proportional funds to payees", async function () {
      const { contract, alice, bob, outsider } = await loadFixture(
        deployWithPayeesFixture
      );

      // Send 10 ETH to the contract
      const contractAddress = await contract.getAddress();
      await outsider.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("10.0"),
      });

      // Release Alice (70% of 10 ETH = 7 ETH)
      const aliceBalBefore = await ethers.provider.getBalance(alice.address);
      await expect(contract.release(alice.address))
        .to.emit(contract, "PaymentReleased")
        .withArgs(alice.address, ethers.parseEther("7.0"));
      const aliceBalAfter = await ethers.provider.getBalance(alice.address);
      expect(aliceBalAfter - aliceBalBefore).to.equal(ethers.parseEther("7.0"));

      // Release Bob (30% of 10 ETH = 3 ETH)
      const bobBalBefore = await ethers.provider.getBalance(bob.address);
      await expect(contract.release(bob.address))
        .to.emit(contract, "PaymentReleased")
        .withArgs(bob.address, ethers.parseEther("3.0"));
      const bobBalAfter = await ethers.provider.getBalance(bob.address);
      expect(bobBalAfter - bobBalBefore).to.equal(ethers.parseEther("3.0"));

      expect(await contract.totalReleased()).to.equal(ethers.parseEther("10.0"));
    });

    it("should handle cumulative payouts correctly", async function () {
      const { contract, alice, bob, outsider } = await loadFixture(
        deployWithPayeesFixture
      );
      const contractAddress = await contract.getAddress();

      // First deposit: 10 ETH
      await outsider.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("10.0"),
      });

      // Release Alice (7 ETH)
      await contract.release(alice.address);

      // Second deposit: 5 ETH (Total received = 15 ETH)
      await outsider.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("5.0"),
      });

      // Alice is now due: 15 * 70% = 10.5 ETH total. Already released 7 ETH. Due = 3.5 ETH.
      const aliceBalBefore = await ethers.provider.getBalance(alice.address);
      await contract.release(alice.address);
      const aliceBalAfter = await ethers.provider.getBalance(alice.address);
      expect(aliceBalAfter - aliceBalBefore).to.equal(ethers.parseEther("3.5"));

      // Bob is due: 15 * 30% = 4.5 ETH.
      const bobBalBefore = await ethers.provider.getBalance(bob.address);
      await contract.release(bob.address);
      const bobBalAfter = await ethers.provider.getBalance(bob.address);
      expect(bobBalAfter - bobBalBefore).to.equal(ethers.parseEther("4.5"));
    });
  });

  describe("removePayee()", function () {
    async function deployWithPayeesFixture() {
      const fixture = await deployFixture();
      const { contract, alice, bob } = fixture;
      await contract.addPayee(alice.address, 70); // 70%
      await contract.addPayee(bob.address, 30);  // 30%
      return fixture;
    }

    it("should revert if payee has no shares", async function () {
      const { contract, outsider } = await loadFixture(deployWithPayeesFixture);
      await expect(contract.removePayee(outsider.address)).to.be.revertedWith(
        "Account has no shares allocated"
      );
    });

    it("should remove payee and update totalShares", async function () {
      const { contract, alice } = await loadFixture(deployWithPayeesFixture);
      await expect(contract.removePayee(alice.address))
        .to.emit(contract, "PayeeRemoved")
        .withArgs(alice.address, 0);

      expect(await contract.shares(alice.address)).to.equal(0);
      expect(await contract.totalShares()).to.equal(30); // only bob remains
    });

    it("should settle outstanding payments before removal", async function () {
      const { contract, alice, outsider } = await loadFixture(
        deployWithPayeesFixture
      );
      const contractAddress = await contract.getAddress();

      // Send 10 ETH
      await outsider.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("10.0"),
      });

      // Remove Alice (should trigger 7 ETH payout)
      const aliceBalBefore = await ethers.provider.getBalance(alice.address);
      await expect(contract.removePayee(alice.address))
        .to.emit(contract, "PaymentReleased")
        .withArgs(alice.address, ethers.parseEther("7.0"))
        .to.emit(contract, "PayeeRemoved")
        .withArgs(alice.address, ethers.parseEther("7.0"));

      const aliceBalAfter = await ethers.provider.getBalance(alice.address);
      expect(aliceBalAfter - aliceBalBefore).to.equal(ethers.parseEther("7.0"));
      expect(await contract.shares(alice.address)).to.equal(0);
    });
  });

  describe("pause() / unpause()", function () {
    async function deployWithPayeesFixture() {
      const fixture = await deployFixture();
      const { contract, alice } = fixture;
      await contract.addPayee(alice.address, 100);
      return fixture;
    }

    it("should allow owner to pause and reject release / addPayee", async function () {
      const { contract, alice } = await loadFixture(deployWithPayeesFixture);
      
      await expect(contract.pause())
        .to.emit(contract, "EmergencyPaused");

      await expect(contract.release(alice.address)).to.be.revertedWithCustomError(
        contract,
        "EnforcedPause"
      );

      await expect(contract.addPayee(alice.address, 50)).to.be.revertedWithCustomError(
        contract,
        "EnforcedPause"
      );
    });

    it("should allow owner to unpause", async function () {
      const { contract, alice, outsider } = await loadFixture(deployWithPayeesFixture);
      const contractAddress = await contract.getAddress();

      await contract.pause();
      await expect(contract.unpause())
        .to.emit(contract, "EmergencyUnpaused");

      await outsider.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("1.0"),
      });

      await expect(contract.release(alice.address)).to.emit(contract, "PaymentReleased");
    });
  });

  describe("View Functions", function () {
    it("should return correct payee list and payee info", async function () {
      const { contract, alice, bob } = await loadFixture(deployFixture);
      await contract.addPayee(alice.address, 60);
      await contract.addPayee(bob.address, 40);

      const payeesList = await contract.getPayees();
      expect(payeesList[0]).to.equal(alice.address);
      expect(payeesList[1]).to.equal(bob.address);

      const aliceInfo = await contract.getPayeeInfo(alice.address);
      expect(aliceInfo.allocatedShares).to.equal(60);
      expect(aliceInfo.totalPaid).to.equal(0);
      expect(aliceInfo.amountDue).to.equal(0);
    });
  });
});
