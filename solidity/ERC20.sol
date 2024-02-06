// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

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

contract ERC20 is IERC20{
    address public owner;
    uint public totalSupply = 0;
    mapping(address => uint) public balanceOf;
    //mapping client -> (spender -> amount)
    mapping(address => mapping(address => uint)) public allowance;
    string public name = "TestToken";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    
    modifier ownable() {
        require(owner == msg.sender, "Only the owner of thsi contract can call this function");
        _;
    }
    constructor(uint _initialSupply){
        owner = msg.sender;
        totalSupply = _initialSupply;
    }

    function transferOwnership(address newOwner) public ownable {
        require(newOwner != address(0), "Not a valid address");
        owner = newOwner;
    }

    
    function transfer(address recipient, uint amount) external returns (bool){
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount );
        return true;
    }


    function approve(address spender, uint amount) external returns (bool){
        //allow the spender to spend amount of msg.senders token
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool){
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    
    function mint(address recipient, uint amount) external ownable{
        balanceOf[recipient] += amount;
        totalSupply += amount;
        emit Transfer(address(0), recipient, amount);
    }
    function burn(address sender ,uint amount) external ownable{
        balanceOf[sender] == amount;
        totalSupply -= amount;
        emit Transfer(sender, address(0), amount);
    }





}


