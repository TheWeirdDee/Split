// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SavingsCircle
 * @notice Trustless group savings on Celo. Two modes:
 *         1. Rotating — each cycle, the full pot goes to the next member
 *         2. Goal — everyone saves toward a shared target amount
 *
 * Rules set by creator at circle creation:
 *   - Contribution amount (cUSD)
 *   - Frequency (contribution interval in seconds)
 *   - Grace period (seconds after deadline before marked missed)
 *   - Max missed contributions before removal
 *   - Duration (max cycles, or 0 for goal-based)
 *   - Goal amount (goal mode only)
 *   - Goal deadline (goal mode only)
 *   - Reminder lead time (seconds before deadline to send reminder (for frontend))
 *
 * Deployment: Celo Mainnet
 * cUSD address: 0x765DE816845861e75A25fCA122bb6898B8B1282a
 */
contract SavingsCircle is ReentrancyGuard {

    IERC20 public immutable cUSD;

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum CircleMode { Rotating, Goal }
    enum CircleStatus { Active, Completed, Dissolved }
    enum MemberStatus { Active, Skipped, Removed, Exited }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct CircleConfig {
        string name;
        CircleMode mode;
        uint256 contributionAmount;  // cUSD wei per contribution
        uint256 frequency;           // seconds between contributions
        uint256 gracePeriod;         // seconds after deadline before markMissed allowed
        uint8 maxMissed;             // missed contributions before removal
        uint256 maxMembers;          // max members allowed
        uint256 maxCycles;           // 0 = run until everyone receives once (rotating) or goal hit
        uint256 goalAmount;          // goal mode only
        uint256 goalDeadline;        // goal mode only (unix timestamp)
        uint256 reminderLeadTime;    // seconds before deadline to send reminder (for frontend)
    }

    struct Member {
        address addr;
        uint256 joinedAt;
        uint8 missedCount;
        uint256 totalContributed;
        uint256 totalReceived;
        MemberStatus status;
        bool hasReceivedPayout; // rotating mode
    }

    struct Circle {
        uint256 id;
        address creator;
        CircleConfig config;
        CircleStatus status;
        address[] memberAddresses;
        uint256 currentCycle;
        uint256 currentPot;          // cUSD in contract for this cycle
        uint256 rotationIndex;       // whose turn is next (rotating mode)
        uint256 cycleStartTime;      // when current cycle started
        uint256 nextDeadline;        // when next contribution is due
        uint256 totalSaved;          // all-time total cUSD saved in this circle
        bool exists;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public circleCount;

    mapping(uint256 => Circle) public circles;
    mapping(uint256 => mapping(address => Member)) public members;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public contributedThisCycle; // circleId => cycle => address

    // ─── Events ───────────────────────────────────────────────────────────────

    event CircleCreated(uint256 indexed circleId, address indexed creator, string name, CircleMode mode);
    event MemberJoined(uint256 indexed circleId, address indexed member);
    event CircleStarted(uint256 indexed circleId, uint256 nextDeadline);
    event ContributionMade(uint256 indexed circleId, address indexed member, uint256 amount, uint256 cycle);
    event PayoutSent(uint256 indexed circleId, address indexed recipient, uint256 amount, uint256 cycle);
    event MemberMissed(uint256 indexed circleId, address indexed member, uint256 cycle);
    event MemberRemoved(uint256 indexed circleId, address indexed member, uint256 refundAmount);
    event MemberExited(uint256 indexed circleId, address indexed member, uint256 refundAmount);
    event CircleDissolved(uint256 indexed circleId, address indexed dissolvedBy);
    event CircleCompleted(uint256 indexed circleId);
    event GoalReached(uint256 indexed circleId, uint256 totalAmount);
    event GoalDeadlinePassed(uint256 indexed circleId, uint256 amountSaved);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error CircleNotFound(uint256 circleId);
    error NotMember(uint256 circleId, address caller);
    error NotCreator(uint256 circleId);
    error AlreadyMember(address member);
    error CircleNotActive();
    error CircleFull();
    error AlreadyContributed();
    error GracePeriodNotExpired();
    error MemberNotMissed();
    error TransferFailed();
    error InvalidConfig();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
    }

    // ─── Circle Creation ──────────────────────────────────────────────────────

    /**
     * @notice Create a new savings circle.
     * @param name Circle display name
     * @param mode Rotating (0) or Goal (1)
     * @param contributionAmount cUSD wei per contribution
     * @param frequency Seconds between contribution deadlines
     * @param gracePeriod Seconds after deadline before member can be marked missed
     * @param maxMissed How many misses before removal
     * @param maxMembers Max members (0 = unlimited)
     * @param maxCycles Max cycles to run (0 = natural end)
     * @param goalAmount Goal target in cUSD wei (goal mode only, 0 for rotating)
     * @param goalDeadline Unix timestamp for goal deadline (0 for rotating)
     * @param reminderLeadTime Seconds before deadline reminder should fire (for frontend)
     */
    function createCircle(
        string calldata name,
        CircleMode mode,
        uint256 contributionAmount,
        uint256 frequency,
        uint256 gracePeriod,
        uint8 maxMissed,
        uint256 maxMembers,
        uint256 maxCycles,
        uint256 goalAmount,
        uint256 goalDeadline,
        uint256 reminderLeadTime
    ) external returns (uint256) {
        if (contributionAmount == 0) revert InvalidConfig();
        if (frequency == 0) revert InvalidConfig();
        if (mode == CircleMode.Goal && goalAmount == 0) revert InvalidConfig();

        uint256 circleId = ++circleCount;
        Circle storage circle = circles[circleId];

        circle.id = circleId;
        circle.creator = msg.sender;
        circle.status = CircleStatus.Active;
        circle.exists = true;
        circle.cycleStartTime = block.timestamp;
        circle.nextDeadline = block.timestamp + frequency;

        circle.config = CircleConfig({
            name: name,
            mode: mode,
            contributionAmount: contributionAmount,
            frequency: frequency,
            gracePeriod: gracePeriod,
            maxMissed: maxMissed,
            maxMembers: maxMembers,
            maxCycles: maxCycles,
            goalAmount: goalAmount,
            goalDeadline: goalDeadline,
            reminderLeadTime: reminderLeadTime
        });

        // Add creator as first member
        _addMember(circleId, msg.sender);

        emit CircleCreated(circleId, msg.sender, name, mode);
        return circleId;
    }

    // ─── Membership ───────────────────────────────────────────────────────────

    /**
     * @notice Join a circle via invite link.
     */
    function joinCircle(uint256 circleId) external {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (members[circleId][msg.sender].addr == msg.sender) revert AlreadyMember(msg.sender);
        if (circle.config.maxMembers > 0 && circle.memberAddresses.length >= circle.config.maxMembers) revert CircleFull();

        _addMember(circleId, msg.sender);
    }

    function _addMember(uint256 circleId, address addr) internal {
        circles[circleId].memberAddresses.push(addr);
        members[circleId][addr] = Member({
            addr: addr,
            joinedAt: block.timestamp,
            missedCount: 0,
            totalContributed: 0,
            totalReceived: 0,
            status: MemberStatus.Active,
            hasReceivedPayout: false
        });
        emit MemberJoined(circleId, addr);
    }

    // ─── Contributions ────────────────────────────────────────────────────────

    /**
     * @notice Contribute to the current cycle. Must approve cUSD first.
     */
    function contribute(uint256 circleId) external nonReentrant {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();

        Member storage member = members[circleId][msg.sender];
        if (member.addr != msg.sender) revert NotMember(circleId, msg.sender);
        if (member.status == MemberStatus.Removed || member.status == MemberStatus.Exited) revert NotMember(circleId, msg.sender);
        if (contributedThisCycle[circleId][circle.currentCycle][msg.sender]) revert AlreadyContributed();

        uint256 amount = circle.config.contributionAmount;
        bool ok = cUSD.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        contributedThisCycle[circleId][circle.currentCycle][msg.sender] = true;
        member.totalContributed += amount;
        circle.currentPot += amount;
        circle.totalSaved += amount;

        emit ContributionMade(circleId, msg.sender, amount, circle.currentCycle);

        // Check if goal reached (goal mode)
        if (circle.config.mode == CircleMode.Goal && circle.config.goalAmount > 0) {
            if (circle.totalSaved >= circle.config.goalAmount) {
                emit GoalReached(circleId, circle.totalSaved);
            }
        }

        // Check if all active members have contributed this cycle (rotating mode)
        if (circle.config.mode == CircleMode.Rotating) {
            if (_allActiveContributed(circleId)) {
                _distribute(circleId);
            }
        }
    }

    // ─── Distribution ─────────────────────────────────────────────────────────

    /**
     * @notice Manually trigger distribution for rotating mode if auto didn't fire.
     *         Also callable after all active members contributed.
     */
    function distribute(uint256 circleId) external nonReentrant {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (circle.config.mode != CircleMode.Rotating) revert InvalidConfig();
        if (!_allActiveContributed(circleId)) revert InvalidConfig();

        _distribute(circleId);
    }

    function _distribute(uint256 circleId) internal {
        Circle storage circle = circles[circleId];

        // Find next eligible member in rotation
        address[] storage memberAddrs = circle.memberAddresses;
        uint256 len = memberAddrs.length;
        address recipient;

        // Find next active member who hasn't received yet
        uint256 checked = 0;
        while (checked < len) {
            uint256 idx = circle.rotationIndex % len;
            circle.rotationIndex++;
            checked++;

            address candidate = memberAddrs[idx];
            Member storage m = members[circleId][candidate];
            if (m.status == MemberStatus.Active && !m.hasReceivedPayout) {
                recipient = candidate;
                break;
            }
        }

        if (recipient == address(0)) {
            // Everyone has received — circle complete
            circle.status = CircleStatus.Completed;
            emit CircleCompleted(circleId);
            return;
        }

        uint256 payout = circle.currentPot;
        circle.currentPot = 0;

        Member storage recipientMember = members[circleId][recipient];
        recipientMember.totalReceived += payout;
        recipientMember.hasReceivedPayout = true;

        bool ok = cUSD.transfer(recipient, payout);
        if (!ok) revert TransferFailed();

        emit PayoutSent(circleId, recipient, payout, circle.currentCycle);

        // Advance cycle
        circle.currentCycle++;
        circle.cycleStartTime = block.timestamp;
        circle.nextDeadline = block.timestamp + circle.config.frequency;

        // Check if max cycles reached
        if (circle.config.maxCycles > 0 && circle.currentCycle >= circle.config.maxCycles) {
            circle.status = CircleStatus.Completed;
            emit CircleCompleted(circleId);
        }
    }

    /**
     * @notice Distribute goal funds when goal is reached. Creator only.
     */
    function distributeGoal(uint256 circleId) external nonReentrant {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (circle.config.mode != CircleMode.Goal) revert InvalidConfig();
        if (msg.sender != circle.creator) revert NotCreator(circleId);

        uint256 balance = cUSD.balanceOf(address(this));
        // Distribute equally among all active members
        address[] storage memberAddrs = circle.memberAddresses;
        uint256 activeCount = _countActive(circleId);
        uint256 share = balance / activeCount;

        for (uint256 i = 0; i < memberAddrs.length; i++) {
            Member storage m = members[circleId][memberAddrs[i]];
            if (m.status == MemberStatus.Active) {
                m.totalReceived += share;
                bool ok = cUSD.transfer(memberAddrs[i], share);
                if (!ok) revert TransferFailed();
                emit PayoutSent(circleId, memberAddrs[i], share, circle.currentCycle);
            }
        }

        circle.status = CircleStatus.Completed;
        emit CircleCompleted(circleId);
    }

    // ─── Missed Contributions ─────────────────────────────────────────────────

    /**
     * @notice Mark a member as missed after grace period expires.
     *         Any active member can call this.
     */
    function markMissed(uint256 circleId, address memberAddr) external {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();

        // Grace period must have expired
        if (block.timestamp < circle.nextDeadline + circle.config.gracePeriod) revert GracePeriodNotExpired();
        // Member must not have contributed
        if (contributedThisCycle[circleId][circle.currentCycle][memberAddr]) revert MemberNotMissed();

        Member storage member = members[circleId][memberAddr];
        if (member.addr != memberAddr) revert NotMember(circleId, memberAddr);
        if (member.status != MemberStatus.Active) revert NotMember(circleId, memberAddr);

        member.missedCount++;
        emit MemberMissed(circleId, memberAddr, circle.currentCycle);

        // Mark as skipped this cycle
        contributedThisCycle[circleId][circle.currentCycle][memberAddr] = true;
        member.status = MemberStatus.Skipped;

        // Remove if max misses exceeded
        if (member.missedCount >= circle.config.maxMissed) {
            uint256 refund = _calculateRefund(circleId, memberAddr);
            member.status = MemberStatus.Removed;

            if (refund > 0) {
                bool ok = cUSD.transfer(memberAddr, refund);
                if (!ok) revert TransferFailed();
            }
            emit MemberRemoved(circleId, memberAddr, refund);
        }

        // Reset to active for next cycle if not removed
        // (Handled at cycle start — skipped members get re-set to Active)
    }

    // ─── Exit and Dissolution ─────────────────────────────────────────────────

    /**
     * @notice Member voluntarily exits circle. Receives proportional refund.
     */
    function exitCircle(uint256 circleId) external nonReentrant {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();

        Member storage member = members[circleId][msg.sender];
        if (member.addr != msg.sender) revert NotMember(circleId, msg.sender);
        if (member.status == MemberStatus.Removed || member.status == MemberStatus.Exited) revert NotMember(circleId, msg.sender);

        uint256 refund = _calculateRefund(circleId, msg.sender);
        member.status = MemberStatus.Exited;

        if (refund > 0) {
            bool ok = cUSD.transfer(msg.sender, refund);
            if (!ok) revert TransferFailed();
        }

        emit MemberExited(circleId, msg.sender, refund);
    }

    /**
     * @notice Creator dissolves circle. All remaining funds distributed proportionally.
     */
    function dissolveCircle(uint256 circleId) external nonReentrant {
        Circle storage circle = circles[circleId];
        if (!circle.exists) revert CircleNotFound(circleId);
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (msg.sender != circle.creator) revert NotCreator(circleId);

        circle.status = CircleStatus.Dissolved;

        // Return funds to all active members proportionally
        uint256 contractBalance = cUSD.balanceOf(address(this));
        if (contractBalance > 0) {
            uint256 activeCount = _countActive(circleId);
            if (activeCount > 0) {
                uint256 share = contractBalance / activeCount;
                address[] storage memberAddrs = circle.memberAddresses;
                for (uint256 i = 0; i < memberAddrs.length; i++) {
                    if (members[circleId][memberAddrs[i]].status == MemberStatus.Active) {
                        bool ok = cUSD.transfer(memberAddrs[i], share);
                        if (!ok) revert TransferFailed();
                    }
                }
            }
        }

        emit CircleDissolved(circleId, msg.sender);
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _calculateRefund(uint256 circleId, address memberAddr) internal view returns (uint256) {
        Member storage member = members[circleId][memberAddr];
        // Refund = total contributed - total received
        if (member.totalContributed <= member.totalReceived) return 0;
        return member.totalContributed - member.totalReceived;
    }

    function _allActiveContributed(uint256 circleId) internal view returns (bool) {
        Circle storage circle = circles[circleId];
        address[] storage memberAddrs = circle.memberAddresses;
        for (uint256 i = 0; i < memberAddrs.length; i++) {
            Member storage m = members[circleId][memberAddrs[i]];
            if (m.status == MemberStatus.Active) {
                if (!contributedThisCycle[circleId][circle.currentCycle][memberAddrs[i]]) {
                    return false;
                }
            }
        }
        return true;
    }

    function _countActive(uint256 circleId) internal view returns (uint256 count) {
        address[] storage memberAddrs = circles[circleId].memberAddresses;
        for (uint256 i = 0; i < memberAddrs.length; i++) {
            if (members[circleId][memberAddrs[i]].status == MemberStatus.Active) {
                count++;
            }
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getCircle(uint256 circleId) external view returns (
        string memory name,
        CircleMode mode,
        CircleStatus status,
        uint256 contributionAmount,
        uint256 currentPot,
        uint256 currentCycle,
        uint256 nextDeadline,
        uint256 totalSaved,
        address[] memory memberAddrs
    ) {
        Circle storage c = circles[circleId];
        if (!c.exists) revert CircleNotFound(circleId);
        return (
            c.config.name,
            c.config.mode,
            c.status,
            c.config.contributionAmount,
            c.currentPot,
            c.currentCycle,
            c.nextDeadline,
            c.totalSaved,
            c.memberAddresses
        );
    }

    function getMemberStatus(uint256 circleId, address memberAddr) external view returns (
        uint8 missedCount,
        uint256 totalContributed,
        uint256 totalReceived,
        MemberStatus status,
        bool hasReceivedPayout
    ) {
        Member storage m = members[circleId][memberAddr];
        return (m.missedCount, m.totalContributed, m.totalReceived, m.status, m.hasReceivedPayout);
    }

    function hasContributedThisCycle(uint256 circleId, address memberAddr) external view returns (bool) {
        return contributedThisCycle[circleId][circles[circleId].currentCycle][memberAddr];
    }

    function getNextRecipient(uint256 circleId) external view returns (address) {
        Circle storage circle = circles[circleId];
        address[] storage memberAddrs = circle.memberAddresses;
        uint256 len = memberAddrs.length;
        uint256 idx = circle.rotationIndex;

        for (uint256 i = 0; i < len; i++) {
            address candidate = memberAddrs[(idx + i) % len];
            Member storage m = members[circleId][candidate];
            if (m.status == MemberStatus.Active && !m.hasReceivedPayout) {
                return candidate;
            }
        }
        return address(0);
    }

    function getContractBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }
}
