// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// 00000000000000000

contract LpToken is ERC20, Ownable {
    constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);

    }

    function mint(address recipient, uint amount) public onlyOwner {
        _mint(recipient , amount);
    }
    
    function burn(address recipient, uint amount) public onlyOwner {
        require(balanceOf(recipient) >= amount);
        _burn(recipient, amount);


    }


}

