// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SplitGroup is ReentrancyGuard {
    IERC20 public immutable cUSD;
    
    struct Group {
        bytes32 id;
        address creator;
        uint256 createdAt;
        bool exists;
    }
    
    mapping(bytes32 => Group) public groups;
    mapping(bytes32 => mapping(address => bool)) public groupMembers;
    mapping(bytes32 => uint256) public groupMemberCount;
    
    event GroupCreated(bytes32 indexed groupId, address indexed creator, uint256 timestamp);
    event MemberJoined(bytes32 indexed groupId, address indexed member, uint256 timestamp);
    event DebtSettled(bytes32 indexed groupId, address indexed debtor, address indexed creditor, uint256 amount, uint256 timestamp);
    event ExpenseRecorded(bytes32 indexed groupId, bytes32 indexed expenseId, address indexed payer, uint256 totalAmount, uint256 timestamp);
    
    constructor(address _cUSD) { cUSD = IERC20(_cUSD); }
    
    function createGroup(bytes32 groupId) external {
        require(!groups[groupId].exists, "Group exists");
        groups[groupId] = Group(groupId, msg.sender, block.timestamp, true);
        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId] = 1;
        emit GroupCreated(groupId, msg.sender, block.timestamp);
        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }
    
    function joinGroup(bytes32 groupId) external {
        require(groups[groupId].exists, "Group not found");
        require(!groupMembers[groupId][msg.sender], "Already member");
        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId]++;
        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }
    
    function recordExpense(bytes32 groupId, bytes32 expenseId, uint256 totalAmount) external {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");
        emit ExpenseRecorded(groupId, expenseId, msg.sender, totalAmount, block.timestamp);
    }
    
    function settleDebt(bytes32 groupId, address creditor, uint256 amount) external nonReentrant {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");
        require(groupMembers[groupId][creditor], "Creditor not member");
        require(msg.sender != creditor, "Cannot pay yourself");
        require(amount > 0, "Amount must be positive");
        require(cUSD.transferFrom(msg.sender, creditor, amount), "Transfer failed");
        emit DebtSettled(groupId, msg.sender, creditor, amount, block.timestamp);
    }
    
    function isGroupMember(bytes32 groupId, address user) external view returns (bool) {
        return groupMembers[groupId][user];
    }
    
    function getGroup(bytes32 groupId) external view returns (Group memory) {
        return groups[groupId];
    }
}
