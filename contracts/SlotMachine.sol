import "AwesomeCoin.sol";

contract SlotMachine {
  address owner;
  AwesomeCoin awesomeCoin;
  uint jackpot;

  function SlotMachine(){
    owner = tx.origin;
  }

  function deposit(address awesomeAddr, uint amount) {
    awesomeCoin = AwesomeCoin(awesomeAddr);
    awesomeCoin.sendCoin(msg.sender, this, amount);
    jackpot = awesomeCoin.getBalance(this);
  }

  function getPot() returns(uint){
    return jackpot;
  }

  function result() returns(uint){
    uint randNum = uint(sha256(now)) % 1000000;
    if(randNum < 25) {
      /*800 times*/
    } else if (randNum < 134) {
      /*50*/
    } else if (randNum < 2497) {
      /*25*/
    } else if (randNum < 14009) {
      /*9*/
    } else if (randNum < 25024) {
      /*6*/
    } else if (randNum < 36253) {
      /*4*/
    } else if (randNum < 110702) {
      /*3*/
    } else if (randNum < 239981) {
      /*2*/
    } else if (randNum < 454566) {
      /*1*/
    } else {
      /*0*/
    }
  }

  function payOut(address _to, uint amount) {

  }

  function() { throw; }
}
