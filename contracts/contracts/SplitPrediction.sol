// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISplitGroup {
    function isMember(uint256 groupId, address member) external view returns (bool);
}

/**
 * @title SplitPrediction
 * @notice On-chain social prediction markets for friend groups on Celo.
 *         Allows group members to place bets in USDM on yes/no questions,
 *         resolve them, and claim payout shares.
 */
contract SplitPrediction is ReentrancyGuard {
    IERC20 public immutable usdm;
    ISplitGroup public immutable splitGroup;

    enum PredictionOutcome { Unresolved, Yes, No, Cancelled }

    struct Market {
        uint256 id;
        uint256 groupId;
        string question;
        uint256 endTime;
        address creator;
        PredictionOutcome outcome;
        uint256 totalYesPool;
        uint256 totalNoPool;
        bool resolved;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets; // marketId => user => amount
    mapping(uint256 => mapping(address => uint256)) public noBets;  // marketId => user => amount
    mapping(uint256 => mapping(address => bool)) public claimed;    // marketId => user => claimed

    event MarketCreated(uint256 indexed id, uint256 indexed groupId, string question, uint256 endTime, address indexed creator);
    event BetPlaced(uint256 indexed id, address indexed user, bool isYes, uint256 amount);
    event MarketResolved(uint256 indexed id, PredictionOutcome outcome);
    event WinningsClaimed(uint256 indexed id, address indexed user, uint256 amount);

    error NotGroupMember();
    error MarketClosed();
    error AlreadyResolved();
    error AlreadyBet();
    error NotCreator();
    error InvalidOutcome();
    error MarketNotResolved();
    error NoWinningBet();
    error AlreadyClaimed();
    error ZeroPayout();
    error TransferFailed();

    constructor(address _usdm, address _splitGroup) {
        usdm = IERC20(_usdm);
        splitGroup = ISplitGroup(_splitGroup);
    }

    modifier onlyGroupMember(uint256 groupId) {
        if (!splitGroup.isMember(groupId, msg.sender)) revert NotGroupMember();
        _;
    }

    /**
     * @notice Create a new prediction market for a group.
     */
    function createMarket(
        uint256 groupId,
        string calldata question,
        uint256 duration
    ) external onlyGroupMember(groupId) returns (uint256) {
        uint256 marketId = ++marketCount;
        markets[marketId] = Market({
            id: marketId,
            groupId: groupId,
            question: question,
            endTime: block.timestamp + duration,
            creator: msg.sender,
            outcome: PredictionOutcome.Unresolved,
            totalYesPool: 0,
            totalNoPool: 0,
            resolved: false
        });
        emit MarketCreated(marketId, groupId, question, block.timestamp + duration, msg.sender);
        return marketId;
    }

    /**
     * @notice Place a bet on a prediction market. Must be a group member.
     */
    function placeBet(uint256 marketId, bool isYes, uint256 amount) external nonReentrant {
        Market storage m = markets[marketId];
        if (block.timestamp >= m.endTime) revert MarketClosed();
        if (m.resolved) revert AlreadyResolved();
        if (!splitGroup.isMember(m.groupId, msg.sender)) revert NotGroupMember();
        if (yesBets[marketId][msg.sender] != 0 || noBets[marketId][msg.sender] != 0) revert AlreadyBet();
        
        if (!usdm.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        if (isYes) {
            yesBets[marketId][msg.sender] += amount;
            m.totalYesPool += amount;
        } else {
            noBets[marketId][msg.sender] += amount;
            m.totalNoPool += amount;
        }
        emit BetPlaced(marketId, msg.sender, isYes, amount);
    }

    /**
     * @notice Resolve a prediction market. Only the market creator can resolve.
     */
    function resolveMarket(uint256 marketId, uint8 outcomeVal) external {
        Market storage m = markets[marketId];
        if (msg.sender != m.creator) revert NotCreator();
        if (m.resolved) revert AlreadyResolved();
        
        PredictionOutcome outcome = PredictionOutcome(outcomeVal);
        if (outcome == PredictionOutcome.Unresolved) revert InvalidOutcome();

        m.outcome = outcome;
        m.resolved = true;
        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Claim payout share for a winning bet or refund for cancelled markets.
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        if (!m.resolved) revert MarketNotResolved();
        if (claimed[marketId][msg.sender]) revert AlreadyClaimed();

        uint256 payout = 0;
        if (m.outcome == PredictionOutcome.Yes) {
            uint256 userBet = yesBets[marketId][msg.sender];
            if (userBet == 0) revert NoWinningBet();
            claimed[marketId][msg.sender] = true;
            payout = (userBet * (m.totalYesPool + m.totalNoPool)) / m.totalYesPool;
        } else if (m.outcome == PredictionOutcome.No) {
            uint256 userBet = noBets[marketId][msg.sender];
            if (userBet == 0) revert NoWinningBet();
            claimed[marketId][msg.sender] = true;
            payout = (userBet * (m.totalYesPool + m.totalNoPool)) / m.totalNoPool;
        } else if (m.outcome == PredictionOutcome.Cancelled) {
            uint256 userBet = yesBets[marketId][msg.sender] + noBets[marketId][msg.sender];
            if (userBet == 0) revert NoWinningBet();
            claimed[marketId][msg.sender] = true;
            payout = userBet;
        }

        if (payout == 0) revert ZeroPayout();
        if (!usdm.transfer(msg.sender, payout)) revert TransferFailed();
        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    // Helper functions for easy reading by frontend
    function getMarket(uint256 marketId) external view returns (
        uint256 id,
        uint256 groupId,
        string memory question,
        uint256 endTime,
        address creator,
        uint8 outcome,
        uint256 totalYesPool,
        uint256 totalNoPool,
        bool resolved
    ) {
        Market storage m = markets[marketId];
        return (m.id, m.groupId, m.question, m.endTime, m.creator, uint8(m.outcome), m.totalYesPool, m.totalNoPool, m.resolved);
    }

    function getUserBet(uint256 marketId, address user) external view returns (uint256 yesBet, uint256 noBet, bool hasClaimed) {
        return (yesBets[marketId][user], noBets[marketId][user], claimed[marketId][user]);
    }
}
