// Central registry of on-chain addresses and ABIs used by the app:
//   - SPLIT_ABI            → the expense-splitting (groups) contract
//   - SAVINGS_CIRCLE_ABI   → the rotating/goal savings-circle contract
//   - usdm_ADDRESS         → Celo's usdm stablecoin (Mainnet)
// Addresses come from NEXT_PUBLIC_* env so deployments can be swapped per env.
import { keccak256, toBytes } from 'viem';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SPLIT_CONTRACT as `0x${string}`;
export const SAVINGS_CIRCLE_ADDRESS = process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_ADDRESS as `0x${string}`;
export const usdm_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`;

export const SPLIT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_usdm",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "member",
        type: "address",
      },
    ],
    name: "AlreadyMember",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
    ],
    name: "GroupNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSplits",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "NotMember",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "DebtSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "paidBy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    name: "ExpenseAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "GroupCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "member",
        type: "address",
      },
    ],
    name: "MemberAdded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "address[]",
        name: "splitMembers",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "splitAmounts",
        type: "uint256[]",
      },
    ],
    name: "addExpense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balances",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdm",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address[]",
        name: "members",
        type: "address[]",
      },
    ],
    name: "createGroup",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "expenseCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "expenses",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "paidBy",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
    ],
    name: "getExpense",
    outputs: [
      {
        internalType: "address",
        name: "paidBy",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
    ],
    name: "getExpenseSplits",
    outputs: [
      {
        internalType: "address[]",
        name: "members",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
    ],
    name: "getGroup",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "members",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "expCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
    ],
    name: "getGroupExpenseCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "member",
        type: "address",
      },
    ],
    name: "getMemberBalance",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "groupCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "groups",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "expenseCount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isMember",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
    ],
    name: "joinGroup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "groupId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "settleDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const generateGroupId = (uuid: string): `0x${string}` => {
  return keccak256(toBytes(uuid));
};

export const SAVINGS_CIRCLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdm",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyContributed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "AlreadyMember",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CircleFull",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CircleNotActive",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "CircleNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GracePeriodNotExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidConfig",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MemberNotMissed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "NotCreator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "NotMember",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "CircleCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum SavingsCircle.CircleMode",
        "name": "mode",
        "type": "uint8"
      }
    ],
    "name": "CircleCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "dissolvedBy",
        "type": "address"
      }
    ],
    "name": "CircleDissolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nextDeadline",
        "type": "uint256"
      }
    ],
    "name": "CircleStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
      }
    ],
    "name": "ContributionMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountSaved",
        "type": "uint256"
      }
    ],
    "name": "GoalDeadlinePassed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      }
    ],
    "name": "GoalReached",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundAmount",
        "type": "uint256"
      }
    ],
    "name": "MemberExited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "MemberJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
      }
    ],
    "name": "MemberMissed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundAmount",
        "type": "uint256"
      }
    ],
    "name": "MemberRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
      }
    ],
    "name": "PayoutSent",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "usdm",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "circleCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "circles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "mode",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "contributionAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "frequency",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "gracePeriod",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "maxMissed",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "maxMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxCycles",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "goalDeadline",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reminderLeadTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct SavingsCircle.CircleConfig",
        "name": "config",
        "type": "tuple"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "currentCycle",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentPot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rotationIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cycleStartTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nextDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalSaved",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "contributedThisCycle",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "mode",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "contributionAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "frequency",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gracePeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "maxMissed",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "maxMembers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxCycles",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "goalAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "goalDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reminderLeadTime",
        "type": "uint256"
      }
    ],
    "name": "createCircle",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "dissolveCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "distribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "distributeGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "exitCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "getCircle",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "mode",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "contributionAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentPot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentCycle",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nextDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalSaved",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "memberAddrs",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "memberAddr",
        "type": "address"
      }
    ],
    "name": "getMemberStatus",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "missedCount",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalContributed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalReceived",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "hasReceivedPayout",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "getNextRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "memberAddr",
        "type": "address"
      }
    ],
    "name": "hasContributedThisCycle",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      }
    ],
    "name": "joinCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "memberAddr",
        "type": "address"
      }
    ],
    "name": "markMissed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "members",
    "outputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "joinedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "missedCount",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalContributed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalReceived",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "hasReceivedPayout",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
