const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

let accounts, manager, contract, getContract, num;

beforeEach(async () => {
  accounts = await ethers.getSigners();
  manager = await accounts[0];
  getContract = await ethers.getContractFactory("Lottery");
  contract = await getContract.deploy();

  num = BigNumber.from(1).mul(BigNumber.from(10).pow(17)); // 1 x 10^17
});

describe("Lottery", async () => {
  it("single user entering lottery", async () => {
    await contract.connect(accounts[1]).enterLottery({ value: num });
    players = await contract.getPlayers();
    expect(players[0]).to.eq(accounts[1].address);
  });

  it("multiple users entering lottery", async () => {
    await contract.connect(accounts[1]).enterLottery({ value: num });
    await contract.connect(accounts[2]).enterLottery({ value: num });
    await contract.connect(accounts[3]).enterLottery({ value: num });
    playerArr = await contract.getPlayers(); // array of players who have entered the lottery
    //console.log(playerArr);
    expect(playerArr[0]).to.eq(accounts[1].address);
    expect(playerArr[1]).to.eq(accounts[2].address);
    expect(playerArr[2]).to.eq(accounts[3].address);
  });

  it("pick winner", async () => {
    await contract.connect(accounts[1]).enterLottery({ value: num });
    await contract.connect(accounts[2]).enterLottery({ value: num });
    playerArr = await contract.getPlayers(); // array of players who have entered the lottery
    await contract.connect(manager).pickWinner();
    let Balance = await contract.getBalance();
    expect(Balance).to.equal(0);
  });

  it("only manager can pick winner", async () => {
    await expect(contract.connect(accounts[3]).pickWinner()).to.be.revertedWith("Lottery: only manager can pick winner");
  });

  it("pick winner only when players array is filled", async () => {
    await expect(contract.connect(manager).pickWinner()).to.revertedWith("Lottery: No player found");
  });

  it("winner can be picked only once in a single iteration", async () => {
    await contract.connect(accounts[3]).enterLottery({ value: num });
    await contract.connect(accounts[4]).enterLottery({ value: num });
    await contract.connect(manager).pickWinner();
    let Balance = await contract.getBalance();
    if (Balance == 0) {
      await expect(contract.connect(manager).pickWinner()).to.revertedWith("Lottery: No player found");
    }
  });

  it("one user can enter lottery once", async() => {
    await contract.connect(accounts[3]).enterLottery({value: num});
    await expect(contract.connect(accounts[3]).enterLottery({value: num})).to.revertedWith("Lottery: player already exists");
  });

  it("manager cannot enter lottery", async() => {
    await expect(contract.connect(manager).enterLottery({value: num})).to.revertedWith("Lottery: manager cannot enter the lottery");
  })
});
