import { expect } from "chai";
import { network } from "hardhat";

describe("Marketplace Contract", function () {

  let marketplace;
  let nft;
  let owner;
  let seller;
  let buyer;

  beforeEach(async function () {

    const { ethers } = await network.connect();

    const accounts = await ethers.getSigners();
    owner = accounts[0];
    seller = accounts[1];
    buyer = accounts[2];

    // Deploy NFT contract
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();

    // Mint NFT to seller
    const mintPrice = await nft.mintPrice();
    await nft.connect(seller).mint(seller.address, { value: mintPrice });

    // Approve marketplace to transfer NFT
    await nft.connect(seller).approve(await marketplace.getAddress(), 0);
  });

  it("Should create a listing", async function () {

    const price = 1000;

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      price
    );

    const listing = await marketplace.listings(1);

    expect(listing.price).to.equal(price);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.isActive).to.equal(true);

  });

  it("Should transfer NFT to marketplace when listing is created", async function () {

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      1000
    );

    expect(await nft.ownerOf(0)).to.equal(await marketplace.getAddress());

  });

  it("Should allow a buyer to purchase NFT", async function () {

    const { ethers } = await network.connect();

    const price = ethers.parseEther("1");

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      price
    );

    await marketplace.connect(buyer).buyListing(1, {
      value: price
    });

    expect(await nft.ownerOf(0)).to.equal(buyer.address);

  });

  it("Should fail if incorrect price is sent", async function () {

    const { ethers } = await network.connect();

    const price = ethers.parseEther("1");

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      price
    );

    await expect(
      marketplace.connect(buyer).buyListing(1, {
        value: ethers.parseEther("0.5")
      })
    ).to.be.revertedWith("Incorrect price ");

  });

  it("Should mark listing as inactive after purchase", async function () {

    const { ethers } = await network.connect();

    const price = ethers.parseEther("1");

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      price
    );

    await marketplace.connect(buyer).buyListing(1, {
      value: price
    });

    const listing = await marketplace.listings(1);

    expect(listing.isActive).to.equal(false);

  });

  it("Should return active listings", async function () {

    await marketplace.connect(seller).createListing(
      await nft.getAddress(),
      0,
      1000
    );

    const active = await marketplace.getActiveListings();

    expect(active.length).to.equal(1);

  });

});