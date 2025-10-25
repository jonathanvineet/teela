// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentRegistry
 * @dev Contract for registering and managing AI agents on-chain
 */
contract AgentRegistry {
    struct Agent {
        string agentId;          // Unique identifier for the agent
        string name;             // Display name of the agent
        string agentAddress;     // Agent's network address (e.g., Agentverse address)
        string speciality;       // Agent's area of expertise
        string domain;           // Domain category (e.g., "financial", "healthcare")
        address owner;           // Wallet address of the agent owner
        uint256 registeredAt;    // Timestamp when agent was registered
        bool isActive;           // Whether the agent is currently active
    }

    // Mapping from agent ID to Agent struct
    mapping(string => Agent) public agents;
    
    // Mapping from owner address to array of their agent IDs
    mapping(address => string[]) public ownerAgents;
    
    // Array of all registered agent IDs
    string[] public allAgentIds;
    
    // Mapping to check if agent ID exists
    mapping(string => bool) public agentExists;

    // Events
    event AgentRegistered(
        string indexed agentId,
        address indexed owner,
        string name,
        string agentAddress,
        string speciality,
        string domain
    );
    
    event AgentUpdated(
        string indexed agentId,
        address indexed owner,
        string name,
        string speciality,
        bool isActive
    );
    
    event AgentDeactivated(string indexed agentId, address indexed owner);

    // Modifiers
    modifier onlyAgentOwner(string memory agentId) {
        require(agentExists[agentId], "Agent does not exist");
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        _;
    }

    modifier validAgentId(string memory agentId) {
        require(bytes(agentId).length > 0, "Agent ID cannot be empty");
        require(bytes(agentId).length <= 64, "Agent ID too long");
        _;
    }

    /**
     * @dev Register a new agent
     * @param agentId Unique identifier for the agent
     * @param name Display name of the agent
     * @param agentAddress Agent's network address
     * @param speciality Agent's area of expertise
     * @param domain Domain category
     */
    function registerAgent(
        string memory agentId,
        string memory name,
        string memory agentAddress,
        string memory speciality,
        string memory domain
    ) external validAgentId(agentId) {
        require(!agentExists[agentId], "Agent ID already exists");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(agentAddress).length > 0, "Agent address cannot be empty");
        require(bytes(speciality).length > 0, "Speciality cannot be empty");
        require(bytes(domain).length > 0, "Domain cannot be empty");

        // Create new agent
        Agent memory newAgent = Agent({
            agentId: agentId,
            name: name,
            agentAddress: agentAddress,
            speciality: speciality,
            domain: domain,
            owner: msg.sender,
            registeredAt: block.timestamp,
            isActive: true
        });

        // Store agent
        agents[agentId] = newAgent;
        agentExists[agentId] = true;
        
        // Add to owner's agents
        ownerAgents[msg.sender].push(agentId);
        
        // Add to all agents
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, msg.sender, name, agentAddress, speciality, domain);
    }

    /**
     * @dev Update an existing agent's information
     * @param agentId Agent ID to update
     * @param name New display name
     * @param speciality New speciality
     * @param isActive New active status
     */
    function updateAgent(
        string memory agentId,
        string memory name,
        string memory speciality,
        bool isActive
    ) external onlyAgentOwner(agentId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(speciality).length > 0, "Speciality cannot be empty");

        Agent storage agent = agents[agentId];
        agent.name = name;
        agent.speciality = speciality;
        agent.isActive = isActive;

        emit AgentUpdated(agentId, msg.sender, name, speciality, isActive);
    }

    /**
     * @dev Deactivate an agent
     * @param agentId Agent ID to deactivate
     */
    function deactivateAgent(string memory agentId) external onlyAgentOwner(agentId) {
        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId, msg.sender);
    }

    /**
     * @dev Get agent information
     * @param agentId Agent ID to query
     * @return Agent struct
     */
    function getAgent(string memory agentId) external view returns (Agent memory) {
        require(agentExists[agentId], "Agent does not exist");
        return agents[agentId];
    }

    /**
     * @dev Get all agent IDs owned by an address
     * @param owner Owner address
     * @return Array of agent IDs
     */
    function getOwnerAgents(address owner) external view returns (string[] memory) {
        return ownerAgents[owner];
    }

    /**
     * @dev Get all registered agent IDs
     * @return Array of all agent IDs
     */
    function getAllAgentIds() external view returns (string[] memory) {
        return allAgentIds;
    }

    /**
     * @dev Get agents by domain
     * @param domain Domain to filter by
     * @return Array of agent IDs in the domain
     */
    function getAgentsByDomain(string memory domain) external view returns (string[] memory) {
        string[] memory domainAgents = new string[](allAgentIds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allAgentIds.length; i++) {
            if (keccak256(bytes(agents[allAgentIds[i]].domain)) == keccak256(bytes(domain))) {
                domainAgents[count] = allAgentIds[i];
                count++;
            }
        }

        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = domainAgents[i];
        }

        return result;
    }

    /**
     * @dev Get total number of registered agents
     * @return Total count
     */
    function getTotalAgents() external view returns (uint256) {
        return allAgentIds.length;
    }

    /**
     * @dev Check if an agent is owned by a specific address
     * @param agentId Agent ID to check
     * @param owner Address to check ownership
     * @return True if owner owns the agent
     */
    function isAgentOwner(string memory agentId, address owner) external view returns (bool) {
        if (!agentExists[agentId]) return false;
        return agents[agentId].owner == owner;
    }
}
