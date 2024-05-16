// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./LpToken.sol";
// 000000000000000000

struct Deposit{
    uint amount;
    uint lockPeriodEnd;
}

contract VariableLiquidityPool{
    uint public lockPeriod =  1 minutes / 2; 
    mapping(address => Deposit) deposits;
    address LPTOKEN_ADDRESS;
    LpToken public lptoken;
    ERC20 public token1;
    ERC20 public token2;
    uint public token1_reserve = 0;
    uint public token2_reserve = 0;
    uint public precision = 1e18;
    uint public baseFee = 3*10e15;
    uint[] public dataPoints;
    uint private lastCheckTime = block.timestamp;
    uint256 public lastFetchedExternalRatio = 0;
    uint256 public average_external_ratio;
    uint public recent_swaps = 0;

    constructor(address _t1, address _t2, address _lptoken){
        token1 = ERC20(_t1);
        token2 = ERC20(_t2);
        lptoken = LpToken(_lptoken);


    }

    function getDataPoints() public view returns(uint[] memory){
        return dataPoints;
    }

    //ONLY HERE FOR TESTING PURPOSES, NEEDS TO BE REMOVED BEFORE ACTUAL USE :D
    function setExternalRatio(uint256 _ratio) public {
    lastFetchedExternalRatio = _ratio;
    }


    function getChainlinkDataFeedLatestAnswer() public view returns (uint256) {
        // (
        //     /* uint80 roundID */,
        //     int answer,
        //     /*uint startedAt*/,
        //     /*uint timeStamp*/,
        //     /*uint80 answeredInRound*/
        // ) = dataFeed.latestRoundData();
        // return answer;
        // return uint256(2000000000000000000);
        return lastFetchedExternalRatio;
    }

    function setReserve1(uint _reserve1) public  returns(uint){
        token1_reserve = _reserve1;
        return token1_reserve;
    }

    function setReserve2(uint _reserve2) public  returns(uint){
        token2_reserve = _reserve2;
        return token2_reserve;
    }

    function getReserveRatio() public view returns(uint){  
        require(token1_reserve> 0 && token2_reserve > 0 );
        uint ratio = (token2_reserve * precision) / token1_reserve;
        return ratio;

    }

    function withFee(uint amount) public view returns(uint){
        uint minusFee = amount * (10**18 - baseFee) / 10**18;
        return minusFee;
    }


    //tA / tB should be == the price feed
    function calculateNewSwapFee() public returns(string memory){
        require(token1_reserve > 0 && token2_reserve > 0);
        uint internal_ratio = getReserveRatio(); 
        //calculate upper and
        //lower bound for the internal ratio
        //if our average external ratio deviates from this then we charge higher fee

        uint upperBound = internal_ratio * 1005 / 1000; // Multiply by 1.05 but adjusted for solidity's lack of decimal
        uint lowerBound = internal_ratio * 995 / 1000;  // Multiply by 0.95 adjusted for solidity

        uint percentageDifference;
        //calculate the percentage difference
        if(average_external_ratio > internal_ratio){
          percentageDifference = (average_external_ratio - internal_ratio) * 100 / internal_ratio;
        }else{
          percentageDifference = (internal_ratio - average_external_ratio) * 100 / internal_ratio;
        }
                // calculate the new swap fee based on the percentage difference
        uint newFee = baseFee + (baseFee * percentageDifference);
        baseFee = newFee;

        // return the new swap fee
        return "Swap fee updated successfully";


        
    
    }
        //function to calculate the time since last chainlink ratio fetch
    function calculateTimeDiff() private view returns(bool){
        if(( block.timestamp - lastCheckTime) > 1 minutes){
            return true;
        }
        return false;
    }

    function calculateSMA() private{
        require(dataPoints.length>0);
        uint sum = 0;
        for(uint i= 0; i < dataPoints.length; i++){
            sum += dataPoints[i];
        }
        uint average = sum / dataPoints.length;
        average_external_ratio = uint256(average);
    }


    //function for shifting the points in the array back
    function shiftPoints(uint point) private{
        if(dataPoints.length<5){
            dataPoints.push(point);
        }
        else{
            for(uint i=0; i < dataPoints.length -1; i ++){
                dataPoints[i] = dataPoints[i+1];
            }
            dataPoints[dataPoints.length-1] = point;
        }
        calculateSMA();
    }

    // function calculatePercentageDifference(uint256 num1, uint256 num2) public pure returns (uint256) {
    //     require(num2 != 0, "Cannot divide by zero");
    //     uint256 difference = (num1 > num2) ? (num1 - num2) : (num2 - num1);
    //     uint256 percentage = (difference * 100) / num2;
    //     return percentage;
    // }

    modifier validSwap(address _token){
        require(_token == address(token1) || _token == address(token2), "Invalid token type for this swap");
        _;
    }
    function setLPTokenAddress(address _LPToken) external {
        LPTOKEN_ADDRESS = _LPToken;
    }

    function callToken() external view returns(uint){
        ERC20 lp = ERC20(LPTOKEN_ADDRESS);
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

    function addDeposit(uint shares) private{
        //grab current deposit for sender if it exists (check if amount is >0)
        //calculate new timestamp
        uint withdrawalDate = block.timestamp + lockPeriod;
        if(deposits[msg.sender].amount>0){
            uint totalShares = shares + deposits[msg.sender].amount;
            deposits[msg.sender] = Deposit(totalShares, withdrawalDate);
        //if the depoosit is new, make a new deposit objedct
        }else{
            deposits[msg.sender] = Deposit(shares, withdrawalDate);
        }
        //mint the new LP tokens 
        lptoken.mint(msg.sender, shares);

    }



    //function for finding correct ratios in the case that there is a delay between transaction submission and transaction  (likely to occur in real use)
    function calculateNewLiquidityRatios(uint _amount1, uint _amount2, uint slippage) private view returns(uint, uint){
        //start by calculating a new a2 for the given a1
        //a2 = (a1 x r2) / r1
        uint a2 = (_amount1 * token2_reserve) / token1_reserve;
        // Calculate the minimum acceptable a2 based on slippage tolerance
        uint minA2 = (_amount2 * (10000 - slippage)) / 10000; // Using 10000 for better precision

        if(a2 >= minA2 && a2 <= _amount2){
            return (_amount1, a2);
        }

        uint a1 = (_amount2 * token1_reserve) / token2_reserve;
        // Calculate the minimum acceptable a1 based on slippage tolerance
        uint minA1 = (_amount1 * (10000 - slippage)) / 10000; // Using 10000 for better precision

        if(a1 >= minA1 && a1 <= _amount1){
            return (a1, _amount2);
        }
    
        revert("Slippage tolerance exceeded, adjust liquidity amounts");
    }

    function addLiquidity(uint _amount1, uint _amount2, uint slippage) external returns(uint shares) {
        //if 0 of either token is supplied, abort
        require(_amount1 >0 && _amount2>0);
        //first check if the passed in # of tokens satisfies the ratio of the reserves (such that price will not change when adding this liquidity)
        if(token1_reserve > 0 || token2_reserve >0 ){
            //if passed amounts don't satisfiy, then find new ratios that do
            if(!(_amount1 * token2_reserve == _amount2 * token1_reserve)){
                (_amount1, _amount2) = calculateNewLiquidityRatios(_amount1, _amount2, slippage);
            }
        }
        //if we make it here then we have found a ratio within slippage range such that we can add liquidity
        token1.transferFrom(msg.sender, address(this), _amount1);
        token2.transferFrom(msg.sender, address(this), _amount2);

        //call into LP Token smart contract to get total supply
        uint current_totalSupply = lptoken.totalSupply();
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
        
        //update reserves after minting 
        updateReserves(
            token1.balanceOf(address(this)),
            token2.balanceOf(address(this))
        );

        //update the current user deposit
        addDeposit(shares);
        return shares;
 
    }

    function removeLiquidity(uint _shareCount) external returns(uint token1Amount, uint token2Amount) {
        uint senderBalance = lptoken.balanceOf(msg.sender);
        require(_shareCount <= senderBalance, "Attempting to burn too many LP Tokens");
        require(deposits[msg.sender].amount> 0 && _shareCount <= deposits[msg.sender].amount, "Too early to withdraw liquidity");

        // require(deposits[msg.sender].amount> 0 && _shareCount <= deposits[msg.sender].amount && deposits[msg.sender].lockPeriodEnd <= block.timestamp, "Too early to withdraw liquidity");
        
        //we want to return amount of liquidity that is proportional to the # of shares this lp provider has
        //enable calling of LpToken smart contract
        
        uint LPTotalSupply = lptoken.totalSupply();
        //transfer correct proportion of reserves to the sender
        uint b1 = token1.balanceOf(address(this));
        uint b2 = token2.balanceOf(address(this));
        token1Amount = b1 * _shareCount / LPTotalSupply;
        token2Amount = b2 * _shareCount / LPTotalSupply;

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);


        //update reserves after burning shared
        updateReserves(
            token1.balanceOf(address(this)),
            token2.balanceOf(address(this))
        );
        minusDeposit(_shareCount);

    }

    
    function minusDeposit(uint shares) private{
        deposits[msg.sender].amount = deposits[msg.sender].amount - shares;

        //burn the LP tokens that the user has redemeed for their share of liquidity pool reserves
        lptoken.burn(msg.sender, shares);
    }  

    function calculateSwap(uint countIn, uint inReserve, uint outReserve) public view returns(uint amountOut){
        //calculate amount of token in (with fee of 0.3%)
        uint countInWithFee = withFee(countIn);
        //dy = ydx / x + dx 
        amountOut =  (outReserve * countInWithFee) / (inReserve + countInWithFee );
    }

    //function to call if you want slippage protection on the swap (i.e you have a minimum amount you want to get from the swap)
    function slippage_swap(address _token, uint countIn, uint slippage_minimum) external validSwap(_token) returns(bool success){
        bool isToken1 = (_token == address(token1));
        (ERC20 tokenIn, ERC20 tokenOut, uint inReserve, uint outReserve ) = isToken1? (token1, token2, token1_reserve, token2_reserve): (token2, token1, token2_reserve, token1_reserve);
        uint amountOut = calculateSwap(countIn, inReserve, outReserve);
        
        //check if the calculated amount output is within the slippage tolerances of the user
        //we require that the on-chain calculation is within {slippage} percentage of the value that was calculated on the client, otherwise we revert the transaction
        require(amountOut >= slippage_minimum, "On-Chain exchange rate is not within slippage bounds set by user");
        tokenIn.transferFrom(msg.sender, address(this), countIn);
        //transfer the 'amountOut' amount of tokens to sender
        tokenOut.transfer(msg.sender, amountOut);
        
        //update the reserves to reflect new balances;
        updateReserves(token1.balanceOf(address(this)), token2.balanceOf(address(this)));
        success = true;

    }


    function swap(address _token, uint countIn) external validSwap(_token) returns(uint amountOut ){
        //check what token we are receiving
        bool isToken1 = (_token == address(token1));
        (ERC20 tokenIn, ERC20 tokenOut, uint inReserve, uint outReserve ) = isToken1? (token1, token2, token1_reserve, token2_reserve): (token2, token1, token2_reserve, token1_reserve);
        if(calculateTimeDiff() || (recent_swaps +1) %2 == 0){
            uint256 newRatio = getChainlinkDataFeedLatestAnswer();
            shiftPoints(newRatio);
            calculateNewSwapFee();
            recent_swaps = 0;
        }
        //swap logic here

        amountOut = calculateSwap(countIn, inReserve, outReserve);
        //transfer the 'inToken' in
        tokenIn.transferFrom(msg.sender, address(this), countIn);
        //transfer the 'amountOut' amount of tokens to sender
        tokenOut.transfer(msg.sender, amountOut);
        //update the reserves to reflect new balances;
        updateReserves(token1.balanceOf(address(this)), token2.balanceOf(address(this)));
        recent_swaps += 1;

    }

}

