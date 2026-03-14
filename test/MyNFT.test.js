import { expect } from "chai";
import { network } from "hardhat";

describe("MyNFT Contract", function () {

  let myNFT;
  let owner;
  let addr1;

  beforeEach(async function () {

    const { ethers } = await network.connect();

    const accounts = await ethers.getSigners();
    owner = accounts[0];
    addr1 = accounts[1];

    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy();

    await myNFT.waitForDeployment();
  });

  it("Should deploy correctly", async function () {

    expect(await myNFT.name()).to.equal("MyNFT");
    expect(await myNFT.symbol()).to.equal("MNFT");

  });

  it("Should mint NFT", async function () {

    const { ethers } = await network.connect();

    const mintPrice = await myNFT.mintPrice();

    await myNFT.connect(addr1).mint(addr1.address, {
      value: mintPrice
    });

    expect(await myNFT.ownerOf(0)).to.equal(addr1.address);

  });

});