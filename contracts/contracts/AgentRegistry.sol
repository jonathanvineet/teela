// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentRegistry
/// @notice A registry that holds multiple agents (by bytes32 id). Owners register agents
/// with price/duration/metadata; renters call `rentAgent` and pay the listed price.
/// The contract forwards payment to the agent owner and records the active renter and start time.
contract AgentRegistry {
    struct Agent {
        address owner;
        uint256 pricePerHour; // wei
        uint256 rentalDurationSeconds;
        string metadataUri;
        uint16 score;
        address renter;
        uint256 startTime;
        bool listed;
        bool registered;
    }

    mapping(bytes32 => Agent) public agents;

    // simple non-reentrancy guard
    uint256 private _locked;

    event AgentRegistered(bytes32 indexed agentId, address indexed owner, uint256 pricePerHour, uint256 durationSeconds, string metadataUri, uint16 score);
    event AgentUpdated(bytes32 indexed agentId, address indexed owner);
    event AgentRented(bytes32 indexed agentId, address indexed renter, uint256 startTime, uint256 durationSeconds, uint256 amountWei);
    event AgentRentalEnded(bytes32 indexed agentId, address indexed by, address indexed previousRenter);
    event AgentListed(bytes32 indexed agentId);
    event AgentUnlisted(bytes32 indexed agentId);

    modifier nonReentrant() {
        require(_locked == 0, "AgentRegistry: reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    modifier onlyAgentOwner(bytes32 agentId) {
        require(agents[agentId].owner == msg.sender, "AgentRegistry: only agent owner");
        _;
    }

    /// @notice Register a new agent or update an existing agent as its owner
    function registerAgent(bytes32 agentId, uint256 pricePerHourWei, uint256 rentalDurationSeconds, string calldata metadataUri, uint16 score) external {
        Agent storage a = agents[agentId];
        if (!a.registered) {
            // new registration
            a.owner = msg.sender;
            a.registered = true;
        } else {
            // must be owner to update
            require(a.owner == msg.sender, "AgentRegistry: not owner");
        }
        a.pricePerHour = pricePerHourWei;
        a.rentalDurationSeconds = rentalDurationSeconds == 0 ? 3600 : rentalDurationSeconds;
        a.metadataUri = metadataUri;
        a.score = score;
        a.listed = true;

        if (a.owner == msg.sender) {
            // existing owner updated
            emit AgentUpdated(agentId, msg.sender);
        } else {
            emit AgentRegistered(agentId, msg.sender, pricePerHourWei, a.rentalDurationSeconds, metadataUri, score);
        }
    }

    /// @notice Rent an agent by id. Caller must send exactly the `pricePerHour` wei.
    function rentAgent(bytes32 agentId) external payable nonReentrant {
        Agent storage a = agents[agentId];
        require(a.registered, "AgentRegistry: agent not registered");
        require(a.listed, "AgentRegistry: not listed");
        require(a.renter == address(0), "AgentRegistry: already rented");
        require(msg.sender != a.owner, "AgentRegistry: owner cannot rent");
        require(msg.value == a.pricePerHour, "AgentRegistry: incorrect payment");

        // set renter and startTime before external call
        a.renter = msg.sender;
        a.startTime = block.timestamp;

        // forward funds to owner
        (bool sent, ) = payable(a.owner).call{value: msg.value}("");
        require(sent, "AgentRegistry: payment transfer failed");

        emit AgentRented(agentId, msg.sender, a.startTime, a.rentalDurationSeconds, msg.value);
    }

    /// @notice Owner can end the rental after the duration, or force end.
    function endRental(bytes32 agentId, bool force) external onlyAgentOwner(agentId) {
        Agent storage a = agents[agentId];
        require(a.renter != address(0), "AgentRegistry: not rented");
        if (!force) {
            require(block.timestamp >= a.startTime + a.rentalDurationSeconds, "AgentRegistry: rental period not over");
        }
        address prev = a.renter;
        a.renter = address(0);
        a.startTime = 0;
        emit AgentRentalEnded(agentId, msg.sender, prev);
    }

    /// @notice Get the unix timestamp (seconds) until which `user` is a renter for `agentId`. Returns 0 if not rented.
    function rentedUntil(bytes32 agentId, address user) external view returns (uint256) {
        Agent storage a = agents[agentId];
        if (a.renter != user) return 0;
        if (a.startTime == 0) return 0;
        uint256 end = a.startTime + a.rentalDurationSeconds;
        if (block.timestamp >= end) return 0;
        return end;
    }

    /// @notice Check whether `user` is currently the renter for `agentId`.
    function isRenter(bytes32 agentId, address user) external view returns (bool) {
        Agent storage a = agents[agentId];
        if (a.renter != user) return false;
        return block.timestamp < a.startTime + a.rentalDurationSeconds;
    }

    /// @notice Check whether `user` has access (owner always allowed, renter while active).
    function isAccessible(bytes32 agentId, address user) external view returns (bool) {
        Agent storage a = agents[agentId];
        if (a.owner == user) return true;
        if (a.renter == user && block.timestamp < a.startTime + a.rentalDurationSeconds) return true;
        return false;
    }

    /// @notice List or unlist an agent (owner only)
    function setListed(bytes32 agentId, bool _listed) external onlyAgentOwner(agentId) {
        agents[agentId].listed = _listed;
        if (_listed) emit AgentListed(agentId);
        else emit AgentUnlisted(agentId);
    }

    /// @notice Owner can update price and duration
    function updatePriceAndDuration(bytes32 agentId, uint256 pricePerHourWei, uint256 rentalDurationSeconds) external onlyAgentOwner(agentId) {
        Agent storage a = agents[agentId];
        a.pricePerHour = pricePerHourWei;
        a.rentalDurationSeconds = rentalDurationSeconds == 0 ? 3600 : rentalDurationSeconds;
        emit AgentUpdated(agentId, msg.sender);
    }

    /// @notice Read a compact agent summary
    function agentInfo(bytes32 agentId) external view returns (address owner, uint256 pricePerHour, uint256 durationSeconds, string memory metadataUri, uint16 score, address renter, uint256 startTime, bool listed, bool registered) {
        Agent storage a = agents[agentId];
        return (a.owner, a.pricePerHour, a.rentalDurationSeconds, a.metadataUri, a.score, a.renter, a.startTime, a.listed, a.registered);
    }
}
