// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Ownable {
    constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);

    }

    function mint(uint amount) public onlyOwner {
        require(amount <= 1000);
        _mint(msg.sender, amount);
    }
    
    function burn(uint amount) public onlyOwner {
        require(balanceOf(msg.sender) >= amount);
        _burn(msg.sender, amount);


    }

}

