// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
//import "hardhat/console.sol";

contract Tie is Context{
    struct tieVoter {
        address vAddress; // voter's address
        uint96 cIdx; // candidate's index whom voter wants to vote for
    }

    uint256 public index; // candidate's index in tieCandidates arr
    address public tAdmin;
    address public newWinner;
    uint256 public votersCount = 0;
    bool public tieVotingPhase = false;
    bool public tieAddingPhase = false;
    address[] public tCandidates;
    mapping(address => uint256) public cVotes; // candidate's address => no.of votes
    mapping(address => tieVoter) public tieVotersMap; // voter's idx => tieVoter struct

    constructor() {
        tAdmin = _msgSender();
    }

    modifier tRestricted() {
        require(_msgSender() == tAdmin, "Tie: only admin can access this");
        _;
    }
    
    /// @dev tieSolver() - Called by pickWinner() in Voting.sol when tie happens between 2 or more candidates 
    function tieSolver(address[] memory tieCandidates) internal {
        tieAddingPhase = true; // to start adding voters 
        tCandidates = tieCandidates;
    }
    
     /** 
        * @dev createVoter() - To create a new voter of type struct and storing in a mapping tieVoters
        * @param _vAddress voter's address
        * @param _cIdx candidate's index whom the current voter wants to vote
     */ 
    function createVoter(address _vAddress, uint96 _cIdx) public tRestricted {
        require(tieAddingPhase == true, "Tie: voting phase over");
        tieVoter storage tVoter = tieVotersMap[_vAddress];
        tVoter.vAddress = _vAddress;
        tVoter.cIdx = _cIdx;
        votersCount++;
    }
    
    /// @dev tieVoting() - 1. To vote for candidate for whose index is present in current voter's cIdx
   ///                     2. To update winner's value after every candidate votes 
    function tieVoting() public {
        require(tieAddingPhase == false, "Tie: Adding phase is still on, voting not allowed");
        require(tieVotingPhase == true, "Tie: Voting phase over");

        tieVoter storage temp = tieVotersMap[_msgSender()];
        for (uint256 i = 0; i < tCandidates.length; i++) {
            if (i == temp.cIdx) {
                cVotes[tCandidates[i]]++;
                if (cVotes[newWinner] < cVotes[tCandidates[i]]) { // updating winner in each iteration
                    newWinner = tCandidates[i];
                }
            }
        }
    }

    /// @dev tieWinner() - To find winner and destroy it if tie happens again
    function tieWinner() public tRestricted {
        require(tieAddingPhase == false, "Tie: Adding phase is still on, cannot pick winner");
        require(tieVotingPhase == false, "Tie: Voting phase still on, cannot pick winner");

        for (uint256 i = 0; i < tCandidates.length; i++) {
            if (tCandidates[i] != newWinner) {
                if (cVotes[newWinner] < cVotes[tCandidates[i]]) {
                    newWinner = tCandidates[i];
                } else if (cVotes[newWinner] == cVotes[tCandidates[i]]) {
                    // destroy
                    newWinner = address(0);
                    break;
                }
            }
        }
    }

    function stopTieAdding() public tRestricted {
        tieAddingPhase = false;
        tieVotingPhase = true;
    }

    function stopTieVoting() public tRestricted {
        tieVotingPhase = false;
    }
}
