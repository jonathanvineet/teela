// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ManagedRental
 * @notice A small rental contract where an owner lists an "agent" for hourly rent.
 * The owner sets the price per hour and the rental duration (default 1 hour).
 * Users call `rent()` and pay the exact price to start the rental. Funds are
 * forwarded immediately to the owner. The owner retains elevated privileges
 * (can update price/duration, list/unlist, and force end rentals) and is
 * considered always allowed access (see `isAccessible`).
 */
contract ManagedRental {
    address public owner;
    address public renter;
    uint256 public pricePerHour; // amount in wei for one hour
    uint256 public rentalDurationSeconds; // duration in seconds (default 3600)
    uint256 public startTime;
    bool public listed;

    // Agent metadata registered by owner for this contract (single-agent contract)
    bytes32 public agentId;
    string public metadataUri; // optional metadata or manifest URL
    uint16 public score; // optional owner-supplied score/quality metric (0-65535)
    bool public registered;

    // simple non-reentrancy guard
    uint256 private _locked;

    event Listed(address indexed owner);
    event Unlisted(address indexed owner);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event DurationUpdated(uint256 oldDuration, uint256 newDuration);
    event Rented(address indexed renter, uint256 startTime, uint256 duration);
    event RentalEnded(address indexed by, address indexed previousRenter);
    event AgentRegistered(bytes32 indexed agentId, uint256 pricePerHour, uint256 durationSeconds, string metadataUri, uint16 score);

    modifier onlyOwner() {
        require(msg.sender == owner, "ManagedRental: only owner");
        _;
    }

    modifier notZeroAddress(address a) {
        require(a != address(0), "ManagedRental: zero address");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 0, "ManagedRental: reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(uint256 _pricePerHourWei, uint256 _rentalDurationSeconds) {
        owner = msg.sender;
        pricePerHour = _pricePerHourWei;
        rentalDurationSeconds = _rentalDurationSeconds == 0 ? 3600 : _rentalDurationSeconds;
        listed = true;
    }

    /// @notice Owner registers the agent metadata for this contract. Owner should call this after deployment.
    function registerAgent(bytes32 _agentId, uint256 _pricePerHourWei, uint256 _rentalDurationSeconds, string calldata _metadataUri, uint16 _score) external onlyOwner {
        agentId = _agentId;
        pricePerHour = _pricePerHourWei;
        rentalDurationSeconds = _rentalDurationSeconds == 0 ? 3600 : _rentalDurationSeconds;
        metadataUri = _metadataUri;
        score = _score;
        listed = true;
        registered = true;
        emit AgentRegistered(_agentId, pricePerHour, rentalDurationSeconds, _metadataUri, _score);
    }

    // Convenience view to match older ABI naming: rentalAmount -> pricePerHour
    function rentalAmount() external view returns (uint256) {
        return pricePerHour;
    }

    // Convenience view to match older ABI naming: rentalDuration -> rentalDurationSeconds
    function rentalDuration() external view returns (uint256) {
        return rentalDurationSeconds;
    }

    /// @notice Owner lists this contract for renting
    function list() external onlyOwner {
        listed = true;
        emit Listed(owner);
    }

    /// @notice Owner unlists (temporarily disable renting)
    function unlist() external onlyOwner {
        listed = false;
        emit Unlisted(owner);
    }

    /// @notice Owner can update the hourly price (in wei)
    function setPricePerHour(uint256 _pricePerHourWei) external onlyOwner {
        uint256 old = pricePerHour;
        pricePerHour = _pricePerHourWei;
        emit PriceUpdated(old, _pricePerHourWei);
    }

    /// @notice Owner can update the rental duration (seconds)
    function setRentalDuration(uint256 _seconds) external onlyOwner {
        uint256 old = rentalDurationSeconds;
        rentalDurationSeconds = _seconds;
        emit DurationUpdated(old, _seconds);
    }

    /// @notice Rent for one period (owner defines pricePerHour which is treated as the price for one rental period)
    /// The caller must send exactly `pricePerHour` wei. Funds are forwarded to the owner immediately.
    function rent() external payable {
        require(registered, "ManagedRental: agent not registered");
        require(listed, "ManagedRental: not listed");
        require(renter == address(0), "ManagedRental: already rented");
        require(msg.sender != owner, "ManagedRental: owner cannot rent");
        require(msg.value == pricePerHour, "ManagedRental: incorrect rental amount");

        // set renter and start time before transferring funds to reduce reentrancy risk
        renter = msg.sender;
        startTime = block.timestamp;

        // forward funds to owner; use nonReentrant pattern to be safer
        (bool sent, ) = payable(owner).call{value: msg.value}("");
        require(sent, "ManagedRental: payment transfer failed");

        emit Rented(msg.sender, startTime, rentalDurationSeconds);
    }

    /// @notice Owner can end the rental after duration OR force-end early
    /// If called by the owner and `force` is true, rental ends immediately.
    function endRental(bool force) external onlyOwner {
        require(renter != address(0), "ManagedRental: not rented");
        if (!force) {
            require(block.timestamp >= startTime + rentalDurationSeconds, "ManagedRental: rental period not over");
        }
        address prev = renter;
        renter = address(0);
        startTime = 0;
        emit RentalEnded(msg.sender, prev);
    }

    /// @notice View helper: get a summary of the registered agent
    function agentInfo() external view returns (bytes32 _agentId, uint256 _pricePerHour, uint256 _rentalDurationSeconds, string memory _metadataUri, uint16 _score, bool _listed, bool _registered) {
        return (agentId, pricePerHour, rentalDurationSeconds, metadataUri, score, listed, registered);
    }

    /// @notice View helper: is the rental currently active?
    function isRented() public view returns (bool) {
        if (renter == address(0)) return false;
        return block.timestamp < startTime + rentalDurationSeconds;
    }

    /// @notice Time remaining for current rental in seconds (0 if not rented)
    function timeRemaining() public view returns (uint256) {
        if (!isRented()) return 0;
        uint256 end = startTime + rentalDurationSeconds;
        return end - block.timestamp;
    }

    /// @notice Access helper: owner is always allowed; renter allowed while rental active
    function isAccessible(address user) external view returns (bool) {
        if (user == owner) return true;
        if (user == renter && isRented()) return true;
        return false;
    }
}
