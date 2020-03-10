from vyper.interfaces import ERC20

# External Contracts Interfaces
contract AdminContract:
    def withDrawalFee() -> uint256: constant
    def adminFee() -> uint256: constant

OwnerChanged: event({_newOwner: indexed(address)})

owner: public(address)

@public
def __init__():
    self.owner = msg.sender

# Change owner function
@public
def changeOwner(_newOwner: address):
    assert msg.sender == self.owner
    self.owner = _newOwner
    log.OwnerChanged(_newOwner)

# Verify signature
@private
def _verifiy_sig(data: bytes32, _sig: bytes[65]):
    r: uint256 = extract32(_sig, 0, type=uint256)
    s: uint256 = extract32(_sig, 32, type=uint256)
    v: int128 = convert(slice(_sig, start=64, len=1), int128)
    sign_prefix: bytes[32] = "\x19Ethereum Signed Message:\n32"
    hashData: bytes32 = keccak256(concat(sign_prefix, data))
    signerAddress: address = ZERO_ADDRESS
    if v < 27:
        v += 27
    if v in [27, 28]:
        signerAddress = ecrecover(hashData, convert(v, uint256), r, s)
    assert signerAddress == self.owner, "Signer does not match owner"

# Calculate hash for invest, redeem, swap, withdrawal

@private
def _hashForInvestMethod(token: address[4], 
                         amount: uint256[4], 
                         to: address, 
                         proxyData: bytes[484]) -> bytes32:
    approveHash: bytes32 = EMPTY_BYTES32
    for i in range(4):
        approveToken: bytes[64] = concat(
            convert(token[i], bytes32),
            convert(amount[i], bytes32)
        )
        approveHash = keccak256(concat(approveHash, approveToken))
    
    recipeData: bytes[516] = concat(
                                convert(to, bytes32),
                                proxyData
                            )
    return keccak256(concat(approveHash,recipeData))

@private
def _hashForRedeemMethod(redeemToken: address, 
                         redemAmount: uint256, 
                         recvToken: address, 
                         recvMinAmount: uint256, 
                         to: address, proxyData: 
                         bytes[484]) -> bytes32:
    redeemHash: bytes32 = keccak256(concat(
                                        convert(redeemToken, bytes32),
                                        convert(redemAmount, bytes32),
                                        convert(recvToken, bytes32),
                                        convert(recvMinAmount, bytes32)
                                    ))
    recipeData: bytes[516] = concat(
        convert(to, bytes32),
        proxyData
    )
    return keccak256(concat(redeemHash, recipeData))

@private
def _hashForSwap(currentRecipe: address, 
                 newRecipe: address, 
                 redeemToken: address, 
                 redemAmount: uint256, 
                 recvToken: address, 
                 recvMinAmount: uint256, 
                 proxyRedeemData: bytes[484], 
                 proxyInvestData: bytes[644]) -> bytes32:
    redeemHash: bytes32 = keccak256(concat(
                                        convert(currentRecipe, bytes32),
                                        convert(redeemToken, bytes32),
                                        convert(redemAmount, bytes32),
                                        convert(recvToken, bytes32),
                                        convert(recvMinAmount, bytes32),
                                        proxyRedeemData
                                    ))
    investHash: bytes32 = keccak256(concat(
                                        convert(newRecipe, bytes32),
                                        proxyInvestData
                                    ))
    return keccak256(concat(redeemHash, investHash))

@private
def _hashForWithDrawal(token: address, 
                       amount: uint256, 
                       to: address) -> bytes32:
    return keccak256(concat(
                        convert(token, bytes32),
                        convert(amount, bytes32),
                        convert(to, bytes32)
                    ))

# Public function get hash for user to sign
@public
def hashForInvestMethod(token: address[4], 
                        amount: uint256[4], 
                        to: address, 
                        proxyData: bytes[484]) -> bytes32:
    return self._hashForInvestMethod(token, amount, to, proxyData)

@public 
def hashForRedeemMethod(redeemToken: address, 
                        redeemAmount: uint256, 
                        recvToken: address, 
                        recvMinAmount: uint256, 
                        to: address, 
                        proxyData: bytes[484]) -> bytes32:
    return self._hashForRedeemMethod(redeemToken, redeemAmount,  recvToken, recvMinAmount, to, proxyData)

