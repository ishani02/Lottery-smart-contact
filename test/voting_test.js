const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');

describe('Voting ', () => {

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        manager = await accounts[0];
        getContract = await ethers.getContractFactory("Voting");
        contract = await getContract.deploy();
    });

    describe('Voting', async () => {

        it('single candidate added', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            candidate = await contract.allCandidates(1,0); // allCandidates(1,0) => 1 = round & 0 = candidate's index
            expect(candidate.cAddress).to.equal(accounts[1].address);
        });

        it('multiple candidates added', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).addCandidate(accounts[3].address);
            count = await contract.candidateCount();
            expect(count.toNumber()).to.equal(3);
        });

        it('one candidate can be added only once', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await expect(contract.connect(manager).addCandidate(accounts[1].address)).to.revertedWith('Voting: candidate already present');
        });

        it('only admin can add candidates', async () => {
            await expect(contract.connect(accounts[2]).addCandidate(accounts[1].address)).to.revertedWith("Voting: only admin can access this");
        });

        it('voting done', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).stopAdding();

            pre = await contract.allCandidates(1,0);
            preVotes = pre.votes;

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);

            post = await contract.allCandidates(1,0);
            newVotes = post.votes;
            expect(newVotes).to.equal(preVotes + 2);
        });

        it('one voter can vote only once', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await expect(contract.connect(accounts[4]).voting(0)).to.revertedWith("Voting: you have already voted");
        });

        it('admin picks winner', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).addCandidate(accounts[3].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);
            await contract.connect(accounts[6]).voting(1);
            await contract.connect(manager).stopVoting();

            op = await contract.connect(manager).pickWinner();
            winner = await contract.winner();

            expect(winner.cAddress).to.equal(accounts[1].address);
            await contract.clearInfo();
        });

        it('voter cannot pick winner', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).addCandidate(accounts[3].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);
            await contract.connect(accounts[6]).voting(1);
            await contract.connect(manager).stopVoting();

            await expect(contract.connect(accounts[4]).pickWinner()).to.revertedWith('Voting: only admin can access this');
        });

        it('candidate cannot pick winner', async () => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).addCandidate(accounts[3].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);
            await contract.connect(accounts[6]).voting(1);
            await contract.connect(manager).stopVoting();

            await expect(contract.connect(accounts[1]).pickWinner()).to.revertedWith('Voting: only admin can access this');
        });

        it("winner can be picked only once", async() => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).addCandidate(accounts[3].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);
            await contract.connect(accounts[6]).voting(1);
            await contract.connect(manager).stopVoting();

            await contract.connect(manager).pickWinner();
            await expect(contract.connect(manager).pickWinner()).to.revertedWith('Voting: winner already picked');
            await contract.clearInfo();
        });

        it("adding phase is over", async() => {
            await contract.connect(manager).stopAdding();
            expect(await contract.addPhase()).to.equal(true);
        });

        it("voting phase is over", async() => {
            await contract.connect(manager).stopVoting();
            expect(await contract.votePhase()).to.equal(true);
        });

        it("candidate cannot be added after the add phase is over", async() => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).stopAdding();
            await expect(contract.connect(manager).addCandidate(accounts[3].address)).to.revertedWith("Voting: no more candidates can be added as add phase is over");
        });

        it("voting cannot be done after the voting phase is over", async() => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0);
            await contract.connect(manager).stopVoting();
            await expect(contract.connect(accounts[6]).voting(1)).to.revertedWith("Voting: you cannot vote now as voting phase is over");
        });

        it("winner cannot be picked if add and voting phase is over", async() => {
            await contract.connect(manager).addCandidate(accounts[1].address);
            await contract.connect(manager).addCandidate(accounts[2].address);
            await contract.connect(manager).stopAdding();

            await contract.connect(accounts[4]).voting(0);
            await contract.connect(accounts[5]).voting(0); 
            await expect(contract.connect(manager).pickWinner()).to.revertedWith("Voting: cannot pick winner as voting phase not over yet");
        });
    });
});