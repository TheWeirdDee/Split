const { expect } = require("chai");
const { ethers } = require("hardhat");

const DECIMALS = 18n;
const ONE = 10n ** DECIMALS;

const DAY = 86400n;
const HOUR = 3600n;

async function increaseTime(secs) {
  await ethers.provider.send("evm_increaseTime", [Number(secs)]);
  await ethers.provider.send("evm_mine", []);
}

describe("SavingsCircle", function () {
  let circle, usdm;
  let owner, alice, bob, carol;

  // Default circle config helpers
  const rotatingConfig = () => ({
    name: "Test Circle",
    mode: 0, // Rotating
    contributionAmount: ONE * 5n,   // 5 usdm
    frequency: DAY,                 // daily
    gracePeriod: HOUR * 4n,
    maxMissed: 2,
    maxMembers: 4n,
    maxCycles: 0n,
    goalAmount: 0n,
    goalDeadline: 0n,
    reminderLeadTime: HOUR,
  });

  const goalConfig = () => ({
    name: "Goal Circle",
    mode: 1, // Goal
    contributionAmount: ONE * 10n,
    frequency: DAY * 7n,
    gracePeriod: HOUR * 24n,
    maxMissed: 2,
    maxMembers: 0n,
    maxCycles: 0n,
    goalAmount: ONE * 30n,
    goalDeadline: 0n, // set dynamically
    reminderLeadTime: HOUR,
  });

  async function createCircle(signer, cfg) {
    const c = cfg || rotatingConfig();
    const tx = await circle.connect(signer).createCircle(
      c.name, c.mode, c.contributionAmount, c.frequency, c.gracePeriod,
      c.maxMissed, c.maxMembers, c.maxCycles, c.goalAmount, c.goalDeadline,
      c.reminderLeadTime
    );
    await tx.wait();
    return (await circle.circleCount());
  }

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdm = await MockERC20.deploy("Celo Dollar", "usdm", 18);

    const SavingsCircle = await ethers.getContractFactory("SavingsCircle");
    circle = await SavingsCircle.deploy(await usdm.getAddress());

    // Fund members
    for (const signer of [alice, bob, carol]) {
      await usdm.mint(signer.address, ONE * 10000n);
      await usdm.connect(signer).approve(await circle.getAddress(), ONE * 10000n);
    }
  });

  // ─── createCircle ─────────────────────────────────────────────────────────────

  describe("createCircle", function () {
    it("creates a circle and adds creator as member", async function () {
      const circleId = await createCircle(alice);
      const res = await circle.getCircle(circleId);
      expect(res[0]).to.equal("Test Circle"); // name
      expect(res[2]).to.equal(0); // Active status
      expect(res[8]).to.include(alice.address); // memberAddrs
    });

    it("emits CircleCreated", async function () {
      const cfg = rotatingConfig();
      await expect(circle.connect(alice).createCircle(
        cfg.name, cfg.mode, cfg.contributionAmount, cfg.frequency, cfg.gracePeriod,
        cfg.maxMissed, cfg.maxMembers, cfg.maxCycles, cfg.goalAmount, cfg.goalDeadline,
        cfg.reminderLeadTime
      )).to.emit(circle, "CircleCreated");
    });

    it("increments circleCount", async function () {
      await createCircle(alice);
      await createCircle(bob);
      expect(await circle.circleCount()).to.equal(2n);
    });

    it("reverts if contributionAmount is 0", async function () {
      const cfg = { ...rotatingConfig(), contributionAmount: 0n };
      await expect(circle.connect(alice).createCircle(
        cfg.name, cfg.mode, cfg.contributionAmount, cfg.frequency, cfg.gracePeriod,
        cfg.maxMissed, cfg.maxMembers, cfg.maxCycles, cfg.goalAmount, cfg.goalDeadline,
        cfg.reminderLeadTime
      )).to.be.revertedWithCustomError(circle, "InvalidConfig");
    });

    it("reverts if frequency is 0", async function () {
      const cfg = { ...rotatingConfig(), frequency: 0n };
      await expect(circle.connect(alice).createCircle(
        cfg.name, cfg.mode, cfg.contributionAmount, cfg.frequency, cfg.gracePeriod,
        cfg.maxMissed, cfg.maxMembers, cfg.maxCycles, cfg.goalAmount, cfg.goalDeadline,
        cfg.reminderLeadTime
      )).to.be.revertedWithCustomError(circle, "InvalidConfig");
    });

    it("reverts if goal mode has 0 goalAmount", async function () {
      const cfg = { ...goalConfig(), goalAmount: 0n };
      await expect(circle.connect(alice).createCircle(
        cfg.name, cfg.mode, cfg.contributionAmount, cfg.frequency, cfg.gracePeriod,
        cfg.maxMissed, cfg.maxMembers, cfg.maxCycles, cfg.goalAmount, cfg.goalDeadline,
        cfg.reminderLeadTime
      )).to.be.revertedWithCustomError(circle, "InvalidConfig");
    });
  });

  // ─── joinCircle ───────────────────────────────────────────────────────────────

  describe("joinCircle", function () {
    let circleId;

    beforeEach(async function () {
      circleId = await createCircle(alice);
    });

    it("allows a new member to join", async function () {
      await circle.connect(bob).joinCircle(circleId);
      const res = await circle.getCircle(circleId);
      expect(res[8]).to.include(bob.address);
    });

    it("emits MemberJoined", async function () {
      await expect(circle.connect(bob).joinCircle(circleId))
        .to.emit(circle, "MemberJoined")
        .withArgs(circleId, bob.address);
    });

    it("reverts if already a member", async function () {
      await circle.connect(bob).joinCircle(circleId);
      await expect(circle.connect(bob).joinCircle(circleId))
        .to.be.revertedWithCustomError(circle, "AlreadyMember");
    });

    it("reverts if circle is full", async function () {
      const cfg = { ...rotatingConfig(), maxMembers: 2n }; // alice + 1
      circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);
      await expect(circle.connect(carol).joinCircle(circleId))
        .to.be.revertedWithCustomError(circle, "CircleFull");
    });

    it("reverts if circle does not exist", async function () {
      await expect(circle.connect(bob).joinCircle(999n))
        .to.be.revertedWithCustomError(circle, "CircleNotFound");
    });
  });

  // ─── contribute ───────────────────────────────────────────────────────────────

  describe("contribute", function () {
    let circleId;
    const amount = ONE * 5n;

    beforeEach(async function () {
      circleId = await createCircle(alice);
      await circle.connect(bob).joinCircle(circleId);
    });

    it("transfers usdm to the contract", async function () {
      const before = await usdm.balanceOf(await circle.getAddress());
      await circle.connect(alice).contribute(circleId);
      const after = await usdm.balanceOf(await circle.getAddress());
      expect(after - before).to.equal(amount);
    });

    it("updates the circle pot and totalSaved", async function () {
      await circle.connect(alice).contribute(circleId);
      const res = await circle.getCircle(circleId);
      expect(res[4]).to.equal(amount); // currentPot
      expect(res[7]).to.equal(amount); // totalSaved
    });

    it("emits ContributionMade", async function () {
      await expect(circle.connect(alice).contribute(circleId))
        .to.emit(circle, "ContributionMade");
    });

    it("reverts if member contributes twice in the same cycle", async function () {
      await circle.connect(alice).contribute(circleId);
      await expect(circle.connect(alice).contribute(circleId))
        .to.be.revertedWithCustomError(circle, "AlreadyContributed");
    });

    it("auto-distributes when all active members contribute (rotating)", async function () {
      // alice and bob both contribute — should trigger auto-distribute
      const contractAddr = await circle.getAddress();
      await circle.connect(alice).contribute(circleId);

      const bobBefore = await usdm.balanceOf(bob.address);
      const aliceBefore = await usdm.balanceOf(alice.address);

      await circle.connect(bob).contribute(circleId);

      const bobAfter = await usdm.balanceOf(bob.address);
      const aliceAfter = await usdm.balanceOf(alice.address);

      // One of them received the payout (alice or bob depending on rotation order)
      const totalPayout = amount * 2n;
      const totalReceived = (aliceAfter - aliceBefore) + (bobAfter - bobBefore);
      // Net: one receives the pot, one doesn't (minus their contribution)
      // Payout should have been emitted
      expect(totalPayout + (aliceBefore + bobBefore)).to.be.lte(aliceAfter + bobAfter + totalPayout);
    });
  });

  // ─── markMissed ───────────────────────────────────────────────────────────────

  describe("markMissed", function () {
    let circleId;

    beforeEach(async function () {
      circleId = await createCircle(alice);
      await circle.connect(bob).joinCircle(circleId);
    });

    it("reverts if grace period has not expired", async function () {
      await expect(circle.connect(alice).markMissed(circleId, bob.address))
        .to.be.revertedWithCustomError(circle, "GracePeriodNotExpired");
    });

    it("marks member as missed after grace period expires", async function () {
      const cfg = rotatingConfig();
      await increaseTime(cfg.frequency + cfg.gracePeriod + 1n);

      await circle.connect(alice).markMissed(circleId, bob.address);
      // After markMissed, bob should have missedCount = 1
      const member = await circle.members(circleId, bob.address);
      expect(member.missedCount).to.equal(1);
    });

    it("removes member after max misses exceeded", async function () {
      const cfg = { ...rotatingConfig(), maxMissed: 1 }; // 1 miss = removal
      circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);

      // Bob does NOT contribute — advance past the first deadline + grace period
      await increaseTime(cfg.frequency + cfg.gracePeriod + 1n);

      await circle.connect(alice).markMissed(circleId, bob.address);

      const member = await circle.members(circleId, bob.address);
      expect(member.status).to.equal(2); // Removed = 2 (Active=0,Skipped=1,Removed=2,Exited=3)
    });

    it("reverts if member already contributed this cycle", async function () {
      await circle.connect(bob).contribute(circleId);
      await increaseTime(rotatingConfig().frequency + rotatingConfig().gracePeriod + 1n);

      await expect(circle.connect(alice).markMissed(circleId, bob.address))
        .to.be.revertedWithCustomError(circle, "MemberNotMissed");
    });
  });

  // ─── exitCircle ───────────────────────────────────────────────────────────────

  describe("exitCircle", function () {
    let circleId;

    beforeEach(async function () {
      circleId = await createCircle(alice);
      await circle.connect(bob).joinCircle(circleId);
      await circle.connect(bob).contribute(circleId);
    });

    it("allows a member to exit and receive refund", async function () {
      const bobBefore = await usdm.balanceOf(bob.address);
      await circle.connect(bob).exitCircle(circleId);
      const bobAfter = await usdm.balanceOf(bob.address);

      expect(bobAfter).to.be.gt(bobBefore); // received refund
    });

    it("emits MemberExited", async function () {
      await expect(circle.connect(bob).exitCircle(circleId))
        .to.emit(circle, "MemberExited")
        .withArgs(circleId, bob.address, ONE * 5n);
    });

    it("reverts if member is already exited", async function () {
      await circle.connect(bob).exitCircle(circleId);
      await expect(circle.connect(bob).exitCircle(circleId))
        .to.be.revertedWithCustomError(circle, "NotMember");
    });

    it("reverts if non-member tries to exit", async function () {
      await expect(circle.connect(carol).exitCircle(circleId))
        .to.be.revertedWithCustomError(circle, "NotMember");
    });
  });

  // ─── dissolveCircle ───────────────────────────────────────────────────────────

  describe("dissolveCircle", function () {
    let circleId;

    beforeEach(async function () {
      // 3-member circle: alice, bob, carol — only alice contributes, so auto-distribute won't fire
      const cfg = { ...rotatingConfig(), maxMembers: 5n };
      circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);
      await circle.connect(carol).joinCircle(circleId);
      await usdm.connect(carol).approve(await circle.getAddress(), ONE * 10000n);
      await circle.connect(alice).contribute(circleId); // pot = 5 usdm, waiting for bob & carol
    });

    it("allows creator to dissolve and distributes remaining funds", async function () {
      const aliceBefore = await usdm.balanceOf(alice.address);

      await circle.connect(alice).dissolveCircle(circleId);

      const aliceAfter = await usdm.balanceOf(alice.address);

      // Alice contributed 5 and should receive it back (proportional refund)
      expect(aliceAfter).to.be.gt(aliceBefore);
    });

    it("emits CircleDissolved and marks circle Dissolved", async function () {
      // contribute auto-distributes, so we need a fresh circle that won't auto-distribute
      const cfg = { ...rotatingConfig(), maxMembers: 5n }; // more slots
      circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);
      await circle.connect(carol).joinCircle(circleId); // 3 members, only alice contributes
      await circle.connect(alice).contribute(circleId);

      await expect(circle.connect(alice).dissolveCircle(circleId))
        .to.emit(circle, "CircleDissolved")
        .withArgs(circleId, alice.address);

      const res = await circle.getCircle(circleId);
      expect(res[2]).to.equal(2); // Dissolved status
    });

    it("reverts if non-creator tries to dissolve", async function () {
      const cfg = { ...rotatingConfig(), maxMembers: 5n };
      circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);
      await circle.connect(carol).joinCircle(circleId);
      await circle.connect(alice).contribute(circleId);

      await expect(circle.connect(bob).dissolveCircle(circleId))
        .to.be.revertedWithCustomError(circle, "NotCreator");
    });
  });

  // ─── goal mode ────────────────────────────────────────────────────────────────

  describe("goal mode — distributeGoal", function () {
    it("creator distributes when goal is reached", async function () {
      const cfg = {
        ...goalConfig(),
        goalAmount: ONE * 20n,       // 20 usdm goal
        contributionAmount: ONE * 10n,
      };
      const circleId = await createCircle(alice, cfg);
      await circle.connect(bob).joinCircle(circleId);

      await circle.connect(alice).contribute(circleId);
      await circle.connect(bob).contribute(circleId);

      const aliceBefore = await usdm.balanceOf(alice.address);
      const bobBefore = await usdm.balanceOf(bob.address);

      await circle.connect(alice).distributeGoal(circleId);

      const aliceAfter = await usdm.balanceOf(alice.address);
      const bobAfter = await usdm.balanceOf(bob.address);

      expect(aliceAfter + bobAfter).to.be.gt(aliceBefore + bobBefore);

      const res = await circle.getCircle(circleId);
      expect(res[2]).to.equal(1); // Completed
    });

    it("reverts if non-creator calls distributeGoal", async function () {
      const cfg = { ...goalConfig(), goalAmount: ONE * 10n, contributionAmount: ONE * 10n };
      const circleId = await createCircle(alice, cfg);
      await circle.connect(alice).contribute(circleId);

      await expect(circle.connect(bob).distributeGoal(circleId))
        .to.be.revertedWithCustomError(circle, "NotCreator");
    });
  });
});
