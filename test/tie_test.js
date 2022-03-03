const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');

describe("Tie", () => {

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        manager = await accounts[0];
        getContract = await ethers.getContractFactory("Tie");
        contract = await getContract.deploy();
    });

    describe("Tie", async () => {
        it("voter created", async () => {
            c = [accounts[1].address, accounts[2].address];
            await contract.tieSolver(c);
            await contract.connect(manager).createVoter(accounts[4].address, 0);
            await contract.connect(manager).createVoter(accounts[5].address, 1);
            await contract.connect(manager).createVoter(accounts[6].address, 0);
            expect(await contract.votersCount()).to.equal(3);
        });

        it("Only admin can create voter", async () => {
            c = [accounts[1].address, accounts[2].address];
            await contract.tieSolver(c);
            await expect(contract.connect(accounts[1]).createVoter(accounts[4].address, 0)).to.revertedWith("Tie: only admin can access this");
        });

        it("Tie between 2 candidates resolved", async () => {
            c = [accounts[1].address, accounts[2].address];
            v = [accounts[4].address, accounts[5].address, accounts[6].address];

            await contract.tieSolver(c);
            await contract.connect(manager).createVoter(v[0], 0);
            await contract.connect(manager).createVoter(v[1], 1);
            await contract.connect(manager).createVoter(v[2], 1);
            await contract.stopTieAdding();

            await contract.connect(accounts[4]).tieVoting();
            await contract.connect(accounts[5]).tieVoting();
            await contract.connect(accounts[6]).tieVoting();
            await contract.stopTieVoting();

            await contract.connect(manager).tieWinner();
            expect(await contract.newWinner()).to.equal(c[1]);
        });

        it("Tie between 3 candidates resolved", async () => {
            c = [accounts[1].address, accounts[2].address, accounts[3].address];
            v = [accounts[4].address, accounts[5].address, accounts[6].address];

            await contract.tieSolver(c);
            await contract.createVoter(v[0], 0);
            await contract.createVoter(v[1], 2);
            await contract.createVoter(v[2], 2);
            await contract.stopTieAdding();

            await contract.connect(accounts[4]).tieVoting();
            await contract.connect(accounts[5]).tieVoting();
            await contract.connect(accounts[6]).tieVoting();
            await contract.stopTieVoting();
            
            await contract.connect(manager).tieWinner();
            expect(await contract.newWinner()).to.equal(c[2]);
        });

        it("Voting over if tie happens again", async () => {
            c = [accounts[1].address, accounts[2].address, accounts[3].address];
            v = [accounts[4].address, accounts[5].address, accounts[6].address];

            await contract.tieSolver(c);
            await contract.createVoter(v[0], 0);
            await contract.createVoter(v[1], 1);
            await contract.createVoter(v[2], 2);

            await contract.stopTieAdding();
            await contract.connect(accounts[4]).tieVoting();
            await contract.connect(accounts[5]).tieVoting();
            await contract.connect(accounts[6]).tieVoting()
            await contract.stopTieVoting();

            await contract.connect(manager).tieWinner();
            expect(await contract.newWinner()).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Only admin can pick winner", async () => {
            c = [accounts[1].address, accounts[2].address, accounts[3].address];
            v = [accounts[4].address, accounts[5].address, accounts[6].address];

            await contract.tieSolver(c);
            await contract.createVoter(v[0], 0);
            await contract.createVoter(v[1], 0);
            await contract.createVoter(v[2], 2);

            await contract.stopTieAdding();
            await contract.tieVoting();
            await contract.stopTieVoting();
            await expect(contract.connect(accounts[7]).tieWinner()).to.revertedWith("Tie: only admin can access this");
        });
    });
});
