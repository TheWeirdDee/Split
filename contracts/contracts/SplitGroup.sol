// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SplitGroup
 * @notice Onchain expense splitting and debt settlement for friend groups on Celo.
 *         All financial data — expenses, splits, balances — stored onchain.
 *         Supabase handles display names, notifications, and chat only.
 *
 * Deployment: Celo Mainnet
 * usdm address: 0x765DE816845861e75A25fCA122bb6898B8B1282a
 */
contract SplitGroup is ReentrancyGuard {

    IERC20 public immutable usdm;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Split {
        address member;
        uint256 amount; // how much this member owes for this expense
    }

    struct Expense {
        uint256 id;
        address paidBy;
        uint256 amount;
        string description;
        uint256 timestamp;
        Split[] splits;
    }

    struct Group {
        uint256 id;
        string name;
        address creator;
        address[] members;
        uint256 expenseCount;
        bool exists;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public groupCount;
    uint256 public expenseCount;

    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(uint256 => Expense)) public expenses; // groupId => expenseId => Expense
    mapping(uint256 => mapping(address => bool)) public isMember;

    // Net balance per member per group (positive = owed to them, negative = they owe)
    // Stored as int256, positive means others owe you, negative means you owe others
    mapping(uint256 => mapping(address => int256)) public balances;

    // ─── Events ───────────────────────────────────────────────────────────────

    event GroupCreated(uint256 indexed groupId, address indexed creator, string name);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event ExpenseAdded(uint256 indexed groupId, uint256 indexed expenseId, address indexed paidBy, uint256 amount, string description);
    event DebtSettled(uint256 indexed groupId, address indexed from, address indexed to, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error GroupNotFound(uint256 groupId);
    error NotMember(uint256 groupId, address caller);
    error InvalidSplits();
    error TransferFailed();
    error AlreadyMember(address member);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _usdm) {
        usdm = IERC20(_usdm);
    }

    // ─── Group Management ─────────────────────────────────────────────────────

    /**
     * @notice Create a new expense group. Creator pays only gas — no dust transfers.
     * @param name Group display name
     * @param members Initial member addresses (can add more via addMember)
     */
    function createGroup(string calldata name, address[] calldata members) external returns (uint256) {
        uint256 groupId = ++groupCount;

        Group storage group = groups[groupId];
        group.id = groupId;
        group.name = name;
        group.creator = msg.sender;
        group.exists = true;

        // Add creator as first member
        group.members.push(msg.sender);
        isMember[groupId][msg.sender] = true;
        emit MemberAdded(groupId, msg.sender);

        // Add initial members
        for (uint256 i = 0; i < members.length; i++) {
            if (!isMember[groupId][members[i]]) {
                group.members.push(members[i]);
                isMember[groupId][members[i]] = true;
                emit MemberAdded(groupId, members[i]);
            }
        }

        emit GroupCreated(groupId, msg.sender, name);
        return groupId;
    }

    /**
     * @notice Join a group via invite (anyone with groupId can join).
     */
    function joinGroup(uint256 groupId) external {
        if (!groups[groupId].exists) revert GroupNotFound(groupId);
        if (isMember[groupId][msg.sender]) revert AlreadyMember(msg.sender);

        groups[groupId].members.push(msg.sender);
        isMember[groupId][msg.sender] = true;
        emit MemberAdded(groupId, msg.sender);
    }

    // ─── Expenses ─────────────────────────────────────────────────────────────

    /**
     * @notice Record an expense onchain. Updates balances immediately.
     * @param groupId The group this expense belongs to
     * @param amount Total amount spent (in usdm wei)
     * @param description What was spent on
     * @param splitMembers Array of member addresses for the split
     * @param splitAmounts Array of amounts each member owes (must sum to amount)
     */
    function addExpense(
        uint256 groupId,
        uint256 amount,
        string calldata description,
        address[] calldata splitMembers,
        uint256[] calldata splitAmounts
    ) external {
        if (!groups[groupId].exists) revert GroupNotFound(groupId);
        if (!isMember[groupId][msg.sender]) revert NotMember(groupId, msg.sender);
        if (splitMembers.length != splitAmounts.length) revert InvalidSplits();

        // Validate splits sum to total
        uint256 total = 0;
        for (uint256 i = 0; i < splitAmounts.length; i++) {
            total += splitAmounts[i];
        }
        if (total != amount) revert InvalidSplits();

        uint256 expenseId = ++expenseCount;
        uint256 localExpenseId = ++groups[groupId].expenseCount;

        Expense storage expense = expenses[groupId][localExpenseId];
        expense.id = expenseId;
        expense.paidBy = msg.sender;
        expense.amount = amount;
        expense.description = description;
        expense.timestamp = block.timestamp;

        // Record splits and update balances
        for (uint256 i = 0; i < splitMembers.length; i++) {
            expense.splits.push(Split({
                member: splitMembers[i],
                amount: splitAmounts[i]
            }));

            // payer's balance goes up (others owe them)
            balances[groupId][msg.sender] += int256(splitAmounts[i]);
            // each member's balance goes down (they owe payer)
            balances[groupId][splitMembers[i]] -= int256(splitAmounts[i]);
        }

        emit ExpenseAdded(groupId, localExpenseId, msg.sender, amount, description);
    }

    // ─── Settlement ───────────────────────────────────────────────────────────

    /**
     * @notice Settle a debt. Transfers usdm directly from caller to recipient.
     *         Updates onchain balances.
     * @param groupId The group
     * @param to The member being paid
     * @param amount Amount to settle in usdm wei
     */
    function settleDebt(uint256 groupId, address to, uint256 amount) external nonReentrant {
        if (!groups[groupId].exists) revert GroupNotFound(groupId);
        if (!isMember[groupId][msg.sender]) revert NotMember(groupId, msg.sender);

        bool ok = usdm.transferFrom(msg.sender, to, amount);
        if (!ok) revert TransferFailed();

        // Update balances
        balances[groupId][msg.sender] += int256(amount);
        balances[groupId][to] -= int256(amount);

        emit DebtSettled(groupId, msg.sender, to, amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getGroup(uint256 groupId) external view returns (
        string memory name,
        address creator,
        address[] memory members,
        uint256 expCount
    ) {
        Group storage g = groups[groupId];
        if (!g.exists) revert GroupNotFound(groupId);
        return (g.name, g.creator, g.members, g.expenseCount);
    }

    function getMemberBalance(uint256 groupId, address member) external view returns (int256) {
        return balances[groupId][member];
    }

    function getExpense(uint256 groupId, uint256 expenseId) external view returns (
        address paidBy,
        uint256 amount,
        string memory description,
        uint256 timestamp
    ) {
        Expense storage e = expenses[groupId][expenseId];
        return (e.paidBy, e.amount, e.description, e.timestamp);
    }

    function getExpenseSplits(uint256 groupId, uint256 expenseId) external view returns (
        address[] memory members,
        uint256[] memory amounts
    ) {
        Expense storage e = expenses[groupId][expenseId];
        uint256 len = e.splits.length;
        members = new address[](len);
        amounts = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            members[i] = e.splits[i].member;
            amounts[i] = e.splits[i].amount;
        }
    }

    function getGroupExpenseCount(uint256 groupId) external view returns (uint256) {
        return groups[groupId].expenseCount;
    }
}
