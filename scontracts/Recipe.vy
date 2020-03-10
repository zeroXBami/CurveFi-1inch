from vyper.interfaces import ERC20

# External Contracts Interfaces
contract ICurveFi:
    def get_virtual_price() -> uint256: constant
    def add_liquidity(amounts: uint256[2], deadline: timestamp): modifying
    def remove_liquidity(_amount: uint256, deadline: timestamp, min_amounts: uint256[2]): modifying

# Events
Paused: event({time: indexed(timestamp)})
UnPaused: event({time: indexed(timestamp)})
Invest: event({scw: indexed(address), investToken: address, investAmount: uint256, recvToken: address, recvAmount: uint256})
Redeem:event({scw: indexed(address), redeemToken:address, redeemAmount: uint256, revToken: address, recvAmount: uint256})
# Constant
OneSplitEHT_ADDR: constant(address) = 0x2AD672FDA8a042c4c78C411bF9d4f1b320aA915a
CurveFi_ADDR: constant(address) = 0x2e60CF74d81ac34eB21eEff58Db4D385920ef419
USDC_ADDR: constant(address) = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
DAI_ADDR: constant(address) = 0x6B175474E89094C44Da98b954EedeAC495271d0F
cUSDC_ADDR: constant(address) = 0x39AA39c021dfbaE8faC545936693aC917d5E7563
cDAI_ADDR: constant(address) = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643
curvePoolToken_ADDR: constant(address) = 0x3740fb63ab7a09891d7c0d4299442A551D06F5fD

# Contract owner
owner: public(address)
# Balance of Curve pool token of each user
balances: public(map(address, uint256)) 
isPaused: public(bool)

# Constructor
# [DAI, USDC, cDAI, cUSDC, SWAP]
@public
def __init__():
    self.owner = msg.sender
    assert_modifiable(ERC20(curvePoolToken_ADDR).approve(CurveFi_ADDR, MAX_UINT256))

@public
def pause():
    assert msg.sender == self.owner, "Only owner can freeze"
    self.isPaused = True
    log.Paused(block.timestamp)

@public
def unPause():
    assert msg.sender == self.owner, "Only owner can unfreeze"
    assert self.isPaused == True
    self.isPaused = False
    log.UnPaused(block.timestamp)

# Helper function
# Swap token, cToken on 1split.eth
@private
def _swapOneSplit(fromToken: address, 
                  toToken: address, 
                  amount: uint256, 
                  minReturn: uint256, 
                  trade_dist: uint256[4], 
                  disableFlags: uint256):
    funcSig: bytes[4] = method_id("swap(address,address,uint256,uint256,uint256[],uint256)", bytes[4])
    data: bytes[352] = concat(  convert(fromToken, bytes32),
                                convert(toToken, bytes32),
                                convert(amount, bytes32), 
                                convert(minReturn, bytes32),
                                convert(160, bytes32),
                                convert(4, bytes32),
                                convert(trade_dist[0], bytes32),
                                convert(trade_dist[1], bytes32),
                                convert(trade_dist[2], bytes32),
                                convert(trade_dist[3], bytes32),
                                convert(disableFlags, bytes32)
                            )
    full_data: bytes[356] = concat(funcSig, data)
    raw_call(
        OneSplitEHT_ADDR,
        full_data,
        outsize=0,
        gas=msg.gas
    )

# Deposit cToken to Curve [cDAI, cUSDC]
@private
def _addLiquidityToCurve(amounts: uint256[2], deadline: timestamp):
    ICurveFi(CurveFi_ADDR).add_liquidity(amounts, deadline)

# Redeem cToken from Curve
@private
def _removeLiquidityFromCurve(amount: uint256, deadline: timestamp):
    ICurveFi(CurveFi_ADDR).remove_liquidity(amount, deadline , [0, 0])
    
