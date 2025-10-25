// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRentalEscrow
 * @dev Escrow contract for hourly agent rentals with automatic refunds
 * @notice Users pay upfront for agent access, funds held in escrow, released to agent owner after session
 */
contract AgentRentalEscrow {
    
    struct Agent {
        address owner;
        string agentId;
        uint256 hourlyRate; // in wei (e.g., 0.002 ETH = 2000000000000000 wei)
        bool isActive;
        uint256 totalEarnings;
        uint256 totalHoursRented;
    }
    
    struct Rental {
        address renter;
        string agentId;
        uint256 amountPaid;
        uint256 hoursPaid;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isCompleted;
        uint256 refundAmount;
    }
    
    // State variables
    address public platformOwner;
    uint256 public platformFeePercent = 5; // 5% platform fee
    uint256 public totalPlatformFees;
    
    // Mappings
    mapping(string => Agent) public agents;
    mapping(uint256 => Rental) public rentals;
    mapping(address => uint256[]) public userRentals;
    mapping(string => uint256[]) public agentRentals;
    
    uint256 public rentalCounter;
    
    // Events
    event AgentRegistered(string indexed agentId, address indexed owner, uint256 hourlyRate);
    event AgentUpdated(string indexed agentId, uint256 newHourlyRate, bool isActive);
    event RentalStarted(uint256 indexed rentalId, address indexed renter, string indexed agentId, uint256 hours, uint256 amount);
    event RentalCompleted(uint256 indexed rentalId, uint256 hoursUsed, uint256 refundAmount);
    event PaymentReleased(uint256 indexed rentalId, address indexed agentOwner, uint256 amount);
    event RefundIssued(uint256 indexed rentalId, address indexed renter, uint256 amount);
    event PlatformFeeWithdrawn(address indexed owner, uint256 amount);
    
    // Modifiers
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Only platform owner");
        _;
    }
    
    modifier onlyAgentOwner(string memory agentId) {
        require(agents[agentId].owner == msg.sender, "Only agent owner");
        _;
    }
    
    modifier onlyRenter(uint256 rentalId) {
        require(rentals[rentalId].renter == msg.sender, "Only renter");
        _;
    }
    
    constructor() {
        platformOwner = msg.sender;
    }
    
    /**
     * @dev Register a new agent with hourly rate
     * @param agentId Unique identifier for the agent
     * @param hourlyRate Rate in wei per hour (e.g., 2000000000000000 for 0.002 ETH)
     */
    function registerAgent(string memory agentId, uint256 hourlyRate) external {
        require(agents[agentId].owner == address(0), "Agent already registered");
        require(hourlyRate > 0, "Hourly rate must be > 0");
        
        agents[agentId] = Agent({
            owner: msg.sender,
            agentId: agentId,
            hourlyRate: hourlyRate,
            isActive: true,
            totalEarnings: 0,
            totalHoursRented: 0
        });
        
        emit AgentRegistered(agentId, msg.sender, hourlyRate);
    }
    
    /**
     * @dev Update agent hourly rate and active status
     */
    function updateAgent(string memory agentId, uint256 newHourlyRate, bool isActive) 
        external 
        onlyAgentOwner(agentId) 
    {
        require(newHourlyRate > 0, "Hourly rate must be > 0");
        
        agents[agentId].hourlyRate = newHourlyRate;
        agents[agentId].isActive = isActive;
        
        emit AgentUpdated(agentId, newHourlyRate, isActive);
    }
    
    /**
     * @dev Start a rental session by paying upfront for specified hours
     * @param agentId The agent to rent
     * @param hours Number of hours to rent (can be fractional, e.g., 1 = 1 hour, 2 = 2 hours)
     */
    function startRental(string memory agentId, uint256 hours) external payable returns (uint256) {
        Agent storage agent = agents[agentId];
        require(agent.owner != address(0), "Agent not found");
        require(agent.isActive, "Agent not active");
        require(hours > 0, "Hours must be > 0");
        
        uint256 totalCost = agent.hourlyRate * hours;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Create rental record
        uint256 rentalId = rentalCounter++;
        rentals[rentalId] = Rental({
            renter: msg.sender,
            agentId: agentId,
            amountPaid: msg.value,
            hoursPaid: hours,
            startTime: block.timestamp,
            endTime: block.timestamp + (hours * 3600), // hours * seconds
            isActive: true,
            isCompleted: false,
            refundAmount: 0
        });
        
        // Track rentals
        userRentals[msg.sender].push(rentalId);
        agentRentals[agentId].push(rentalId);
        
        emit RentalStarted(rentalId, msg.sender, agentId, hours, msg.value);

        return rentalId;
    }
    
    /**
     * @dev Complete rental and release payment to agent owner
     * @param rentalId The rental to complete
     * @param actualHoursUsed Actual hours used (for partial refunds)
     */
    function completeRental(uint256 rentalId, uint256 actualHoursUsed) external onlyRenter(rentalId) {
        Rental storage rental = rentals[rentalId];
        require(rental.isActive, "Rental not active");
        require(!rental.isCompleted, "Rental already completed");
        
        Agent storage agent = agents[rental.agentId];
        
        // Calculate payment and refund
        uint256 hoursUsed = actualHoursUsed > rental.hoursPaid ? rental.hoursPaid : actualHoursUsed;
        uint256 amountToCharge = agent.hourlyRate * hoursUsed;
        uint256 refundAmount = rental.amountPaid > amountToCharge ? rental.amountPaid - amountToCharge : 0;
        
        // Calculate platform fee (5% of charged amount)
        uint256 platformFee = (amountToCharge * platformFeePercent) / 100;
        uint256 agentPayment = amountToCharge - platformFee;
        
        // Update state
        rental.isActive = false;
        rental.isCompleted = true;
        rental.refundAmount = refundAmount;
        
        agent.totalEarnings += agentPayment;
        agent.totalHoursRented += hoursUsed;
        totalPlatformFees += platformFee;
        
        // Transfer payments
        if (agentPayment > 0) {
            payable(agent.owner).transfer(agentPayment);
            emit PaymentReleased(rentalId, agent.owner, agentPayment);
        }
        
        if (refundAmount > 0) {
            payable(rental.renter).transfer(refundAmount);
            emit RefundIssued(rentalId, rental.renter, refundAmount);
        }
        
        emit RentalCompleted(rentalId, hoursUsed, refundAmount);
    }
    
    /**
     * @dev Auto-complete rental after time expires (can be called by anyone)
     */
    function autoCompleteRental(uint256 rentalId) external {
        Rental storage rental = rentals[rentalId];
        require(rental.isActive, "Rental not active");
        require(!rental.isCompleted, "Rental already completed");
        require(block.timestamp >= rental.endTime, "Rental time not expired");
        
        Agent storage agent = agents[rental.agentId];
        
        // Full time used, no refund
        uint256 amountToCharge = rental.amountPaid;
        uint256 platformFee = (amountToCharge * platformFeePercent) / 100;
        uint256 agentPayment = amountToCharge - platformFee;
        
        // Update state
        rental.isActive = false;
        rental.isCompleted = true;
        rental.refundAmount = 0;
        
        agent.totalEarnings += agentPayment;
        agent.totalHoursRented += rental.hoursPaid;
        totalPlatformFees += platformFee;
        
        // Transfer payment
        payable(agent.owner).transfer(agentPayment);
        
        emit PaymentReleased(rentalId, agent.owner, agentPayment);
        emit RentalCompleted(rentalId, rental.hoursPaid, 0);
    }
    
    /**
     * @dev Emergency cancel rental (only if not started or within grace period)
     */
    function cancelRental(uint256 rentalId) external onlyRenter(rentalId) {
        Rental storage rental = rentals[rentalId];
        require(rental.isActive, "Rental not active");
        require(!rental.isCompleted, "Rental already completed");
        require(block.timestamp < rental.startTime + 5 minutes, "Grace period expired");
        
        // Full refund within grace period
        rental.isActive = false;
        rental.isCompleted = true;
        rental.refundAmount = rental.amountPaid;
        
        payable(rental.renter).transfer(rental.amountPaid);
        
        emit RefundIssued(rentalId, rental.renter, rental.amountPaid);
        emit RentalCompleted(rentalId, 0, rental.amountPaid);
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees() external onlyPlatformOwner {
        uint256 amount = totalPlatformFees;
        require(amount > 0, "No fees to withdraw");
        
        totalPlatformFees = 0;
        payable(platformOwner).transfer(amount);
        
        emit PlatformFeeWithdrawn(platformOwner, amount);
    }
    
    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyPlatformOwner {
        require(newFeePercent <= 10, "Fee too high (max 10%)");
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Get agent details
     */
    function getAgent(string memory agentId) external view returns (
        address owner,
        uint256 hourlyRate,
        bool isActive,
        uint256 totalEarnings,
        uint256 totalHoursRented
    ) {
        Agent memory agent = agents[agentId];
        return (
            agent.owner,
            agent.hourlyRate,
            agent.isActive,
            agent.totalEarnings,
            agent.totalHoursRented
        );
    }
    
    /**
     * @dev Get rental details
     */
    function getRental(uint256 rentalId) external view returns (
        address renter,
        string memory agentId,
        uint256 amountPaid,
        uint256 hoursPaid,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isCompleted
    ) {
        Rental memory rental = rentals[rentalId];
        return (
            rental.renter,
            rental.agentId,
            rental.amountPaid,
            rental.hoursPaid,
            rental.startTime,
            rental.endTime,
            rental.isActive,
            rental.isCompleted
        );
    }
    
    /**
     * @dev Get user's rental history
     */
    function getUserRentals(address user) external view returns (uint256[] memory) {
        return userRentals[user];
    }
    
    /**
     * @dev Get agent's rental history
     */
    function getAgentRentals(string memory agentId) external view returns (uint256[] memory) {
        return agentRentals[agentId];
    }
    
    /**
     * @dev Check if rental is still active and not expired
     */
    function isRentalActive(uint256 rentalId) external view returns (bool) {
        Rental memory rental = rentals[rentalId];
        return rental.isActive && !rental.isCompleted && block.timestamp < rental.endTime;
    }
    
    /**
     * @dev Get remaining time for rental in seconds
     */
    function getRemainingTime(uint256 rentalId) external view returns (uint256) {
        Rental memory rental = rentals[rentalId];
        if (!rental.isActive || rental.isCompleted || block.timestamp >= rental.endTime) {
            return 0;
        }
        return rental.endTime - block.timestamp;
    }
}
