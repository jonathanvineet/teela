export const AGENT_SCORING_ADDRESS = '0x2364Fe8d139f1A3eA88399d0217c7aCA6D712f19'

export const AGENT_SCORING_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "agentId",
        "type": "string"
      }
    ],
    "name": "getAgentScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sessionCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "averageScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalRevenue",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllAgents",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAgentCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
