import "AwesomeCoin.sol";

contract SlotMachine {
  address owner;
  uint jackpot;

  function SlotMachine(){
    owner = tx.origin;
  }

  function deposit(address awesomeAddr, uint amount) {
    AwesomeCoin a = AwesomeCoin(awesomeAddr);
    a.sendCoin(msg.sender, this, amount);
    jackpot = a.getBalance(this);
  }

  function getPot() returns(uint){
    return jackpot;
  }

  function() { throw; }
}
