// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentScoring V2
 * @notice Tracks agent performance scores with backend access
 * @dev Allows both escrow contract AND backend to record scores
 */
contract AgentScoring {
    
    struct AgentData {
        uint256 totalScore;
        uint256 sessionCount;
        uint256 totalRevenue;
        bool exists;
    }
    
    mapping(string => AgentData) public agents;
    string[] public agentList;
    
    address public owner;
    address public escrowContract;
    address public backend;  // NEW: Backend can also record scores
    
    event ScoreRecorded(string agentId, uint256 score, uint256 revenue);
    event EscrowUpdated(address newEscrow);
    event BackendUpdated(address newBackend);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == escrowContract || msg.sender == backend,
            "Not authorized"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
        backend = msg.sender; // Owner is initial backend
    }
    
    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = _escrow;
        emit EscrowUpdated(_escrow);
    }
    
    function setBackend(address _backend) external onlyOwner {
        backend = _backend;
        emit BackendUpdated(_backend);
    }
    
    function recordScore(
        string memory agentId,
        uint256 score,
        uint256 revenue
    ) external onlyAuthorized {
        require(score <= 100, "Invalid score");
        
        AgentData storage agent = agents[agentId];
        
        if (!agent.exists) {
            agent.exists = true;
            agentList.push(agentId);
        }
        
        agent.totalScore += score;
        agent.sessionCount += 1;
        agent.totalRevenue += revenue;
        
        emit ScoreRecorded(agentId, score, revenue);
    }
    
    function recordMultipleScores(
        string[] memory agentIds,
        uint256[] memory scores,
        uint256[] memory revenues
    ) external onlyAuthorized {
        require(agentIds.length == scores.length, "Length mismatch");
        require(agentIds.length == revenues.length, "Length mismatch");
        
        for (uint256 i = 0; i < agentIds.length; i++) {
            require(scores[i] <= 100, "Invalid score");
            
            AgentData storage agent = agents[agentIds[i]];
            
            if (!agent.exists) {
                agent.exists = true;
                agentList.push(agentIds[i]);
            }
            
            agent.totalScore += scores[i];
            agent.sessionCount += 1;
            agent.totalRevenue += revenues[i];
            
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
        totalScore = agent.totalScore;
        sessionCount = agent.sessionCount;
        averageScore = sessionCount > 0 ? totalScore / sessionCount : 0;
        totalRevenue = agent.totalRevenue;
    }
    
    function getAllAgents() external view returns (string[] memory) {
        return agentList;
    }
    
    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
}
