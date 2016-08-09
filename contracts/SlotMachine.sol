import "AwesomeCoin.sol";

contract SlotMachine {
  address owner;
  AwesomeCoin awesomeCoin;
  uint jackpot;
  string result;

  function SlotMachine(){
    owner = tx.origin;
  }

  function addCoinAddr(address awesomeAddr){
    awesomeCoin = AwesomeCoin(awesomeAddr);
  }

  function deposit(uint amount) {
    awesomeCoin.sendCoin(msg.sender, this, amount);
    jackpot = awesomeCoin.getBalance(this);
  }

  function getPot() returns(uint){
    return jackpot;
  }

  function play(){
    uint randNum = uint(sha256(now)) % 1000000;
    if(randNum < 25) {
      result = "Royal Flush";
      payOut(800);
    } else if (randNum < 134) {
      result = "Straight Flush";
      payOut(50);
    } else if (randNum < 2497) {
      result = "Four of a Kind";
      payOut(25);
    } else if (randNum < 14009) {
      result = "Full House";
      payOut(9);
    } else if (randNum < 25024) {
      result = "Flush";
      payOut(6);
    } else if (randNum < 36253) {
      result = "Straight";
      payOut(4);
    } else if (randNum < 110702) {
      result = "Three of a Kind";
      payOut(3);
    } else if (randNum < 239981) {
      result = "Two Pair";
      payOut(2);
    } else if (randNum < 454566) {
      result = "Jacks or Better";
    } else {
      result = "You lost";
      deposit(1);
    }
  }

  function getResult() returns(string){
    return result;
  }

  function payOut(uint amount) {
    awesomeCoin.sendCoin(this, tx.origin, amount);
  }

  function() { throw; }
}
