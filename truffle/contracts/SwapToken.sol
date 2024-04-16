// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// 00000000000000000

contract SwapToken is ERC20 {
    constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function mint(uint amount) public {
        require(amount <= 1000 * 10 ** uint(decimals()));
        _mint(msg.sender, amount);
    }
    
    function burn(uint amount) public {
        require(balanceOf(msg.sender) <= amount);
        _burn(msg.sender, amount);
    }

    function showDecimals() public view returns(uint){
        return decimals();

    }

    

}