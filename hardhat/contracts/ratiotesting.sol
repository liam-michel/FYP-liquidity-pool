contract Ratios{
  uint reserve1 = 1e18;
  uint reserve2 = 2e18;
  uint precision = 1e18;

  function calculateRatio() public view returns(uint){
    uint ratio = (reserve1 * precision) / reserve2;
    return ratio;
  }
}