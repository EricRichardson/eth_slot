function sendCoin() {
  var awesome = AwesomeCoin.deployed();
  var amount = parseInt(document.getElementById("amount").value);
  document.getElementById("amount").value = '';
  var _from = account;
  var _to = document.getElementById("to").value;
  document.getElementById("to").value = '';

  awesome.sendCoin(_from, _to, amount, {from: account});
  refreshBalances();
}

function mint() {
  var awesome = AwesomeCoin.deployed();
  awesome.mint({from: account});
  refreshBalances();
}

function seizeCoins() {
  var awesome = AwesomeCoin.deployed();
  awesome.seizeCoins({from: account})
  .then(function() {
    return refreshBalances();
  })
  .catch(function(e) {
    console.log(e);
  });
}

function refreshBalances() {
  var awesome = AwesomeCoin.deployed();
  var result = "";

  accounts.forEach(function(acc) {
    awesome.getBalance.call(acc, {from: acc})
    .then(function(balance) {
      result += ("<div class='account'>" + acc + ": " + balance + "</div>");
      return result;
    })
    .then(function(result){
      document.getElementById('balances').innerHTML = result;
    })
    .catch(function(e){
      console.log(e);
      return;
    })
  });
}