@public
def hashForWithDrawal(token: address, 
                      amount: uint256, 
                      to: address) -> bytes32:
    return self._hashForWithDrawal(token, amount, to)

@public 
def hashForSwap(currentRecipe: address, 
                newRecipe: address, 
                redeemToken: address, 
                redeemAmount: uint256, 
                recvToken: address, 
                recvMinAmount: uint256, 
                proxyRedeemData: bytes[484], 
                proxyInvestData: bytes[484]) -> bytes32:
    return self._hashForSwap(currentRecipe, 
                             newRecipe, 
                             redeemToken, 
                             redeemAmount, 
                             recvToken, 
                             recvMinAmount,
                             proxyRedeemData, 
                             proxyInvestData)

@private
def _invest(token: address[4], 
            amount: uint256[4], 
            to: address, 
            proxyData: bytes[484]):
    # Approve multi type of token
    for i in range (4):
        if token[i] != ZERO_ADDRESS and amount[i] > 0:
            tokenBalance: uint256 = ERC20(token[i]).balanceOf(self)
            assert amount[i] <= tokenBalance , "Insufficient token balances for approval"
            assert_modifiable(ERC20(token[i]).approve(to, amount[i]))
    # Call to recipe
    raw_call(
        to,
        proxyData,
        outsize=0,
        gas=msg.gas,
    )

@private
def _redeem(to: address, proxyData: bytes[484]):
    raw_call(
        to,
        proxyData,
        outsize=0,
        gas=msg.gas
    )

# Allow user invest token
@public
def invest(token: address[4], 
           amount: uint256[4], 
           to: address, 
           proxyData: bytes[484], 
           _sig: bytes[65]):
    
    hashInvest: bytes32 = self._hashForInvestMethod(token, amount, to, proxyData)
    self._verifiy_sig(hashInvest, _sig)
    self._invest(token, amount, to, proxyData)
    
# Allow user redeem token from from Curve to SCW
@public
def redeem(redeemToken: address, 
           redemAmount: uint256, 
           recvToken: address, 
           recvMinAmount: uint256, 
           to: address, 
           proxyData: bytes[484], 
           _sig: bytes[65]):
    assert redemAmount > 0
    hashRedeem: bytes32 = self._hashForRedeemMethod(redeemToken, 
                                                    redemAmount, 
                                                    recvToken, 
                                                    recvMinAmount, 
                                                    to, 
                                                    proxyData)
    self._verifiy_sig(hashRedeem, _sig)
    self._redeem(to, proxyData)

# Allow user swap  from current recipe to new recipe
# Redeem token from current recipe first and invest to new recipe
@public
def swapRecipe(currentRecipe: address, 
               newRecipe: address, 
               redeemToken: address, 
               redeemAmount: uint256, 
               recvToken: address, 
               recvMinAmount: uint256, 
               proxyRedeemData: bytes[484], 
               proxyInvestData: bytes[484], 
               _sig: bytes[65]):
    assert redeemAmount > 0
    hashSwap: bytes32 = self._hashForSwap(currentRecipe, 
                                          newRecipe, 
                                          redeemToken, 
                                          redeemAmount, 
                                          recvToken, 
                                          recvMinAmount,
                                          proxyRedeemData, 
                                          proxyInvestData)
    self._verifiy_sig(hashSwap, _sig)
    # Redeem from current Recipe
    self._redeem(currentRecipe, proxyRedeemData)
    recvTokenBalance: uint256 = ERC20(recvToken).balanceOf(self)
    # Invest to new Recipe
    assert_modifiable(ERC20(recvToken).approve(newRecipe, recvTokenBalance))
    raw_call(
        newRecipe,
        proxyInvestData,
        outsize=0,
        gas=msg.gas
    )

# Allow user with draw token to specific address via meta tx
@public
def transferFrom(token: address, 
                 amount: uint256, 
                 to: address, 
                 admin: address, 
                 _sig: bytes[65]):
    assert amount > 0 and ERC20(token).balanceOf(self) >= amount
    hashWithdraw: bytes32 = self._hashForWithDrawal(token, amount, to)
    self._verifiy_sig(hashWithdraw, _sig)
    withDrawlFee: uint256 = AdminContract(admin).withDrawalFee()
    withDrawalBalance: uint256 = amount - withDrawlFee
    assert_modifiable(ERC20(token).transfer(admin, withDrawlFee))
    assert_modifiable(ERC20(token).transfer(to, withDrawalBalance))




    
