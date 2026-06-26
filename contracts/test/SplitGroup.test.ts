import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SplitGroup, MockERC20 } from "../typechain-types";

describe("SplitGroup Contract", function () {
  let splitGroup: SplitGroup;
  let mockusdm: MockERC20;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy Mock usdm
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockusdm = (await MockERC20Factory.deploy("Mock usdm", "usdm", INITIAL_SUPPLY)) as MockERC20;
    await mockusdm.waitForDeployment();

    // Deploy SplitGroup
    const SplitGroupFactory = await ethers.getContractFactory("SplitGroup");
    splitGroup = (await SplitGroupFactory.deploy(await mockusdm.getAddress())) as SplitGroup;
    await splitGroup.waitForDeployment();

    // Distribute some usdm to other addresses for testing
    await mockusdm.transfer(addr1.address, ethers.parseEther("100"));
    await mockusdm.transfer(addr2.address, ethers.parseEther("100"));
    await mockusdm.transfer(addr3.address, ethers.parseEther("100"));
  });

  describe("Deployment", function () {
    it("Should set the correct usdm token address", async function () {
      expect(await splitGroup.usdm()).to.equal(await mockusdm.getAddress());
    });
  });

  describe("Group Management", function () {
    it("Should create a group and add initial members", async function () {
      const groupName = "Weekend Trip";
      const initialMembers = [addr1.address, addr2.address];

      await expect(splitGroup.connect(owner).createGroup(groupName, initialMembers))
        .to.emit(splitGroup, "GroupCreated")
        .withArgs(1, owner.address, groupName)
        .and.to.emit(splitGroup, "MemberAdded")
        .withArgs(1, owner.address)
        .and.to.emit(splitGroup, "MemberAdded")
        .withArgs(1, addr1.address)
        .and.to.emit(splitGroup, "MemberAdded")
        .withArgs(1, addr2.address);

      const group = await splitGroup.getGroup(1);
      expect(group.name).to.equal(groupName);
      expect(group.creator).to.equal(owner.address);
      expect(group.members).to.deep.equal([owner.address, addr1.address, addr2.address]);
      expect(group.expCount).to.equal(0n);

      expect(await splitGroup.isMember(1, owner.address)).to.be.true;
      expect(await splitGroup.isMember(1, addr1.address)).to.be.true;
      expect(await splitGroup.isMember(1, addr2.address)).to.be.true;
      expect(await splitGroup.isMember(1, addr3.address)).to.be.false;
    });

    it("Should allow a new member to join an existing group", async function () {
      await splitGroup.connect(owner).createGroup("Trip", [addr1.address]);

      await expect(splitGroup.connect(addr2).joinGroup(1))
        .to.emit(splitGroup, "MemberAdded")
        .withArgs(1, addr2.address);

      expect(await splitGroup.isMember(1, addr2.address)).to.be.true;
      const group = await splitGroup.getGroup(1);
      expect(group.members).to.deep.equal([owner.address, addr1.address, addr2.address]);
    });

    it("Should revert if trying to join a non-existent group", async function () {
      await expect(splitGroup.connect(addr1).joinGroup(999))
        .to.be.revertedWithCustomError(splitGroup, "GroupNotFound")
        .withArgs(999);
    });

    it("Should revert if an existing member tries to join again", async function () {
      await splitGroup.connect(owner).createGroup("Trip", [addr1.address]);

      await expect(splitGroup.connect(addr1).joinGroup(1))
        .to.be.revertedWithCustomError(splitGroup, "AlreadyMember")
        .withArgs(addr1.address);
    });
  });

  describe("Expenses", function () {
    beforeEach(async function () {
      await splitGroup.connect(owner).createGroup("Dinner", [addr1.address, addr2.address]);
    });

    it("Should record an expense and update balances correctly (equal split)", async function () {
      const amount = ethers.parseEther("30"); // 30 usdm
      const desc = "Pizza Dinner";
      const members = [owner.address, addr1.address, addr2.address];
      const splits = [ethers.parseEther("10"), ethers.parseEther("10"), ethers.parseEther("10")]; // 10 usdm each

      // Owner pays 30 usdm, splits it equally among owner, addr1, addr2
      await expect(splitGroup.connect(owner).addExpense(1, amount, desc, members, splits))
        .to.emit(splitGroup, "ExpenseAdded")
        .withArgs(1, 1, owner.address, amount, desc);

      // Balances update logic:
      // Payer (owner) gets credited: splits sum minus total amount paid
      // Wait: in the contract:
      // balances[owner] += 10 (owner's split) + 10 (addr1's split) + 10 (addr2's split) = 30
      // balances[addr1] -= 10
      // balances[addr2] -= 10
      // then balances[owner] -= 30 (total amount paid by owner)
      // Result net balances:
      // owner: +20 usdm (others owe owner 20)
      // addr1: -10 usdm
      // addr2: -10 usdm
      expect(await splitGroup.getMemberBalance(1, owner.address)).to.equal(ethers.parseEther("20"));
      expect(await splitGroup.getMemberBalance(1, addr1.address)).to.equal(ethers.parseEther("-10"));
      expect(await splitGroup.getMemberBalance(1, addr2.address)).to.equal(ethers.parseEther("-10"));

      // Check expense details
      const expense = await splitGroup.getExpense(1, 1);
      expect(expense.paidBy).to.equal(owner.address);
      expect(expense.amount).to.equal(amount);
      expect(expense.description).to.equal(desc);

      // Check splits
      const expenseSplits = await splitGroup.getExpenseSplits(1, 1);
      expect(expenseSplits.members).to.deep.equal(members);
      expect(expenseSplits.amounts).to.deep.equal(splits);

      expect(await splitGroup.getGroupExpenseCount(1)).to.equal(1n);
    });

    it("Should revert if non-member tries to add an expense", async function () {
      const amount = ethers.parseEther("30");
      await expect(
        splitGroup.connect(addr3).addExpense(1, amount, "Test", [owner.address], [amount])
      ).to.be.revertedWithCustomError(splitGroup, "NotMember").withArgs(1, addr3.address);
    });

    it("Should revert if splits length mismatches", async function () {
      const amount = ethers.parseEther("30");
      await expect(
        splitGroup.connect(owner).addExpense(1, amount, "Test", [owner.address, addr1.address], [amount])
      ).to.be.revertedWithCustomError(splitGroup, "InvalidSplits");
    });

    it("Should revert if splits do not sum to total amount", async function () {
      const amount = ethers.parseEther("30");
      await expect(
        splitGroup.connect(owner).addExpense(
          1,
          amount,
          "Test",
          [owner.address, addr1.address],
          [ethers.parseEther("10"), ethers.parseEther("10")]
        )
      ).to.be.revertedWithCustomError(splitGroup, "InvalidSplits");
    });
  });

  describe("Settlement", function () {
    beforeEach(async function () {
      // Create group with owner, addr1, addr2
      await splitGroup.connect(owner).createGroup("SettleTest", [addr1.address, addr2.address]);

      // Add expense of 30 usdm paid by owner, split equally
      const amount = ethers.parseEther("30");
      await splitGroup.connect(owner).addExpense(
        1,
        amount,
        "Dinner",
        [owner.address, addr1.address, addr2.address],
        [ethers.parseEther("10"), ethers.parseEther("10"), ethers.parseEther("10")]
      );
    });

    it("Should allow a member to settle debt and update balances onchain", async function () {
      // addr1 owes owner 10 usdm. Let's settle it.
      const settleAmount = ethers.parseEther("10");

      // Approve usdm transfer
      await mockusdm.connect(addr1).approve(await splitGroup.getAddress(), settleAmount);

      const balOwnerBefore = await mockusdm.balanceOf(owner.address);
      const balAddr1Before = await mockusdm.balanceOf(addr1.address);

      await expect(splitGroup.connect(addr1).settleDebt(1, owner.address, settleAmount))
        .to.emit(splitGroup, "DebtSettled")
        .withArgs(1, addr1.address, owner.address, settleAmount);

      // ERC20 balance transfers
      expect(await mockusdm.balanceOf(owner.address)).to.equal(balOwnerBefore + settleAmount);
      expect(await mockusdm.balanceOf(addr1.address)).to.equal(balAddr1Before - settleAmount);

      // Net balances onchain update
      // owner balance goes from +20 usdm to +10 usdm (since they got paid 10)
      // addr1 balance goes from -10 usdm to 0 usdm (since they paid 10)
      expect(await splitGroup.getMemberBalance(1, owner.address)).to.equal(ethers.parseEther("10"));
      expect(await splitGroup.getMemberBalance(1, addr1.address)).to.equal(0n);
      expect(await splitGroup.getMemberBalance(1, addr2.address)).to.equal(ethers.parseEther("-10"));
    });

    it("Should revert if settle fails due to insufficient allowance", async function () {
      const settleAmount = ethers.parseEther("10");
      // No allowance approved
      await expect(
        splitGroup.connect(addr1).settleDebt(1, owner.address, settleAmount)
      ).to.be.reverted; // Reverts with standard ERC20/revert error
    });

    it("Should revert if settle is called for a non-member", async function () {
      const settleAmount = ethers.parseEther("10");
      await expect(
        splitGroup.connect(addr3).settleDebt(1, owner.address, settleAmount)
      ).to.be.revertedWithCustomError(splitGroup, "NotMember").withArgs(1, addr3.address);
    });
  });
});
