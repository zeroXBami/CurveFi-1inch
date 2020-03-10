from vyper.interfaces import ERC20

# External Contracts Interfaces
contract IyCurveFi:
    def get_dy(i: int128, j: int128, dx: uint256) -> uint256: constant
    def add_liquidity(amounts: uint256[4], min_mint_amount: uint256): modifying
    def remove_liquidity(_amount: uint256, min_amounts: uint256[4]): modifying

# External Contracts
contract yERC20:
    def totalSupply() -> uint256: constant
    def allowance(_owner: address, _spender: address) -> uint256: constant
    def transfer(_to: address, _value: uint256) -> bool: modifying
    def transferFrom(_from: address, _to: address, _value: uint256) -> bool: modifying
    def approve(_spender: address, _value: uint256) -> bool: modifying
    def name() -> string[64]: constant
    def symbol() -> string[32]: constant
    def decimals() -> uint256: constant
    def balanceOf(arg0: address) -> uint256: constant
    def deposit(depositAmount: uint256): modifying
    def withdraw(withdrawTokens: uint256): modifying
    def getPricePerFullShare() -> uint256: constant


# Events
Paused: event({time: indexed(timestamp)})
UnPaused: event({time: indexed(timestamp)})
Invest: event({scw: indexed(address), investToken: address, investAmount: uint256, recvToken: address, recvAmount: uint256})
Redeem:event({scw: indexed(address), redeemToken:address, redeemAmount: uint256, revToken: address, recvAmount: uint256})
# Constant
CurveFi_ADDR: constant(address) = 0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51
USDC_ADDR: constant(address) = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
DAI_ADDR: constant(address) = 0x6B175474E89094C44Da98b954EedeAC495271d0F
cUSDC_ADDR: constant(address) = 0x39AA39c021dfbaE8faC545936693aC917d5E7563
cDAI_ADDR: constant(address) = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643
yDAI_ADDR: constant(address) = 0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01
yUSDC_ADDR: constant(address) = 0xd6aD7a6750A7593E092a9B218d66C0A814a3436e
yUSDT_ADDR: constant(address) = 0x83f798e925BcD4017Eb265844FDDAbb448f1707D
yTUSD_ADDR: constant(address) = 0x73a052500105205d34Daf004eAb301916DA8190f
curvePoolToken_ADDR: constant(address) = 0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8
ZERO256: constant(uint256) = 0
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

@private
def _depositToYToken(yToken: address, depositAmount: uint256):
    yERC20(yToken).deposit(depositAmount)

# Deposit yToken to Curve [yDAI, yUSDC, yUSDT, yTUSD]
@private
def _addLiquidityToCurve(amounts: uint256[4], min_mint_amount: uint256):
    IyCurveFi(CurveFi_ADDR).add_liquidity(amounts, min_mint_amount)

# Redeem yToken from Curve
@private
def _removeLiquidityFromCurve(amount: uint256):
    IyCurveFi(CurveFi_ADDR).remove_liquidity(amount , [0, 0, 0, 0])

# DAI USDC
@public
def investDAIUSDC(token: address, 
                  amount: uint256):
    assert self.isPaused == False
    assert token != ZERO_ADDRESS and amount > 0
    assert_modifiable(yERC20(token).transferFrom(msg.sender, self, amount))
    prevCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    prevYDAIBalance: uint256 = yERC20(yDAI_ADDR).balanceOf(self)
    prevYUSDCBalance: uint256 = yERC20(yUSDC_ADDR).balanceOf(self)

    addYDAIAmount: uint256 = 0
    addYUSDCAmount: uint256 = 0
    addYUSDTAmount: uint256 = 0
    addYTUSDAmount: uint256 = 0

    if token == DAI_ADDR:
        assert_modifiable(ERC20(DAI_ADDR).approve(yDAI_ADDR, amount))
        self._depositToYToken(yDAI_ADDR, amount)
    elif token == USDC_ADDR:
        assert_modifiable(ERC20(USDC_ADDR).approve(yUSDC_ADDR, amount))
        self._depositToYToken(yUSDC_ADDR, amount)
    postYDAIBalance: uint256 = yERC20(yDAI_ADDR).balanceOf(self)
    postYUSDCBalance: uint256 = yERC20(yUSDC_ADDR).balanceOf(self)
    addYDAIAmount = postYDAIBalance - prevYDAIBalance
    addYUSDCAmount = postYUSDCBalance - prevYUSDCBalance
    assert_modifiable(yERC20(yDAI_ADDR).approve(CurveFi_ADDR, addYDAIAmount)) 
    assert_modifiable(yERC20(yUSDC_ADDR).approve(CurveFi_ADDR, addYUSDCAmount)) 
    assert_modifiable(yERC20(yUSDC_ADDR).approve(CurveFi_ADDR, 0)) 
    assert_modifiable(yERC20(yTUSD_ADDR).approve(CurveFi_ADDR, 0))
    self._addLiquidityToCurve([
        postYDAIBalance - prevYDAIBalance,
        postYUSDCBalance - prevYUSDCBalance,
        ZERO256, ZERO256
    ], 0)
    
    postCurvePoolBalance: uint256 = ERC20(curvePoolToken_ADDR).balanceOf(self)
    self.balances[msg.sender] = postCurvePoolBalance - prevCurvePoolBalance

@public
def transferFrom(token: address):
    assert msg.sender == self.owner, "Only owner can transfer"
    qty: uint256 = ERC20(token).balanceOf(self)
    assert_modifiable(ERC20(token).transfer(msg.sender,qty))