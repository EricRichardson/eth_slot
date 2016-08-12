var accounts;
var account;
var balance;
var pot;

var royalFlush = new Image();
royalFlush.src = 'images/royal_flush.png';

// Awesome Coin

function sendCoin(){
  var awesome = AwesomeCoin.deployed();
  var amount = parseInt(document.getElementById("amount").value);
  document.getElementById("amount").value = '';
  var _from = account;
  var _to = document.getElementById("to").value;
  document.getElementById("to").value = '';

  awesome.sendCoin(_from, _to, amount, {from: account});
  refreshBalances();
}

function mint(){
  var awesome = AwesomeCoin.deployed();
  awesome.mint({from: account});
  refreshBalances();
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

// Slot Machine

function deposit() {
  var slot = SlotMachine.deployed();
  var amount = parseInt(document.getElementById("deposit").value);
  document.getElementById("deposit").value = '';

  slot.deposit(amount, {from: account});
  getPot();
  refreshBalances();
}

function getPot(){
  var slot = SlotMachine.deployed();
  slot.getPot.call({from: account}).then(function(current_pot){
    pot = current_pot;
    document.getElementById("pot").innerHTML = pot;
  });
}

function play(){
  var slot = SlotMachine.deployed();
  var wager = document.querySelector('input[name="wager"]:checked').value;
  slot.play(wager, {from: account});
  slot.getResult.call({from: account}).then(function(result){
    document.getElementById("result").innerHTML = result;
    displayHand(result);
  })
  refreshBalances();
  getPot();
}

function displayHand(hand){
  var wager = document.querySelector('input[name="wager"]:checked').value;
  if (hand == "Royal Flush") {
    var src = "images/royal_flush.png";
    var message = "You won " + (wager * 800) + " coins";
  } else if (hand == "Straight Flush") {
    var src = "images/straight_flush.png";
    var message = "You won " + (wager * 50) + " coins";
  } else if (hand == "Four of a Kind") {
    var src = "images/four_kind.png";
    var message = "You won " + (wager * 25) + " coins";
  } else if (hand == "Full House") {
    var src = "images/full_house.png";
    var message = "You won " + (wager * 9) + " coins";
  } else if (hand == "Flush") {
    var src = "images/flush.png";
    var message = "You won " + (wager * 6) + " coins";
  } else if (hand == "Straight") {
    var src = "images/straight.png";
    var message = "You won " + (wager * 4) + " coins";
  } else if (hand == "Three of a Kind") {
    var src = "images/three_kind.png";
    var message = "You won " + (wager * 3) + " coins";
  } else if (hand == "Two Pair") {
    var src = "images/two_pair.png";
    var message = "You won " + (wager * 2) + " coins";
  } else if (hand == "Jacks or Better") {
    var src = "images/pair.png";
    var message = "You won your wager back";
  } else {
    var src = "images/nothing.png";
    var message = "You lost your wager";
  }

  document.getElementById("hand").innerHTML = '<img src="' + src + '"/>';
  document.getElementById("message").innerHTML = message;
}

function initializeSlot(){
  var awesome = AwesomeCoin.deployed();
  var slot = SlotMachine.deployed();
  slot.addCoinAddr(awesome.address, {from: account});
  console.log("Coin address set at: " + awesome.address);
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
    initializeSlot();
    refreshBalances();
    getPot();
  });
}

function toggleOdds() {
  var table = document.getElementById("odds");
  var button = document.getElementById("toggleOdds")
  if ( table.className.match(/(?:^|\s)hide(?!\S)/)) {
    table.className = table.className.replace(/(?:^|\s)hide(?!\S)/g , '');
    button.innerHTML = "Hide Odds";
  } else {
    table.className += "hide";
    button.innerHTML = "Show Odds";
  }
}
