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

    event Listed(address indexed owner);
    event Unlisted(address indexed owner);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event DurationUpdated(uint256 oldDuration, uint256 newDuration);
    event Rented(address indexed renter, uint256 startTime, uint256 duration);
    event RentalEnded(address indexed by, address indexed previousRenter);

    modifier onlyOwner() {
        require(msg.sender == owner, "ManagedRental: only owner");
        _;
    }

    modifier notZeroAddress(address a) {
        require(a != address(0), "ManagedRental: zero address");
        _;
    }

    constructor(uint256 _pricePerHourWei, uint256 _rentalDurationSeconds) {
        owner = msg.sender;
        pricePerHour = _pricePerHourWei;
        rentalDurationSeconds = _rentalDurationSeconds == 0 ? 3600 : _rentalDurationSeconds;
        listed = true;
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
        require(listed, "ManagedRental: not listed");
        require(renter == address(0), "ManagedRental: already rented");
        require(msg.value == pricePerHour, "ManagedRental: incorrect rental amount");

        // set renter and start time before transferring funds to reduce reentrancy risk
        renter = msg.sender;
        startTime = block.timestamp;

        // forward funds to owner; require success
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
