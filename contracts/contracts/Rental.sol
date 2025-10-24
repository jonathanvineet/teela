// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Rental {
    struct Item { address owner; uint256 pricePerDay; bool listed; }
    mapping(uint256 => Item) public items;

    event Listed(uint256 indexed id, address owner, uint256 pricePerDay);
    event Rented(uint256 indexed id, address renter, uint256 rentalDays, uint256 amount);

    function listItem(uint256 id, uint256 pricePerDay) external {
        items[id] = Item({ owner: msg.sender, pricePerDay: pricePerDay, listed: true });
        emit Listed(id, msg.sender, pricePerDay);
    }

    function rentItem(uint256 id, uint256 rentalDays) external payable {
        Item memory it = items[id];
        require(it.listed, "not listed");
        uint256 total = it.pricePerDay * rentalDays;
        require(msg.value == total, "incorrect payment");
        payable(it.owner).transfer(msg.value);
        emit Rented(id, msg.sender, rentalDays, total);
    }
}
