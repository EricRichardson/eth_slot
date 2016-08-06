var accounts;
var account;
var balance;

function getGreeting() {
  var test = Test.deployed();
  test.greeting().then(function(value){
    alert(value);
  });
}

function sendCoin(){
  var awesome = AwesomeCoin.deployed();
  var amount = parseInt(document.getElementById("amount").value);
  var _from = account;
  var _to = document.getElementById("to").value;

  awesome.sendCoin(_from, _to, amount, {from: account}).then(function() {
    refreshBalances();
    return;
  }).catch(function(e){
    console.log(e);
    return;
  })
}

function mint(){
  var awesome = AwesomeCoin.deployed();
  awesome.mint({from: account}).then(function(response){
    console.log("Coins minted", response);
    return refreshBalances();
  }).catch(function(e){
    console.log(e);
  })
}

function seizeCoins(){
  var awesome = AwesomeCoin.deployed();
  awesome.seizeCoins({from: account}).then(function(){
    return refreshBalances();
  });
}

function refreshBalances(){
  var awesome = AwesomeCoin.deployed();
  var result = "";

  accounts.forEach(function(acc){
    awesome.getBalance.call(acc, {from: acc})
    .then(function(balance){
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




function deposit() {
  var slot = SlotMachine.deployed();
  var awesome = AwesomeCoin.deployed();
  var addr = String(awesome.address);
  var amount = parseInt(document.getElementById("deposit").value);
  console.log(awesome.address);

  slot.deposit(addr, amount, {from: account});
}

function getPot(){
  var slot = SlotMachine.deployed();
  var pot = slot.getPot();
  document.getElementById("pot").innerHTML = pot;
}


window.onload = function() {
  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    accounts = accs;
    account = accounts[0];
    refreshBalances();
  });
}
