import { keccak256, toBytes } from 'viem';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SPLIT_CONTRACT as `0x${string}`;
export const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`;

export const SPLIT_ABI = [
  {
    inputs: [{ name: "_cUSD", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "bytes32" },
      { indexed: true, name: "debtor", type: "address" },
      { indexed: true, name: "creditor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "DebtSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "bytes32" },
      { indexed: true, name: "expenseId", type: "bytes32" },
      { indexed: true, name: "payer", type: "address" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "ExpenseRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "bytes32" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "GroupCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "bytes32" },
      { indexed: true, name: "member", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "MemberJoined",
    type: "event",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "createGroup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "joinGroup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "expenseId", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
    ],
    name: "recordExpense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "creditor", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "settleDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    name: "isGroupMember",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "getGroup",
    outputs: [
      {
        components: [
          { name: "id", type: "bytes32" },
          { name: "creator", type: "address" },
          { name: "createdAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const generateGroupId = (uuid: string): `0x${string}` => {
  return keccak256(toBytes(uuid));
};
