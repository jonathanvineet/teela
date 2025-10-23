// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentalContract {
    address public owner;
    address public renter;
    uint256 public rentalAmount;
    uint256 public rentalDuration;
    uint256 public startTime;

    constructor(uint256 _rentalAmount, uint256 _rentalDuration) {
        owner = msg.sender;
        rentalAmount = _rentalAmount;
        rentalDuration = _rentalDuration;
    }

    function rent() external payable {
        require(renter == address(0), "Already rented");
        require(msg.value == rentalAmount, "Incorrect rental amount");

        renter = msg.sender;
        startTime = block.timestamp;
    }

    function endRental() external {
        require(msg.sender == owner, "Only owner can end rental");
        require(block.timestamp >= startTime + rentalDuration, "Rental duration not over");

        renter = address(0);
        startTime = 0;
    }
}