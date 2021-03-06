document.getElementById("wager").addEventListener("click", function() {
  checkPot();
})

function initializeSlot() {
  var awesome = AwesomeCoin.deployed();
  var slot = SlotMachine.deployed();
  slot.addCoinAddr(awesome.address, {from: account});
  console.log("Coin address set at: " + awesome.address);
}

function deposit() {
  var slot = SlotMachine.deployed();
  var amount = parseInt(document.getElementById("deposit").value);
  document.getElementById("deposit").value = '';
  slot.deposit(amount, {from: account});
  getPot();
  checkPot();
  refreshBalances();
}

function getPot() {
  var slot = SlotMachine.deployed();
  slot.getPot.call({from: account})
  .then(function(current_pot) {
    pot = current_pot;
    document.getElementById("pot").innerHTML = pot;
  })
  .catch(function(e) {
    console.log(e);
  });
}

function play() {
  var slot = SlotMachine.deployed();
  var wager = document.querySelector('input[name="wager"]:checked').value;
  slot.play(wager, {from: account});
  slot.getResult.call({from: account})
  .then(function(result) {
    document.getElementById("result").innerHTML = result;
    displayHand(result);
  })
  .catch(function(e) {
    console.log(e);
  })
  refreshBalances();
  getPot();
}

function displayHand(hand) {
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

function checkPot() {
  var wager = document.querySelector('input[name="wager"]:checked').value;
  var warning = document.getElementById("warning");
  var slot = SlotMachine.deployed();
  slot.getPot.call({from: account}).then(function(pot) {
    if((wager * 800) > Number(pot)){
      warning.className = warning.className.replace(/(?:^|\s)hide(?!\S)/g , '');
    } else {
      warning.className = "hide";
    }
  })
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
