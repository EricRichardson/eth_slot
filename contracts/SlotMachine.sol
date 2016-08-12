import "AwesomeCoin.sol";

contract SlotMachine {
  address owner;
  AwesomeCoin awesomeCoin;
  string result;

  function SlotMachine(){
    owner = tx.origin;
  }

  function addCoinAddr(address awesomeAddr){
    awesomeCoin = AwesomeCoin(awesomeAddr);
  }

  function deposit(uint amount) {
    awesomeCoin.sendCoin(msg.sender, this, amount);
  }

  function getPot() returns(uint){
    return awesomeCoin.getBalance(this);
  }

  function play(uint wager){
    if (wager > 5) throw;
    deposit(wager);
    uint randNum = uint(sha256(now)) % 1000000;
    if(randNum < 25) {
      result = "Royal Flush";
      payOut(wager * 800);
    } else if (randNum < 134) {
      result = "Straight Flush";
      payOut(wager * 50);
    } else if (randNum < 2497) {
      result = "Four of a Kind";
      payOut(wager * 25);
    } else if (randNum < 14009) {
      result = "Full House";
      payOut(wager * 9);
    } else if (randNum < 25024) {
      result = "Flush";
      payOut(wager * 6);
    } else if (randNum < 36253) {
      result = "Straight";
      payOut(wager * 4);
    } else if (randNum < 110702) {
      result = "Three of a Kind";
      payOut(wager * 3);
    } else if (randNum < 239981) {
      result = "Two Pair";
      payOut(wager * 2);
    } else if (randNum < 454566) {
      result = "Jacks or Better";
      payOut(wager);
    } else {
      result = "No Hand";
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
