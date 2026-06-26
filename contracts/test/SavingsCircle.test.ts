import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SavingsCircle, MockERC20 } from "../typechain-types";

describe("SavingsCircle Contract", function () {
  let savingsCircle: SavingsCircle;
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

    // Deploy SavingsCircle
    const SavingsCircleFactory = await ethers.getContractFactory("SavingsCircle");
    savingsCircle = (await SavingsCircleFactory.deploy(await mockusdm.getAddress())) as SavingsCircle;
    await savingsCircle.waitForDeployment();

    // Distribute some usdm to other addresses for testing
    await mockusdm.transfer(addr1.address, ethers.parseEther("100"));
    await mockusdm.transfer(addr2.address, ethers.parseEther("100"));
    await mockusdm.transfer(addr3.address, ethers.parseEther("100"));
  });

  describe("Deployment", function () {
    it("Should set the correct usdm token address", async function () {
      expect(await savingsCircle.usdm()).to.equal(await mockusdm.getAddress());
    });
  });

  describe("Circle Creation & Joining", function () {
    it("Should create a rotating savings circle", async function () {
      const name = "Vacation Saver";
      const mode = 0; // Rotating
      const contribution = ethers.parseEther("10"); // 10 usdm
      const frequency = 604800; // 1 week in seconds
      const grace = 86400; // 1 day in seconds
      const maxMissed = 2;
      const maxMembers = 5;

      await expect(savingsCircle.connect(owner).createCircle(
        name, mode, contribution, frequency, grace, maxMissed, maxMembers, 0, 0, 0, 3600
      )).to.emit(savingsCircle, "CircleCreated").withArgs(1, owner.address, name, mode);

      const circle = await savingsCircle.getCircle(1);
      expect(circle.name).to.equal(name);
      expect(circle.mode).to.equal(mode);
      expect(circle.contributionAmount).to.equal(contribution);
      expect(circle.memberAddrs).to.deep.equal([owner.address]);
    });

    it("Should allow another member to join", async function () {
      const mode = 0; // Rotating
      const contribution = ethers.parseEther("10");
      await savingsCircle.connect(owner).createCircle(
        "Saver", mode, contribution, 604800, 86400, 2, 5, 0, 0, 0, 3600
      );

      await expect(savingsCircle.connect(addr1).joinCircle(1))
        .to.emit(savingsCircle, "MemberJoined").withArgs(1, addr1.address);

      const circle = await savingsCircle.getCircle(1);
      expect(circle.memberAddrs).to.deep.equal([owner.address, addr1.address]);
    });
  });

  describe("Rotating Circle Payout Flow", function () {
    beforeEach(async function () {
      // 2 members: owner & addr1, weekly interval
      await savingsCircle.connect(owner).createCircle(
        "Weekly Saver", 0, ethers.parseEther("10"), 604800, 86400, 2, 2, 0, 0, 0, 3600
      );
      await savingsCircle.connect(addr1).joinCircle(1);

      // Approve usdm spend for both
      await mockusdm.connect(owner).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
      await mockusdm.connect(addr1).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
    });

    it("Should execute payout when everyone contributes", async function () {
      // Owner contributes
      await expect(savingsCircle.connect(owner).contribute(1))
        .to.emit(savingsCircle, "ContributionMade")
        .withArgs(1, owner.address, ethers.parseEther("10"), 0);

      // Addr1 contributes -> should trigger payout automatically
      const nextRecipient = await savingsCircle.getNextRecipient(1);
      expect(nextRecipient).to.equal(owner.address);

      const balBefore = await mockusdm.balanceOf(owner.address);

      await expect(savingsCircle.connect(addr1).contribute(1))
        .to.emit(savingsCircle, "PayoutSent")
        .withArgs(1, owner.address, ethers.parseEther("20"), 0);

      const balAfter = await mockusdm.balanceOf(owner.address);
      // Owner gets the full 20 usdm payout (owner spent 10 earlier, so net cycle change is +10)
      expect(balAfter - balBefore).to.equal(ethers.parseEther("20"));

      // Cycle should advance to 1
      const circle = await savingsCircle.getCircle(1);
      expect(circle.currentCycle).to.equal(1n);
      expect(circle.currentPot).to.equal(0n);
    });
  });

  describe("Goal Circle Flow", function () {
    const goalAmount = ethers.parseEther("50");

    beforeEach(async function () {
      const currentBlockTime = (await ethers.provider.getBlock("latest"))!.timestamp;
      const deadline = currentBlockTime + 10000;
      await savingsCircle.connect(owner).createCircle(
        "Goal Saver", 1, ethers.parseEther("25"), 604800, 86400, 2, 5, 0, goalAmount, deadline, 3600
      );
      await savingsCircle.connect(addr1).joinCircle(1);

      await mockusdm.connect(owner).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
      await mockusdm.connect(addr1).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow creator to distribute once goal is reached", async function () {
      await savingsCircle.connect(owner).contribute(1);
      await savingsCircle.connect(addr1).contribute(1);

      const circle = await savingsCircle.getCircle(1);
      expect(circle.totalSaved).to.equal(goalAmount);

      const balBeforeOwner = await mockusdm.balanceOf(owner.address);
      const balBeforeAddr1 = await mockusdm.balanceOf(addr1.address);

      // Distribute goal funds -> splits equally (25 usdm each)
      await expect(savingsCircle.connect(owner).distributeGoal(1))
        .to.emit(savingsCircle, "PayoutSent")
        .withArgs(1, owner.address, ethers.parseEther("25"), 0)
        .and.to.emit(savingsCircle, "PayoutSent")
        .withArgs(1, addr1.address, ethers.parseEther("25"), 0);

      expect(await mockusdm.balanceOf(owner.address)).to.equal(balBeforeOwner + ethers.parseEther("25"));
      expect(await mockusdm.balanceOf(addr1.address)).to.equal(balBeforeAddr1 + ethers.parseEther("25"));
    });
  });

  describe("Exit & Dissolve Circle", function () {
    beforeEach(async function () {
      await savingsCircle.connect(owner).createCircle(
        "Weekly Saver", 0, ethers.parseEther("10"), 604800, 86400, 2, 2, 0, 0, 0, 3600
      );
      await savingsCircle.connect(addr1).joinCircle(1);
      await mockusdm.connect(owner).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
      await mockusdm.connect(addr1).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow member to exit and claim refund", async function () {
      await savingsCircle.connect(addr1).contribute(1);

      const balBefore = await mockusdm.balanceOf(addr1.address);
      await expect(savingsCircle.connect(addr1).exitCircle(1))
        .to.emit(savingsCircle, "MemberExited")
        .withArgs(1, addr1.address, ethers.parseEther("10"));

      expect(await mockusdm.balanceOf(addr1.address)).to.equal(balBefore + ethers.parseEther("10"));
    });

    it("Should allow creator to dissolve and refund active members", async function () {
      // Create a Goal mode circle (mode 1) with ID 2 to avoid auto-distribution in rotating mode
      const currentBlockTime = (await ethers.provider.getBlock("latest"))!.timestamp;
      const deadline = currentBlockTime + 10000;
      await savingsCircle.connect(owner).createCircle(
        "Goal Saver Dissolve", 1, ethers.parseEther("10"), 604800, 86400, 2, 2, 0, ethers.parseEther("50"), deadline, 3600
      );
      await savingsCircle.connect(addr1).joinCircle(2);
      await mockusdm.connect(owner).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
      await mockusdm.connect(addr1).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));

      await savingsCircle.connect(owner).contribute(2);
      await savingsCircle.connect(addr1).contribute(2);

      // We have 20 usdm inside the contract. Dissolving should return 10 usdm to each.
      const balBeforeOwner = await mockusdm.balanceOf(owner.address);
      const balBeforeAddr1 = await mockusdm.balanceOf(addr1.address);

      await expect(savingsCircle.connect(owner).dissolveCircle(2))
        .to.emit(savingsCircle, "CircleDissolved")
        .withArgs(2, owner.address);

      expect(await mockusdm.balanceOf(owner.address)).to.equal(balBeforeOwner + ethers.parseEther("10"));
      expect(await mockusdm.balanceOf(addr1.address)).to.equal(balBeforeAddr1 + ethers.parseEther("10"));
    });
  });

  describe("Missed Contributions", function () {
    const frequency = 1000;
    const grace = 200;

    beforeEach(async function () {
      await savingsCircle.connect(owner).createCircle(
        "Rules Saver", 0, ethers.parseEther("10"), frequency, grace, 2, 2, 0, 0, 0, 3600
      );
      await savingsCircle.connect(addr1).joinCircle(1);
      await mockusdm.connect(owner).approve(await savingsCircle.getAddress(), ethers.parseEther("100"));
    });

    it("Should revert markMissed if grace period has not expired", async function () {
      await expect(savingsCircle.connect(owner).markMissed(1, addr1.address))
        .to.be.revertedWithCustomError(savingsCircle, "GracePeriodNotExpired");
    });

    it("Should mark member missed after deadline + grace expires", async function () {
      // Advance network time past deadline + grace period
      await ethers.provider.send("evm_increaseTime", [frequency + grace + 10]);
      await ethers.provider.send("evm_mine", []);

      await expect(savingsCircle.connect(owner).markMissed(1, addr1.address))
        .to.emit(savingsCircle, "MemberMissed")
        .withArgs(1, addr1.address, 0);

      const status = await savingsCircle.getMemberStatus(1, addr1.address);
      expect(status.missedCount).to.equal(1);
    });
  });
});
