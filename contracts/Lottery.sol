// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address public manager;
    address [] public players;
    //address public preWinner;
    
    constructor() {
      manager = msg.sender;  
    }

    function enterLottery() public payable {
       require(msg.value > 0.01 ether, "Lottery: ether amount not sufficient"); // rest of the func will execute only if this condition is true
       //require(msg.sender != manager,"Lottery: manager cannot enter the lottery");
       for(uint i = 0; i < players.length; i++){
          require(players[i] != msg.sender,"Lottery: player already exists");
       }
       players.push(payable(msg.sender));
    }

    function generateRandom() private view returns(uint) { // to generate random no. for pickWinner func 
       return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function pickWinner() public restricted { // gives index of winner
       uint index = generateRandom() % players.length;
       payable(players[index]).transfer(address(this).balance); // this refers to contract and address(this) helps to access address of the contract
       // preWinner = players[index];
       players = new address payable[](0);
    }

    modifier restricted() { // to prevent repetition of code
      require(msg.sender == manager , "Lottery: only manager can pick winner"); // only manager can pick the winner
      require(players.length > 0 , "Lottery: No player found");
       _; 
    }

    function getPlayers() public view returns(address[] memory) {
      return players;
    }

    function getBalance() public view returns(uint) {
       return address(this).balance;
    }
}