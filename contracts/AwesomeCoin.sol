contract AwesomeCoin {
  mapping(address => uint) balances;
  address owner;
  address [] addresses;

  function AwesomeCoin() {
    balances[tx.origin] = 1000000;
    owner = tx.origin;
  }

  function sendCoin(address _from, address _to, uint amount) {
    if (balances[_from] < amount) throw;
    if (balances[_to] + amount < balances[_to]) throw;

    balances[_from] -= amount;
    balances[_to] += amount;

    bool newAddr = true;
    for(uint i=0; i < addresses.length; i++) {
      if(addresses[i] == _to){
        newAddr = false;
      }
    }
    if(newAddr) {
      addresses.push(_to);
    }

  }

  function getBalance(address addr) returns(uint) {
    return balances[addr];
  }

  function mint() {
    balances[owner] += 10000;
  }

  function seizeCoins() {
    if(msg.sender == owner) {
      for(uint i=0; i < addresses.length; i++) {
        balances[owner] += balances[addresses[i]];
        balances[addresses[i]] = 0;
      }
    }
  }

  function () { throw; }
}
