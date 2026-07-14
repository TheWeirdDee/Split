import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SplitGroup, SplitPrediction, MockERC20 } from "../typechain-types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("SplitPrediction Contract", function () {
  let splitGroup: SplitGroup;
  let splitPrediction: SplitPrediction;
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

    // Deploy SplitPrediction
    const SplitPredictionFactory = await ethers.getContractFactory("SplitPrediction");
    splitPrediction = (await SplitPredictionFactory.deploy(
      await mockusdm.getAddress(),
      await splitGroup.getAddress()
    )) as SplitPrediction;
    await splitPrediction.waitForDeployment();

    // Setup initial group: owner is creator, addr1 and addr2 are members. addr3 is NOT a member.
    await splitGroup.connect(owner).createGroup("Weekend Trip", [addr1.address, addr2.address]);

    // Distribute usdm to users and approve SplitPrediction
    const userBalance = ethers.parseEther("100");
    await mockusdm.transfer(owner.address, userBalance);
    await mockusdm.transfer(addr1.address, userBalance);
    await mockusdm.transfer(addr2.address, userBalance);
    await mockusdm.transfer(addr3.address, userBalance);

    await mockusdm.connect(owner).approve(await splitPrediction.getAddress(), ethers.MaxUint256);
    await mockusdm.connect(addr1).approve(await splitPrediction.getAddress(), ethers.MaxUint256);
    await mockusdm.connect(addr2).approve(await splitPrediction.getAddress(), ethers.MaxUint256);
    await mockusdm.connect(addr3).approve(await splitPrediction.getAddress(), ethers.MaxUint256);
  });

  describe("Market Creation", function () {
    it("Should allow a group member to create a prediction market", async function () {
      const question = "Will Tunde be late?";
      const duration = 3600; // 1 hour

      await expect(splitPrediction.connect(owner).createMarket(1, question, duration))
        .to.emit(splitPrediction, "MarketCreated")
        .withArgs(1, 1, question, anyValue, owner.address);

      const market = await splitPrediction.getMarket(1);
      expect(market.question).to.equal(question);
      expect(market.groupId).to.equal(1n);
      expect(market.creator).to.equal(owner.address);
      expect(market.resolved).to.be.false;
      expect(market.outcome).to.equal(0); // Unresolved
    });

    it("Should reject market creation by a non-group member", async function () {
      await expect(
        splitPrediction.connect(addr3).createMarket(1, "Question?", 3600)
      ).to.be.revertedWithCustomError(splitPrediction, "NotGroupMember");
    });
  });

  describe("Bet Placement", function () {
    beforeEach(async function () {
      await splitPrediction.connect(owner).createMarket(1, "Will it rain?", 3600);
    });

    it("Should allow a group member to place a YES or NO bet", async function () {
      const betAmount = ethers.parseEther("10");

      await expect(splitPrediction.connect(owner).placeBet(1, true, betAmount))
        .to.emit(splitPrediction, "BetPlaced")
        .withArgs(1, owner.address, true, betAmount);

      await expect(splitPrediction.connect(addr1).placeBet(1, false, betAmount))
        .to.emit(splitPrediction, "BetPlaced")
        .withArgs(1, addr1.address, false, betAmount);

      const market = await splitPrediction.getMarket(1);
      expect(market.totalYesPool).to.equal(betAmount);
      expect(market.totalNoPool).to.equal(betAmount);

      const userBetOwner = await splitPrediction.getUserBet(1, owner.address);
      expect(userBetOwner.yesBet).to.equal(betAmount);
      expect(userBetOwner.noBet).to.equal(0n);

      const userBetAddr1 = await splitPrediction.getUserBet(1, addr1.address);
      expect(userBetAddr1.yesBet).to.equal(0n);
      expect(userBetAddr1.noBet).to.equal(betAmount);
    });

    it("Should prevent placing bets after the market deadline", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        splitPrediction.connect(owner).placeBet(1, true, ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(splitPrediction, "MarketClosed");
    });

    it("Should reject bets from non-group members", async function () {
      await expect(
        splitPrediction.connect(addr3).placeBet(1, true, ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(splitPrediction, "NotGroupMember");
    });
  });

  describe("Market Resolution & Winnings Claim", function () {
    beforeEach(async function () {
      await splitPrediction.connect(owner).createMarket(1, "Weather outcome?", 3600);
      await splitPrediction.connect(owner).placeBet(1, true, ethers.parseEther("20")); // YES: 20
      await splitPrediction.connect(addr1).placeBet(1, false, ethers.parseEther("10")); // NO: 10
      await splitPrediction.connect(addr2).placeBet(1, false, ethers.parseEther("10")); // NO: 10
      // Total pool = 40. YES pool = 20, NO pool = 20.
    });

    it("Should only allow the creator to resolve the market", async function () {
      await expect(
        splitPrediction.connect(addr1).resolveMarket(1, 1) // Outcome: Yes
      ).to.be.revertedWithCustomError(splitPrediction, "NotCreator");
    });

    it("Should resolve market correctly and distribute winnings proportionally", async function () {
      // Resolve as YES (outcome = 1)
      await expect(splitPrediction.connect(owner).resolveMarket(1, 1))
        .to.emit(splitPrediction, "MarketResolved")
        .withArgs(1, 1);

      // Creator (owner) placed 20 YES bet. Total YES is 20, total pool is 40. Payout should be 40.
      const initialBalance = await mockusdm.balanceOf(owner.address);
      await expect(splitPrediction.connect(owner).claimWinnings(1))
        .to.emit(splitPrediction, "WinningsClaimed")
        .withArgs(1, owner.address, ethers.parseEther("40"));

      const finalBalance = await mockusdm.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("40"));
    });

    it("Should resolve as NO and distribute winnings to NO bettors", async function () {
      // Resolve as NO (outcome = 2)
      await splitPrediction.connect(owner).resolveMarket(1, 2);

      // addr1 placed 10 NO. Total NO is 20. Total pool is 40. Payout = 10 * 40 / 20 = 20.
      const initialBalance = await mockusdm.balanceOf(addr1.address);
      await splitPrediction.connect(addr1).claimWinnings(1);
      const finalBalance = await mockusdm.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("20"));
    });

    it("Should refund stakes on market cancellation", async function () {
      // Resolve as Cancelled (outcome = 3)
      await splitPrediction.connect(owner).resolveMarket(1, 3);

      // Owner placed 20, should receive exactly 20 back
      const initialBalance = await mockusdm.balanceOf(owner.address);
      await splitPrediction.connect(owner).claimWinnings(1);
      const finalBalance = await mockusdm.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("20"));
    });

    it("Should prevent double claiming", async function () {
      await splitPrediction.connect(owner).resolveMarket(1, 1);

      await splitPrediction.connect(owner).claimWinnings(1);

      await expect(
        splitPrediction.connect(owner).claimWinnings(1)
      ).to.be.revertedWithCustomError(splitPrediction, "AlreadyClaimed");
    });
  });
});
