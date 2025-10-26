// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentScoring
 * @dev Simple, clean agent scoring system
 */
contract AgentScoring {
    
    address public owner;
    address public escrowContract;
    
    struct AgentData {
        uint256 totalScore;
        uint256 sessionCount;
        uint256 totalRevenue;
        bool exists;
    }
    
    mapping(string => AgentData) public agents;
    string[] public agentList;
    
    event ScoreRecorded(string agentId, uint256 score, uint256 revenue);
    event EscrowUpdated(address newEscrow);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "Not escrow");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = _escrow;
        emit EscrowUpdated(_escrow);
    }
    
    function recordScore(
        string memory agentId,
        uint256 score,
        uint256 revenue
    ) external onlyEscrow {
        require(score <= 100, "Score must be 0-100");
        
        if (!agents[agentId].exists) {
            agents[agentId].exists = true;
            agentList.push(agentId);
        }
        
        agents[agentId].totalScore += score;
        agents[agentId].sessionCount += 1;
        agents[agentId].totalRevenue += revenue;
        
        emit ScoreRecorded(agentId, score, revenue);
    }
    
    function recordMultipleScores(
        string[] memory agentIds,
        uint256[] memory scores,
        uint256[] memory revenues
    ) external onlyEscrow {
        require(agentIds.length == scores.length, "Length mismatch");
        require(agentIds.length == revenues.length, "Length mismatch");
        
        for (uint256 i = 0; i < agentIds.length; i++) {
            require(scores[i] <= 100, "Score must be 0-100");
            
            if (!agents[agentIds[i]].exists) {
                agents[agentIds[i]].exists = true;
                agentList.push(agentIds[i]);
            }
            
            agents[agentIds[i]].totalScore += scores[i];
            agents[agentIds[i]].sessionCount += 1;
            agents[agentIds[i]].totalRevenue += revenues[i];
            
            emit ScoreRecorded(agentIds[i], scores[i], revenues[i]);
        }
    }
    
    function getAgentScore(string memory agentId) external view returns (
        uint256 totalScore,
        uint256 sessionCount,
        uint256 averageScore,
        uint256 totalRevenue
    ) {
        AgentData memory agent = agents[agentId];
        uint256 avg = agent.sessionCount > 0 ? agent.totalScore / agent.sessionCount : 0;
        return (agent.totalScore, agent.sessionCount, avg, agent.totalRevenue);
    }
    
    function getAllAgents() external view returns (string[] memory) {
        return agentList;
    }
    
    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
}
