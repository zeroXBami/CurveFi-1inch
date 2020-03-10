from vyper.interfaces import ERC20

# Rates: 1 cUSDC = 100 swapToken, 1 cDAI = 200 swapToken
rates: constant(uint256[2]) = [convert(200, uint256), convert(100, uint256)]
# 1 cDAI = 2 cUSDC 
rateCToken: constant(uint256) = convert(2, uint256)
swapToken: public(address)
owner: public(address)
coins: public(address[2])
is_killed: bool

@public
def __init__(_swapToken: address, _coins: address[2]):
    self.owner = msg.sender
    self.swapToken = _swapToken
    self.coins = _coins

# 0,1 ->   price cDAI in cUSDC
# 1,0 -> price cUSDC in cDAI
@public
@constant
def get_dy(i: int128, j: int128, dx: uint256) -> uint256:
    if i == 0 and j == 1:
        return dx * rateCToken
    return dx / rateCToken

@public
def add_liquidity(amounts: uint256[2], deadline: timestamp):
    # Amounts is amounts of c-tokens
    assert block.timestamp <= deadline, "Transaction expired"
    assert not self.is_killed
    swapTokenTransfer: uint256 = 0
    _rate: uint256[2] = rates
    for i in range(2):
        swapTokenTransfer += (amounts[i] * _rate[i])
        assert_modifiable(ERC20(self.coins[i]).transferFrom(msg.sender, self, amounts[i]))
    assert_modifiable(ERC20(self.swapToken).transfer(msg.sender, swapTokenTransfer))

@public
def remove_liquidity(_amount: uint256, deadline: timestamp, min_amounts: uint256[2]):
    # Amounts is amounts of c-tokens
    assert block.timestamp <= deadline, "Transaction expired"
    assert not self.is_killed
    assert_modifiable(ERC20(self.swapToken).transferFrom(msg.sender, self, _amount))
    cTokenTransfer: uint256[2] = [0, 0]
    exchangeAmount:uint256 = _amount/2
    _rate: uint256[2] = rates
    for i in range(2):
        cTokenTransfer[i] = exchangeAmount/_rate[i]
        assert_modifiable(ERC20(self.coins[i]).transfer(msg.sender, cTokenTransfer[i]))