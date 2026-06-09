const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SplitGroup", function () {
  let splitGroup, cUSD;
  let owner, alice, bob, carol;
  const CUSD_DECIMALS = 18n;
  const ONE_CUSD = 10n ** CUSD_DECIMALS;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", 18);

    const SplitGroup = await ethers.getContractFactory("SplitGroup");
    splitGroup = await SplitGroup.deploy(await cUSD.getAddress());

    // Fund alice and bob with cUSD
    await cUSD.mint(alice.address, ONE_CUSD * 1000n);
    await cUSD.mint(bob.address, ONE_CUSD * 1000n);
  });

  // ─── createGroup ─────────────────────────────────────────────────────────────

  describe("createGroup", function () {
    it("creates a group and adds creator as member", async function () {
      const tx = await splitGroup.connect(alice).createGroup("Ski Trip", []);
      const receipt = await tx.wait();

      const groupId = 1n;
      const group = await splitGroup.groups(groupId);
      expect(group.name).to.equal("Ski Trip");
      expect(group.creator).to.equal(alice.address);
      expect(group.exists).to.be.true;

      expect(await splitGroup.isMember(groupId, alice.address)).to.be.true;
    });

    it("adds initial members provided at creation", async function () {
      await splitGroup.connect(alice).createGroup("Trip", [bob.address, carol.address]);
      const groupId = 1n;

      expect(await splitGroup.isMember(groupId, alice.address)).to.be.true;
      expect(await splitGroup.isMember(groupId, bob.address)).to.be.true;
      expect(await splitGroup.isMember(groupId, carol.address)).to.be.true;
    });

    it("emits GroupCreated event", async function () {
      await expect(splitGroup.connect(alice).createGroup("Trip", []))
        .to.emit(splitGroup, "GroupCreated")
        .withArgs(1n, alice.address, "Trip");
    });

    it("increments groupCount", async function () {
      await splitGroup.connect(alice).createGroup("A", []);
      await splitGroup.connect(bob).createGroup("B", []);
      expect(await splitGroup.groupCount()).to.equal(2n);
    });

    it("skips duplicate addresses in initial members", async function () {
      await splitGroup.connect(alice).createGroup("Trip", [bob.address, bob.address]);
      const group = await splitGroup.groups(1n);
      // alice + bob (deduplicated)
      expect(group.members.length).to.equal(2n);
    });
  });

  // ─── joinGroup ────────────────────────────────────────────────────────────────

  describe("joinGroup", function () {
    let groupId;

    beforeEach(async function () {
      await splitGroup.connect(alice).createGroup("Road Trip", []);
      groupId = 1n;
    });

    it("allows a new address to join", async function () {
      await splitGroup.connect(bob).joinGroup(groupId);
      expect(await splitGroup.isMember(groupId, bob.address)).to.be.true;
    });

    it("emits MemberAdded", async function () {
      await expect(splitGroup.connect(bob).joinGroup(groupId))
        .to.emit(splitGroup, "MemberAdded")
        .withArgs(groupId, bob.address);
    });

    it("reverts if group does not exist", async function () {
      await expect(splitGroup.connect(bob).joinGroup(999n))
        .to.be.revertedWithCustomError(splitGroup, "GroupNotFound");
    });

    it("reverts if already a member", async function () {
      await splitGroup.connect(bob).joinGroup(groupId);
      await expect(splitGroup.connect(bob).joinGroup(groupId))
        .to.be.revertedWithCustomError(splitGroup, "AlreadyMember");
    });
  });

  // ─── addExpense ───────────────────────────────────────────────────────────────

  describe("addExpense", function () {
    let groupId;

    beforeEach(async function () {
      await splitGroup.connect(alice).createGroup("Lunch", [bob.address]);
      groupId = 1n;
    });

    it("records an equal split expense and updates balances", async function () {
      const amount = ONE_CUSD * 10n; // 10 cUSD
      const half = amount / 2n;

      await splitGroup.connect(alice).addExpense(
        groupId, amount, "Pizza",
        [alice.address, bob.address],
        [half, half]
      );

      // alice paid 10, is owed 5 by bob (her own half cancels)
      const aliceBalance = await splitGroup.getMemberBalance(groupId, alice.address);
      const bobBalance = await splitGroup.getMemberBalance(groupId, bob.address);

      expect(aliceBalance).to.equal(0n); // +5 (from bob's half) - 5 (her own half) = 0
      expect(bobBalance).to.equal(-5n * ONE_CUSD); // owes 5
    });

    it("emits ExpenseAdded", async function () {
      const amount = ONE_CUSD;
      await expect(
        splitGroup.connect(alice).addExpense(groupId, amount, "Coffee",
          [bob.address], [amount])
      ).to.emit(splitGroup, "ExpenseAdded");
    });

    it("reverts if splits don't sum to total", async function () {
      await expect(
        splitGroup.connect(alice).addExpense(groupId, ONE_CUSD, "Bad split",
          [alice.address, bob.address], [ONE_CUSD / 2n, ONE_CUSD / 3n]) // doesn't sum
      ).to.be.revertedWithCustomError(splitGroup, "InvalidSplits");
    });

    it("reverts if split arrays have different lengths", async function () {
      await expect(
        splitGroup.connect(alice).addExpense(groupId, ONE_CUSD, "Mismatch",
          [alice.address, bob.address], [ONE_CUSD])
      ).to.be.revertedWithCustomError(splitGroup, "InvalidSplits");
    });

    it("reverts if caller is not a member", async function () {
      await expect(
        splitGroup.connect(carol).addExpense(groupId, ONE_CUSD, "Nope",
          [carol.address], [ONE_CUSD])
      ).to.be.revertedWithCustomError(splitGroup, "NotMember");
    });

    it("reverts if group does not exist", async function () {
      await expect(
        splitGroup.connect(alice).addExpense(999n, ONE_CUSD, "Nope", [alice.address], [ONE_CUSD])
      ).to.be.revertedWithCustomError(splitGroup, "GroupNotFound");
    });
  });

  // ─── settleDebt ───────────────────────────────────────────────────────────────

  describe("settleDebt", function () {
    let groupId;
    const expense = ONE_CUSD * 10n;

    beforeEach(async function () {
      await splitGroup.connect(alice).createGroup("Dinner", [bob.address]);
      groupId = 1n;

      // alice pays 10 cUSD, bob owes all of it
      await splitGroup.connect(alice).addExpense(
        groupId, expense, "Dinner",
        [bob.address], [expense]
      );

      // bob approves the contract to spend cUSD
      await cUSD.connect(bob).approve(await splitGroup.getAddress(), expense);
    });

    it("transfers cUSD from debtor to creditor", async function () {
      const aliceBefore = await cUSD.balanceOf(alice.address);
      await splitGroup.connect(bob).settleDebt(groupId, alice.address, expense);
      const aliceAfter = await cUSD.balanceOf(alice.address);

      expect(aliceAfter - aliceBefore).to.equal(expense);
    });

    it("updates onchain balances after settlement", async function () {
      await splitGroup.connect(bob).settleDebt(groupId, alice.address, expense);

      expect(await splitGroup.getMemberBalance(groupId, bob.address)).to.equal(0n);
      expect(await splitGroup.getMemberBalance(groupId, alice.address)).to.equal(0n);
    });

    it("emits DebtSettled", async function () {
      await expect(splitGroup.connect(bob).settleDebt(groupId, alice.address, expense))
        .to.emit(splitGroup, "DebtSettled")
        .withArgs(groupId, bob.address, alice.address, expense);
    });

    it("reverts if caller is not a member", async function () {
      await expect(splitGroup.connect(carol).settleDebt(groupId, alice.address, expense))
        .to.be.revertedWithCustomError(splitGroup, "NotMember");
    });
  });

  // ─── getMemberBalance ─────────────────────────────────────────────────────────

  describe("getMemberBalance", function () {
    it("returns 0 for a member with no expenses", async function () {
      await splitGroup.connect(alice).createGroup("Empty", [bob.address]);
      expect(await splitGroup.getMemberBalance(1n, alice.address)).to.equal(0n);
    });

    it("accumulates balance across multiple expenses", async function () {
      await splitGroup.connect(alice).createGroup("Multi", [bob.address]);
      const groupId = 1n;
      const amount = ONE_CUSD * 5n;

      // alice pays twice
      await splitGroup.connect(alice).addExpense(groupId, amount, "A", [bob.address], [amount]);
      await splitGroup.connect(alice).addExpense(groupId, amount, "B", [bob.address], [amount]);

      expect(await splitGroup.getMemberBalance(groupId, alice.address)).to.equal(ONE_CUSD * 10n);
      expect(await splitGroup.getMemberBalance(groupId, bob.address)).to.equal(-ONE_CUSD * 10n);
    });
  });
});
