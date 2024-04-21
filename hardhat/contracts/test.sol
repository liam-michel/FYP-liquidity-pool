// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer{
    //AggregatorV3Interface internal dataFeed;

    uint public reserve1 = 0;
    uint public reserve2 = 0;
    uint immutable precision = 1e18;
    uint immutable baseFee = 3 * 10**15 ;//0.3% fee for each trade
    uint[] private dataPoints;
    uint lastCheckTime = block.timestamp;

    constructor(){
        //dataFeed = AggregatorV3Interface(0x42585eD362B3f1BCa95c640FdFf35Ef899212734);
    }


    function calculateSwap(uint countIn) internal view returns(uint amountOut){
        //calculate the fee for this trade
        
        //calculate amount of token in (with fee of 0.3%)
        uint countInWithFee = (countIn * 997) / 1000;
        //dy = ydx / x + dx 
        amountOut =  (reserve2 * countInWithFee) / (reserve1 + countInWithFee );
    }


    //CURRENTLY USING LINK/ETH PRICE FEED
    function getChainlinkDataFeedLatestAnswer() public pure returns (uint256) {
        // (
        //     /* uint80 roundID */,
        //     int answer,
        //     /*uint startedAt*/,
        //     /*uint timeStamp*/,
        //     /*uint80 answeredInRound*/
        // ) = dataFeed.latestRoundData();
        // return answer;
        return uint256(2000000000000000000);
        //return uint256(5058822323789223);
    }

    function setReserve1(uint _reserve1) public  returns(uint){
        reserve1 = _reserve1;
        return reserve1;
    }

    function setReserve2(uint _reserve2) public  returns(uint){
        reserve2 = _reserve2;
        return reserve2;
    }

    function getReserveRatio() public view returns(uint){  
        require(reserve1> 0 && reserve2 > 0 );
        uint ratio = (reserve1 * precision) / reserve2;
        return ratio;

    }

    function withFee(uint amount) public pure returns(uint){
        uint minusFee = amount * (10**18 - (baseFee * 10**15) / 10**18);
        return minusFee;
    }
    

    //tA / tB should be == the price feed
    function calculateNewSwapFee() public view returns(string memory){
        require(reserve1 > 0 && reserve2 > 0);
        uint256 chainlinkRatio = uint256(getChainlinkDataFeedLatestAnswer());
        uint ratio = getReserveRatio();

        uint upperBound = ratio * 1005 / 1000; // Multiply by 1.05 but adjusted for solidity's lack of decimal
        uint lowerBound = ratio * 995 / 1000;  // Multiply by 0.95 adjusted for solidity

        if(chainlinkRatio >= lowerBound && chainlinkRatio <= upperBound){
            return "Within ratio";
        }else{
            return "Not within ratio";
        }
    
    }

    //function to calculate the time since last chainlink ratio fetch
    function calculateTimeDiff() private view returns(bool){
        if(lastCheckTime - block.timestamp > 1 minutes){
            return true;
        }
        return false;
    }

    function calculateSMA() private view returns(uint256){
        require(dataPoints.length>0);
        uint sum = 0;
        for(uint i= 0; i < dataPoints.length; i++){
            sum += dataPoints[i];
        }
        return sum / dataPoints.length;
    }


    //function for shifting the points in the array back
    function shiftPoints(uint length, uint point) private returns(uint256){
        if(length<5){
            dataPoints.push(point);
        }
        else{
            for(uint i=0; i < dataPoints.length -1; i ++){
                dataPoints[i] = dataPoints[i+1];
            }
            dataPoints[dataPoints.length-1] = point;
        }
        return calculateSMA();
    }

    function calculatePercentageDifference(uint256 num1, uint256 num2) public pure returns (uint256) {
        require(num2 != 0, "Cannot divide by zero");
        uint256 difference = (num1 > num2) ? (num1 - num2) : (num2 - num1);
        uint256 percentage = (difference * 100) / num2;
        return percentage;
    }


   // function swap(uint amount) public view returns(uint[] memory points){
        //if(calculateTimeDiff()){
            //uint256 newChainlinkRatio = getChainlinkDataFeedLatestAnswer();
            //uint average_ratio = shiftPoints(dataPoints.length, newChainlinkRatio);
            //uint return_amount = calculateSwap(amount);

        //}

       // return dataPoints;
    //}



}
//000000000000000000