// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;


// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.0.0/contracts/token/ERC20/IERC20.sol
interface IERC20 {
    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}

contract TokenSwap {
    IERC20 public token1;
    address public owner1;
    IERC20 public token2;
    address public owner2;

    constructor(
        address _token1,
        address _owner1,
        address _token2,
        address _owner2
    ) {
        token1 = IERC20(_token1);
        owner1 = _owner1;
        token2 = IERC20(_token2);
        owner2 = _owner2;
    }
    
    function swap(uint _amount1, uint _amount2) public{
        require(msg.sender == owner1 || msg.sender == owner2, "Not authorized to call this function");
        require(token1.allowance(owner1, address(this)) >= _amount1, "Token 1 Allowance too low");
        require(token2.allowance(owner2, address(this)) >= _amount2, "Token 2 Allowance too low");

        //now transfer tokens
        _safeTransferFrom(token1, owner1, owner2, _amount1);
        _safeTransferFrom(token2, owner2, owner1, _amount2);

    }

    function _safeTransferFrom(
        IERC20 token,
        address sender,
        address recipient,
        uint amount
    ) private {
        bool sent = token.transferFrom(sender, recipient, amount);
        require(sent, "Token transfer failed");
    }

}