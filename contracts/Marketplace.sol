// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _listingIds;

    struct Listing {
        uint listingId;
        address nftContract;
        uint tokenId;
        address payable seller;
        uint price;
        bool isActive;
    }

    mapping(uint => Listing) public listings;

    event ListingCreated(
        uint indexed listingId, 
        address indexed nftContract, 
        uint indexed tokenId, 
        address seller, 
        uint price);

    event ListingSold(
        uint indexed listingId, 
        address buyer, 
        uint price);

    function createListing(address nftContract, uint tokenId, uint price) external nonReentrant{
        require(price > 0 ,"Price must be greater than 0");
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        _listingIds.increment();
        uint listingId = _listingIds.current();

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            isActive: true
        });
        emit ListingCreated(listingId, nftContract, tokenId, msg.sender, price);
    }

    function buyListing(uint listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(msg.value == listing.price, "Incorrect price ");

        listing.isActive = false;
        (bool success,)= listing.seller.call{value: msg.value}("");
        require(success, "Transfer failed");
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    function getActiveListings() public view returns (Listing[] memory) {
        uint total = _listingIds.current();
        uint count = 0;

        for (uint i = 1; i <= total; i++) {
            if (listings[i].isActive) {
                count++;
            }
        }
        Listing[] memory active = new Listing[](count);
        uint index = 0;
        for (uint i = 1; i <= total; i++) {
            if (listings[i].isActive) {
                active[index] = listings[i];
                index++;
            }
        }
        return active;
    }




}