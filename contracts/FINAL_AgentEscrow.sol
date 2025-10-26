// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentScoring {
    function recordMultipleScores(
        string[] memory agentIds,
        uint256[] memory scores,
        uint256[] memory revenues
    ) external;
}

/**
 * @title AgentEscrow
 * @dev Clean escrow for multi-agent payments with automatic scoring
 */
contract AgentEscrow {
    
    address public owner;
    address public backend;
    address public scoringContract;
    uint256 public platformFee = 5; // 5%
    
    struct Session {
        address user;
        uint256 amount;
        uint256 startTime;
        bool completed;
    }
    
    mapping(uint256 => Session) public sessions;
    uint256 public sessionCounter;
    uint256 public collectedFees;
    
    event SessionCreated(uint256 sessionId, address user, uint256 amount);
    event PaymentDistributed(uint256 sessionId, address recipient, uint256 amount);
    event SessionCompleted(uint256 sessionId);
    event FeesWithdrawn(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyBackend() {
        require(msg.sender == backend, "Not backend");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        backend = msg.sender;
    }
    
    function setBackend(address _backend) external onlyOwner {
        backend = _backend;
    }
    
    function setScoringContract(address _scoring) external onlyOwner {
        scoringContract = _scoring;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10, "Fee too high");
        platformFee = _fee;
    }
    
    function createSession() external payable returns (uint256) {
        require(msg.value > 0, "Must send ETH");
        
        uint256 sessionId = sessionCounter++;
        sessions[sessionId] = Session({
            user: msg.sender,
            amount: msg.value,
            startTime: block.timestamp,
            completed: false
        });
        
        emit SessionCreated(sessionId, msg.sender, msg.value);
        return sessionId;
    }
    
    function distributePayment(
        uint256 sessionId,
        address[] memory recipients,
        uint256[] memory amounts,
        string[] memory agentIds,
        uint256[] memory scores
    ) external onlyBackend {
        Session storage session = sessions[sessionId];
        require(!session.completed, "Already completed");
        require(recipients.length == amounts.length, "Length mismatch");
        
        // Calculate total
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        // Calculate fee
        uint256 fee = (total * platformFee) / 100;
        require(total + fee <= session.amount, "Insufficient funds");
        
        // Distribute payments
        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amounts[i]);
            emit PaymentDistributed(sessionId, recipients[i], amounts[i]);
        }
        
        // Collect fee
        collectedFees += fee;
        
        // Refund excess
        uint256 excess = session.amount - total - fee;
        if (excess > 0) {
            payable(session.user).transfer(excess);
        }
        
        // Mark completed
        session.completed = true;
        emit SessionCompleted(sessionId);
        
        // Record scores if configured
        if (scoringContract != address(0) && agentIds.length > 0) {
            if (agentIds.length == scores.length && agentIds.length == amounts.length) {
                try IAgentScoring(scoringContract).recordMultipleScores(
                    agentIds,
                    scores,
                    amounts
                ) {} catch {}
            }
        }
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        require(amount > 0, "No fees");
        collectedFees = 0;
        payable(owner).transfer(amount);
        emit FeesWithdrawn(amount);
    }
    
    function getSession(uint256 sessionId) external view returns (
        address user,
        uint256 amount,
        uint256 startTime,
        bool completed
    ) {
        Session memory s = sessions[sessionId];
        return (s.user, s.amount, s.startTime, s.completed);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
