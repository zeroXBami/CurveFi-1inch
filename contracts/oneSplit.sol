pragma solidity ^0.5.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract oneSplit {

    address public owner;
    mapping (address => mapping(address=>uint256)) public tokenRates;
    uint256 public balance;
    constructor() public {
        owner = msg.sender;
    }

    function setTokenRates(address from, address to, uint256 rate) public returns(bool) {
        require(msg.sender == owner);
        tokenRates[from][to] = rate;
    }

   function swap(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minReturn,
        uint256[] memory distribution, 
        uint256 disableFlags
    )
        public
        payable {
            IERC20(fromToken).transferFrom(msg.sender, address(this), amount);
            uint256 trasnferAmount = amount * tokenRates[address(fromToken)][address(toToken)];
           IERC20(toToken).transfer(msg.sender, trasnferAmount);
        }

    function getExpectedReturn(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 amount,
        uint256 parts,
        uint256 disableFlags // 1 - Uniswap, 2 - Kyber, 4 - Bancor, 8 - Oasis, 16 - Compound, 32 - Fulcrum, 64 - Chai, 128 - Aave, 256 - SmartToken
    )
        public
        view
        returns(
            uint256 returnAmount,
            uint256[] memory distribution // [Uniswap, Kyber, Bancor, Oasis]
        ) {
            if (fromToken == toToken) {
                return (amount, new uint256[](4));
            }
            uint256 exchangeAmount =  tokenRates[address(fromToken)][address(toToken)] * amount;
            return (exchangeAmount, new uint256[](4));
        }
}