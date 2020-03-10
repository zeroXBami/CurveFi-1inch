from vyper.interfaces import ERC20

AdminFeeChanged: event({newAdmiFee: indexed(int128), time: timestamp})
WithDrawalFeeChanged: event({newWithDrawalFee: indexed(int128), time: timestamp})

owner: public(address)
adminFee: public(int128)
withDrawalFee: public(int128)

# Constructor
@public
def __init__():
    self.owner = msg.sender

# Admin function
@public
def changeAdminFee(_newAdmiFee: int128):
    assert msg.sender == self.owner, "Only owner can change fee"
    self.adminFee = _newAdmiFee
    log.AdminFeeChanged(_newAdmiFee, block.timestamp)

@public
def changeWithDrawalFee(_newWithDrawalFee: int128):
    assert msg.sender == self.owner, "Only owner can change fee"
    self.withDrawalFee = _newWithDrawalFee
    log.WithDrawalFeeChanged(_newWithDrawalFee, block.timestamp)

@public
def adminWithDrawal(token: address, amount: uint256, to: address):
    assert msg.sender == self.owner, "Only owner can withdraw"
    assert ERC20(token).balanceOf(self) >= amount
    assert_modifiable(ERC20(token).transfer(to, amount))
