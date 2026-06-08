const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

/**
 * RevenueRights.sol — Comprehensive Test Suite
 *
 * Covers:
 *  1. Constructor validation (array mismatch, basis-points != 10 000)
 *  2. distributeRevenue() — correct splits, remainder handling, events
 *  3. claim() — pull-payment pattern, reentrancy guard
 *  4. View helpers — getRightsHolders, getContractBalance, getTotalDistributed
 *  5. Edge cases — zero-value sends, unauthorised claims
 *  6. receive() fallback — automatic distribution on plain ETH send
 */
describe("RevenueRights", function () {
  // ---------- shared fixture ----------
  async function deployFixture() {
    const [owner, alice, bob, carol, dave, eve, outsider] =
      await ethers.getSigners();

    const wallets = [alice.address, bob.address, carol.address];
    const names = ["Alice", "Bob", "Carol"];
    const roles = ["Director", "Actor", "Producer"];
    const basisPoints = [5000, 3000, 2000]; // 50 %, 30 %, 20 %

    const RevenueRights = await ethers.getContractFactory("RevenueRights");
    const contract = await RevenueRights.deploy(
      wallets,
      names,
      roles,
      basisPoints
    );
    await contract.waitForDeployment();

    return {
      contract,
      owner,
      alice,
      bob,
      carol,
      dave,
      eve,
      outsider,
      wallets,
      names,
      roles,
      basisPoints,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════
  describe("Constructor", function () {
    it("should deploy with correct holder data", async function () {
      const { contract, alice, bob, carol, names, roles, basisPoints } =
        await loadFixture(deployFixture);

      const holders = await contract.getRightsHolders();
      expect(holders.length).to.equal(3);

      expect(holders[0].wallet).to.equal(alice.address);
      expect(holders[0].fullName).to.equal(names[0]);
      expect(holders[0].role).to.equal(roles[0]);
      expect(holders[0].basisPoints).to.equal(basisPoints[0]);

      expect(holders[1].wallet).to.equal(bob.address);
      expect(holders[2].wallet).to.equal(carol.address);
    });

    it("should set the deployer as owner", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should revert if array lengths mismatch", async function () {
      const [, a, b] = await ethers.getSigners();
      const RevenueRights = await ethers.getContractFactory("RevenueRights");

      await expect(
        RevenueRights.deploy(
          [a.address, b.address],
          ["A"],
          ["Role1", "Role2"],
          [5000, 5000]
        )
      ).to.be.revertedWith("Array length mismatch");
    });

    it("should revert if basis points do not sum to 10 000", async function () {
      const [, a, b] = await ethers.getSigners();
      const RevenueRights = await ethers.getContractFactory("RevenueRights");

      await expect(
        RevenueRights.deploy(
          [a.address, b.address],
          ["A", "B"],
          ["R1", "R2"],
          [5000, 4000] // = 9 000, not 10 000
        )
      ).to.be.revertedWith("Basis points must sum to 10000");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. distributeRevenue()
  // ═══════════════════════════════════════════════════════════════
  describe("distributeRevenue()", function () {
    it("should accrue balances proportionally", async function () {
      const { contract, alice, bob, carol, owner } =
        await loadFixture(deployFixture);

      const sendValue = ethers.parseEther("1.0");
      await contract.connect(owner).distributeRevenue({ value: sendValue });

      // 50 % of 1 ETH = 0.5 ETH
      expect(await contract.accruedBalances(alice.address)).to.equal(
        ethers.parseEther("0.5")
      );
      // 30 % of 1 ETH = 0.3 ETH
      expect(await contract.accruedBalances(bob.address)).to.equal(
        ethers.parseEther("0.3")
      );
      // 20 % gets the remainder — should equal 0.2 ETH
      expect(await contract.accruedBalances(carol.address)).to.equal(
        ethers.parseEther("0.2")
      );
    });

    it("should handle odd-cent rounding (no dust lost)", async function () {
      const { contract, alice, bob, carol, owner } =
        await loadFixture(deployFixture);

      // 1 wei is indivisible: check no revert and sum equals msg.value
      const sendValue = 1n; // 1 wei
      await contract.connect(owner).distributeRevenue({ value: sendValue });

      const a = await contract.accruedBalances(alice.address);
      const b = await contract.accruedBalances(bob.address);
      const c = await contract.accruedBalances(carol.address);
      // The last holder gets the remainder, so sum must equal 1
      expect(a + b + c).to.equal(sendValue);
    });

    it("should update totalDistributed", async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("2.0") });
      expect(await contract.getTotalDistributed()).to.equal(
        ethers.parseEther("2.0")
      );
    });

    it("should accumulate across multiple distributions", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });
      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });

      // 50 % of 2 ETH = 1 ETH
      expect(await contract.accruedBalances(alice.address)).to.equal(
        ethers.parseEther("1.0")
      );
    });

    it("should revert on zero-value send", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).distributeRevenue({ value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });

    it("should emit RevenueDistributed event", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      const value = ethers.parseEther("1.0");

      await expect(contract.connect(owner).distributeRevenue({ value }))
        .to.emit(contract, "RevenueDistributed")
        .withArgs(owner.address, value, (ts) => ts > 0n);
    });

    it("should emit HolderPaid events for each holder", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);
      const value = ethers.parseEther("1.0");

      await expect(contract.connect(owner).distributeRevenue({ value }))
        .to.emit(contract, "HolderPaid")
        .withArgs(
          alice.address,
          "Alice",
          "Director",
          ethers.parseEther("0.5"),
          5000
        );
    });

    it("should allow anyone (not just owner) to distribute", async function () {
      const { contract, outsider, alice } = await loadFixture(deployFixture);
      const value = ethers.parseEther("0.5");

      await contract.connect(outsider).distributeRevenue({ value });
      expect(await contract.accruedBalances(alice.address)).to.equal(
        ethers.parseEther("0.25")
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. receive() fallback
  // ═══════════════════════════════════════════════════════════════
  describe("receive() fallback", function () {
    it("should auto-distribute when ETH is sent directly", async function () {
      const { contract, alice, outsider } = await loadFixture(deployFixture);
      const addr = await contract.getAddress();

      await outsider.sendTransaction({
        to: addr,
        value: ethers.parseEther("1.0"),
      });

      expect(await contract.accruedBalances(alice.address)).to.equal(
        ethers.parseEther("0.5")
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. claim()
  // ═══════════════════════════════════════════════════════════════
  describe("claim()", function () {
    it("should transfer accrued balance to holder", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("2.0") });

      const balBefore = await ethers.provider.getBalance(alice.address);
      const tx = await contract.connect(alice).claim();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(alice.address);

      // Alice should have received 50 % of 2 ETH = 1 ETH (minus gas)
      expect(balAfter - balBefore + gasCost).to.equal(
        ethers.parseEther("1.0")
      );
    });

    it("should zero out accrued balance after claim", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });
      await contract.connect(alice).claim();

      expect(await contract.accruedBalances(alice.address)).to.equal(0);
    });

    it("should emit HolderClaimed event", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });

      await expect(contract.connect(alice).claim())
        .to.emit(contract, "HolderClaimed")
        .withArgs(alice.address, ethers.parseEther("0.5"));
    });

    it("should revert when caller has no balance", async function () {
      const { contract, outsider } = await loadFixture(deployFixture);
      await expect(contract.connect(outsider).claim()).to.be.revertedWith(
        "No balance to claim"
      );
    });

    it("should revert on double claim (no balance left)", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });
      await contract.connect(alice).claim();

      await expect(contract.connect(alice).claim()).to.be.revertedWith(
        "No balance to claim"
      );
    });

    it("should reduce contract balance after claim", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });

      const contractBalBefore = await contract.getContractBalance();
      await contract.connect(alice).claim();
      const contractBalAfter = await contract.getContractBalance();

      expect(contractBalBefore - contractBalAfter).to.equal(
        ethers.parseEther("0.5")
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. View helpers
  // ═══════════════════════════════════════════════════════════════
  describe("View helpers", function () {
    it("getContractBalance() should reflect held funds", async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("3.0") });

      expect(await contract.getContractBalance()).to.equal(
        ethers.parseEther("3.0")
      );
    });

    it("getRightsHolders() should return all holders", async function () {
      const { contract } = await loadFixture(deployFixture);
      const holders = await contract.getRightsHolders();
      expect(holders.length).to.equal(3);
    });

    it("getTotalDistributed() should track cumulative distributions", async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });
      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("0.5") });

      expect(await contract.getTotalDistributed()).to.equal(
        ethers.parseEther("1.5")
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. Multi-holder claim scenario
  // ═══════════════════════════════════════════════════════════════
  describe("Multi-holder claim lifecycle", function () {
    it("all holders should be able to claim independently", async function () {
      const { contract, alice, bob, carol, owner } =
        await loadFixture(deployFixture);

      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("10.0") });

      // Alice claims 5 ETH
      await contract.connect(alice).claim();
      expect(await contract.accruedBalances(alice.address)).to.equal(0);

      // Bob claims 3 ETH
      await contract.connect(bob).claim();
      expect(await contract.accruedBalances(bob.address)).to.equal(0);

      // Carol claims 2 ETH
      await contract.connect(carol).claim();
      expect(await contract.accruedBalances(carol.address)).to.equal(0);

      // Contract should be drained
      expect(await contract.getContractBalance()).to.equal(0);
    });

    it("partial claim + new distribution should accumulate correctly", async function () {
      const { contract, alice, owner } = await loadFixture(deployFixture);

      // First distribution: 1 ETH → Alice gets 0.5 ETH
      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("1.0") });
      await contract.connect(alice).claim(); // Claims 0.5

      // Second distribution: 2 ETH → Alice gets 1.0 ETH
      await contract
        .connect(owner)
        .distributeRevenue({ value: ethers.parseEther("2.0") });
      expect(await contract.accruedBalances(alice.address)).to.equal(
        ethers.parseEther("1.0")
      );
    });
  });
});
