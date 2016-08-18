contract('AwesomeCoin', function(accounts) {
  var AMOUNT = 1000;

  it("should initialize the first account with 1000000", function() {
    var awesome = AwesomeCoin.deployed();

    return awesome.getBalance.call(accounts[0]).then(function(balance) {
      assert.equal(balance.valueOf(), 1000000, "1000000 wasn't in the first account")
    });
  });

  it("should send coins correctly", function() {
    var awesome = AwesomeCoin.deployed();

    var acc_one = accounts[0];
    var acc_two = accounts[1];

    var acc_one_start;
    var acc_two_start;
    var acc_one_end;
    var acc_two_end;

    return awesome.getBalance.call(acc_one).then(function(balance){
      acc_one_start = balance.toNumber();
      return awesome.getBalance.call(acc_two);
    }).then(function(balance) {
      acc_two_start = balance.toNumber();
      return awesome.sendCoin(acc_one, acc_two, AMOUNT);
    }).then(function() {
      return awesome.getBalance.call(acc_one);
    }).then(function(balance) {
      acc_one_end = balance.toNumber();
      return awesome.getBalance.call(acc_two);
    }).then(function(balance) {
      acc_two_end = balance.toNumber();

      assert.equal(acc_one_end, acc_one_start - AMOUNT, "Amount wasn't taken from the sender");
      assert.equal(acc_two_end, acc_two_start + AMOUNT, "Amount wasn't given to the receiver");
    })
  });

  it("should sieze coins into the first account", function() {
    var awesome = AwesomeCoin.deployed();
    var acc_one = accounts[0];
    var acc_two = accounts[1];
    var acc_three = accounts[2];

    var acc_one_balance;
    var acc_two_balance;
    var acc_three_balance;

    return awesome.sendCoin(acc_one, acc_two, 100, {from: acc_one}).then(function(){
      return awesome.sendCoin(acc_one, acc_three, 100, {from: acc_one})
    }).then(function() {
      return awesome.seizeCoins({from: acc_one})
    }).then(function() {
      return awesome.getBalance.call(acc_one);
    }).then(function(balance) {
      acc_one_balance = balance.toNumber();
      return awesome.getBalance.call(acc_two);
    }).then(function(balance) {
      acc_two_balance = balance.toNumber();
      return awesome.getBalance.call(acc_three);
    }).then(function(balance) {
      acc_three_balance = balance.toNumber();

      assert.equal(acc_one_balance, 1000000, "Account one does not have all coins");
      assert.equal(acc_two_balance, 0, "Account two still has coins");
      assert.equal(acc_three_balance, 0, "Account three still has coins");
    })
  })

  it("should mint coins 10000 to the first account", function() {
    var awesome = AwesomeCoin.deployed();
    var account = accounts[0];

    var start_balance;
    var end_balance;

    return awesome.getBalance.call(account).then(function(balance){
      start_balance = balance.toNumber();
      return awesome.mint({from: account});
    }).then(function() {
      return awesome.getBalance.call(account).then(function(balance){
        end_balance = balance.toNumber();

        assert.equal(end_balance, start_balance + 10000, "10000 were not given to first account");
      })
    })
  });


});
