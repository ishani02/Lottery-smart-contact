// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import {Tie} from "./Tie.sol";

contract Voting is Tie {
    struct candidate {
        address cAddress;
        uint96 votes;
    }
    
    address public admin;
    uint256 public candidateCount;
    uint256 public round = 1;
    bool public addPhase = false;
    bool public votePhase = false;
    bool public isSame = false;
    candidate public winner;
    address[] public tieCandidates; // array of candidates having same no. of votes
    mapping(uint256 => address) public allWinners; // round no. => address of winner .....stores address of all winners in diff itrs
    mapping(uint256  => mapping(address => bool)) public voters; // round => (address of voter => true if voter voted else false)
    mapping(uint256 => mapping(uint256 => candidate)) public allCandidates; // round => (candidate's index  => candidate)

    constructor() {
        admin = _msgSender();
    }

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Voting: only admin can access this");
        _;
    }
    
    /**
        * @dev addCandidate() - For adding new candidates to mappping allCandidates
        * @param _cAddress set as candidate's address
     */
    function addCandidate(address _cAddress) public onlyAdmin {
        require(addPhase == false, "Voting: no more candidates can be added as add phase is over");
        for (uint256 i = 0; i < candidateCount; i++) {
            require(allCandidates[round][i].cAddress != _cAddress, "Voting: candidate already present"); // one candidate can be added only once
        }
        candidate storage newCandidate = allCandidates[round][candidateCount++];
        newCandidate.cAddress = _cAddress;
    }
    
    /**
        * @dev voting() - For voting a candidate
        * @param index set as index of candidate who is voted by current user
     */
    function voting(uint256 index) public {
        // v => voter's address , index => candidate's index in allCandidates mapping
        require(addPhase == true, "Voting: you cannot vote right now as adding phase not over yet"); // candidates can still be added
        require(votePhase == false, "Voting: you cannot vote now as voting phase is over");
        candidate storage c = allCandidates[round][index];

        require(voters[round][_msgSender()] == false, "Voting: you have already voted"); // voter can vote only once
        voters[round][_msgSender()] = true; // voter
        c.votes++;
         if (winner.votes < c.votes) {
            winner = c;
        } 
    }
    
    /// @dev pickWinner() - For selecting a winner (candidate with max votes)  
    function pickWinner() public onlyAdmin {
        require(addPhase == true, "Voting: cannot pick winner as adding phase not over yet");
        require(votePhase == true, "Voting: cannot pick winner as voting phase not over yet");
       
        for (uint256 i = 0; i < candidateCount; i++) {
            if(winner.cAddress != allCandidates[round][i].cAddress){
             if (winner.votes < allCandidates[round][i].votes) {
                winner = allCandidates[round][i];
            } else if (winner.votes == allCandidates[round][i].votes) { //tie
                    if(isSame){ // tie not happening for the first time
                      tieCandidates.push(allCandidates[round][i].cAddress);
                    } else {
                      isSame = true;
                      tieCandidates.push(winner.cAddress);
                      tieCandidates.push(allCandidates[round][i].cAddress);
                 }
            }
        }
    } 
        if(tieCandidates.length > 0) { //tie occured
          winner.cAddress = address(0);
          Tie.tieSolver(tieCandidates);
        } 
        allWinners[round] = winner.cAddress;
    }

    /// @dev clearInfo() - To reinitialize variables for next round
    function clearInfo() public onlyAdmin {
          round++;
          addPhase = false;
          votePhase = false;
          tieCandidates =  new address[](0);
          candidateCount = 0;
          isSame = false;
          winner.cAddress = address(0);
          winner.votes = 0;
    }

    /// @dev getWinner() - For getting winner candidate's address
    function getWinner() public view returns (address) {
       return winner.cAddress;
    }

    function stopAdding() public onlyAdmin {
       addPhase = true;
    }

    function stopVoting() public onlyAdmin {
       votePhase = true;
    }
}





