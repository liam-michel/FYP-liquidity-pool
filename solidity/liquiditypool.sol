// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import "contracts/ERC20.sol";

contract LiquidityPool{
    
    address LP_Token;
    ERC20 public token1;
    ERC20 public token2;

    uint public token1_reserve;
    uint public token2_reserve;


    
    modifier validSwap(address _token){
        require(_token == address(token1) || _token == address(token2), "Invalid token type for this swap");
        _;
    }
    function setLPTokenAddress(address _LPToken) external {
        LP_Token = _LPToken;
    }

    function callToken() external view returns(uint){
        ERC20 lp = ERC20(LP_Token);
        return lp.totalSupply();

    }

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }   

    function min(uint x, uint y) private pure returns (uint){
        return x<=y? x: y;
    }

    function updateReserves(uint _token1_reserve, uint _token2_reserve) private{
        token1_reserve = _token1_reserve;
        token2_reserve = _token2_reserve;
    }

    function addLiquidity(uint _amount1, uint _amount2) external returns(uint shares) {

        token1.transferFrom(msg.sender, address(this), _amount1);
        token2.transferFrom(msg.sender, address(this), _amount2);
        if(token1_reserve > 0 || token2_reserve >0 ){
            require(_amount1 / _amount2 == token1_reserve * token2_reserve, "Ratio of liquidity added is not correct");
        }
        
        //call into LP Token smart contract to get total supply
        ERC20 LPToken = ERC20(LP_Token);
        uint current_totalSupply = LPToken.totalSupply();
        //i.e no shares have been minted (this is first bit of liquidity)
        if(current_totalSupply == 0) {
            shares = sqrt(_amount1 * _amount2);
        }else{
            shares = min(
                (_amount1 * current_totalSupply) / token1_reserve,
                (_amount2 * current_totalSupply) / token2_reserve
            );
        }
        require(shares > 0, "Minted shares must be greater than zero" );
        //mint the shares
        LPToken.mint(msg.sender, shares);
        
        //update reserves after minting 
        updateReserves(
            token1.balanceOf(address(this)),
            token2.balanceOf(address(this))
        );
        return shares;

    }

    function removeLiquidity(uint _shareCount) external returns(uint token1Amount, uint token2Amount) {
        //we want to return amount of liquidity that is proportional to the # of shares this lp provider has
        require(_shareCount > 0);
        //enable calling of LPToken smart contract
        ERC20 LPToken = ERC20(LP_Token); 

        //fetch senders LPToken balance
        uint senderBalance = LPToken.balanceOf(msg.sender);
        require(_shareCount <= senderBalance);
        
        uint LPTotalSupply = LPToken.totalSupply();
        //transfer correct proportion of reserves to the sender
        uint b1 = token1.balanceOf(address(this));
        uint b2 = token2.balanceOf(address(this));
        token1Amount = b1 * _shareCount / LPTotalSupply;
        token2Amount = b2 * _shareCount / LPTotalSupply;

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);

        //burn the LP tokens that the user has redemeed for their share of liquidity pool reserves
        LPToken.burn(msg.sender, _shareCount);

        //update reserves after burning shared
        updateReserves(
            token1.balanceOf(address(msg.sender)),
            token2.balanceOf(address(msg.sender))
        );

    }

    function swap(address _token, uint amountIn) external validSwap(_token) returns(uint out ){
        //check what token we are receiving
        bool isToken1 = (_token == address(token1));
        (ERC20 tokenIn, ERC20 tokenOut, uint inReserve, uint outReserve ) = isToken1? (token1, token2, token1_reserve, token2_reserve): (token2, token1, token2_reserve, token1_reserve);

        //calculate amount of token in (with fee of 0.3%)
        uint amountInWithFee = (amountIn * 997) / 1000;
        //dy = ydx / x + dx 
        out =  (outReserve * amountInWithFee) / (inReserve + amountInWithFee );
        //transfer the 'out' amount of tokens to sender
        tokenOut.transfer(msg.sender, out);
        //update the reserves to reflect new balances;
        updateReserves(token1.balanceOf(address(this)), token2.balanceOf(address(this)));

    }

}