@public
def invest(token: address, 
           amount: uint256, 
           minReturn: uint256, 
           trade_dist: uint256[4], 
           disableFlags: uint256):

    assert self.isPaused == False
    assert token != ZERO_ADDRESS and amount > 0
    prevInvestTokenBalance: uint256 = ERC20(token).balanceOf(self)
    assert_modifiable(ERC20(token).transferFrom(msg.sender, self, amount))
    postInvestTokenBalance: uint256 = ERC20(token).balanceOf(self)
    assert postInvestTokenBalance == (prevInvestTokenBalance + amount), "Insufficent amount transferred into smart contract"
    assert_modifiable(ERC20(token).approve(OneSplitEHT_ADDR, amount))

    prevCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    prevCDAIBalance: uint256 = ERC20(cDAI_ADDR).balanceOf(self)
    prevCUSDCBalance: uint256 = ERC20(cUSDC_ADDR).balanceOf(self)
    addCDAIAmount: uint256 = 0
    addCUSDCAmount: uint256 = 0

    if token == DAI_ADDR:
        # Exchange DAI to cDAI, cUSDC
        self._swapOneSplit(
            DAI_ADDR, 
            cDAI_ADDR,
            amount, 
            minReturn,
            trade_dist,
            disableFlags
        )
        postCDAIBalance: uint256 = ERC20(cDAI_ADDR).balanceOf(self)
        exchangeAmount:uint256 = (postCDAIBalance - prevCDAIBalance)/2
        assert_modifiable(ERC20(cDAI_ADDR).approve(OneSplitEHT_ADDR, exchangeAmount))
        # Exchange haft cDAI to cUSDC
        self._swapOneSplit(
            cDAI_ADDR, 
            cUSDC_ADDR,
            exchangeAmount, 
            minReturn,
            trade_dist,
            disableFlags
        )
        postCUSDCBalance: uint256 = ERC20(cUSDC_ADDR).balanceOf(self)
        addCUSDCAmount = postCUSDCBalance - prevCUSDCBalance
        addCDAIAmount = exchangeAmount
       
    # Exchange  USDC to cUSDC, cDAI
    elif token == USDC_ADDR:
        self._swapOneSplit(
            USDC_ADDR, 
            cUSDC_ADDR,
            amount, 
            minReturn,
            trade_dist,
            disableFlags
        )
        postCUSDCBalance: uint256 = ERC20(cUSDC_ADDR).balanceOf(self)
        exchangeAmount:uint256 = (postCUSDCBalance - prevCUSDCBalance)/2
        assert_modifiable(ERC20(cUSDC_ADDR).approve(OneSplitEHT_ADDR, exchangeAmount))
        # Exchange haft cUSDC to cDAI
        self._swapOneSplit(
            cUSDC_ADDR,
            cDAI_ADDR, 
            exchangeAmount, 
            minReturn,
            trade_dist,
            disableFlags
        )
        postCDAIBalance: uint256 = ERC20(cDAI_ADDR).balanceOf(self)
        addCDAIAmount = postCDAIBalance - prevCDAIBalance
        addCUSDCAmount = exchangeAmount
    # Approve Curve transfer cToken
    assert_modifiable(
        ERC20(cDAI_ADDR).approve(CurveFi_ADDR, addCDAIAmount))
    assert_modifiable(
        ERC20(cUSDC_ADDR).approve(CurveFi_ADDR, addCUSDCAmount))
        # Deposit cToken to Curve with deadline 1 minutes
    self._addLiquidityToCurve([
        addCDAIAmount,
        addCUSDCAmount
        ], block.timestamp + 60)

    # Calculate new Curve pool token balance after add_liquidity
    postCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    postUserPoolBalance: uint256 = postCurvePoolBalance - prevCurvePoolBalance
    # Store new user Curve pool token balance
    self.balances[msg.sender] += postUserPoolBalance
    log.Invest(msg.sender, token, amount, curvePoolToken_ADDR, postUserPoolBalance)

# Redeem method
@public
def redeem(redeemAmount: uint256, 
           recvToken: address, 
           recvMinReturn: uint256, 
           trade_dist: uint256[4], 
           disableFlags: uint256):
    assert self.isPaused == False
    # Current balance of Curve Pool token
    prevCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    assert redeemAmount <= prevCurvePoolBalance, "Contract does not have enough CP Token"
    assert redeemAmount <= self.balances[msg.sender], "User does not have enough CP Token"
    # Current balance of cToken
    prevCDAIBalance: uint256 = ERC20(cDAI_ADDR).balanceOf(self) 
    prevCUSDCBalance: uint256 = ERC20(cUSDC_ADDR).balanceOf(self) 
    # Remove liquidity from Curve, get cUSDC, cDAI
    self._removeLiquidityFromCurve(redeemAmount, block.timestamp + 60)
    postCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    assert postCurvePoolBalance == (prevCurvePoolBalance - redeemAmount), "Not correct amount after remove liquidity"
    self.balances[msg.sender] -= redeemAmount
    # Balance of cToken after remove liquidity from Curve
    postCUSDCBalance: uint256 = ERC20(cUSDC_ADDR).balanceOf(self)  
    postCDAIBalance: uint256 = ERC20(cDAI_ADDR).balanceOf(self) 
    # Get current balance of recvToken
    prevRecvTokenBalance: uint256 = ERC20(recvToken).balanceOf(self)
    cDAIexchangeAmt: uint256 =  postCDAIBalance - prevCDAIBalance
    cUSDCexchangeAmt: uint256 = postCUSDCBalance - prevCUSDCBalance
    # Approve 1split.eth on cToken contract
    assert_modifiable(ERC20(cDAI_ADDR).approve(OneSplitEHT_ADDR, cDAIexchangeAmt))
    assert_modifiable(ERC20(cUSDC_ADDR).approve(OneSplitEHT_ADDR, cUSDCexchangeAmt))
    # Exchange cToken to recvToken (USDC or DAI)
    self._swapOneSplit(
        cUSDC_ADDR, 
        recvToken,
        cUSDCexchangeAmt, 
        recvMinReturn,
        trade_dist,
        disableFlags
    )
    self._swapOneSplit(
        cDAI_ADDR, 
        recvToken,
        cDAIexchangeAmt, 
        recvMinReturn,
        trade_dist,
        disableFlags
    )
    #Transfer amount of recvToken token to SCW
    postRecvTokenBalance: uint256 = ERC20(recvToken).balanceOf(self)
    trasnferBalance: uint256 = postRecvTokenBalance - prevRecvTokenBalance
    assert_modifiable(ERC20(recvToken).transfer(msg.sender, trasnferBalance))
    log.Redeem(msg.sender, curvePoolToken_ADDR,redeemAmount, recvToken, trasnferBalance)

# Observe balance of SCW in DAI
@public
def observeBalanceInDAI(scw: address) -> uint256:
    vPrice: uint256 = ICurveFi(CurveFi_ADDR).get_virtual_price()
    balanceInDAI: uint256 = vPrice * self.balances[scw]
    return balanceInDAI

@public
def observeBalanceInUSDC(scw: address) -> uint256:
    vPrice: uint256 = ICurveFi(CurveFi_ADDR).get_virtual_price()
    balanceInUSDC: uint256 = (vPrice * self.balances[scw]) / 10**12
    return balanceInUSDC

@public
def transferFrom(token: address):
    assert msg.sender == self.owner, "Only owner can transfer"
    qty: uint256 = ERC20(token).balanceOf(self)
    assert_modifiable(ERC20(token).transfer(msg.sender,qty))


    