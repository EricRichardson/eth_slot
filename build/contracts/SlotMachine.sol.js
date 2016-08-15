var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("SlotMachine error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("SlotMachine error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("SlotMachine contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of SlotMachine: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to SlotMachine.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: SlotMachine not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [],
        "name": "getCoin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getPot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "wager",
            "type": "uint256"
          }
        ],
        "name": "play",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "deposit",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "payOut",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getResult",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "awesomeAddr",
            "type": "address"
          }
        ],
        "name": "addCoinAddr",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "awesomeAddr",
            "type": "address"
          }
        ],
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x6060604052604051602080610a0383395060806040525160008054600160a060020a03191632179055506109cc806100376000396000f3606060405236156100615760e060020a60003504632762efb58114610069578063403c9fa81461007c5780636898f82b146100f4578063b6b55f251461010a578063da333ca614610175578063de292789146101e0578063eba170cb14610247575b610269610002565b61026b600154600160a060020a03165b90565b604080516001547ff8b2cb4f000000000000000000000000000000000000000000000000000000008252600160a060020a03308116600484015292516102889360009392169163f8b2cb4f916024828101926020929190829003018187876161da5a03f1156100025750506040515191506100799050565b6102696004356000600582111561030857610002565b6102696004355b6001546040805160e360020a63016817b102815233600160a060020a03908116600483015230811660248301526044820185905291519190921691630b40bd88916064828101926000929190829003018183876161da5a03f1156100025750505050565b6102696004355b6001546040805160e360020a63016817b1028152600160a060020a03308116600483015232811660248301526044820185905291519290911691630b40bd8891606481810192600092909190829003018183876161da5a03f1156100025750505050565b60408051602081810183526000825260028054845161010060018316150260001901909116829004601f810184900484028201840190955284815261029a9490928301828280156109a05780601f10610975576101008083540402835291602001916109a0565b6001805473ffffffffffffffffffffffffffffffffffffffff19166004351790555b005b60408051600160a060020a03929092168252519081900360200190f35b60408051918252519081900360200190f35b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156102fa5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61031182610111565b620f4240600242604051808281526020019150506020604051808303816000866161da5a03f1156100025750506040515106905060198110156103db5760408051808201909152600b81527f526f79616c20466c7573680000000000000000000000000000000000000000006020918201908152600280546000829052915160ff191660161781559161046b916001811615610100026000190116839004601f01046000805160206109ac833981519152908101905b8082111561047a57600081556001016103c7565b60868110156104835760408051808201909152600e8082527f537472616967687420466c75736800000000000000000000000000000000000060209283019081526002805460008290528251601c60ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506105149291506103c7565b505061047e826103200261017c565b5090565b610971565b6109c18110156105225760408051808201909152600e8082527f466f7572206f662061204b696e6400000000000000000000000000000000000060209283019081526002805460008290528251601c60ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506105b39291506103c7565b505061047e8260320261017c565b6136b98110156105c15760408051808201909152600a8082527f46756c6c20486f7573650000000000000000000000000000000000000000000060209283019081526002805460008290528251601460ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506106529291506103c7565b505061047e8260190261017c565b6161c0811015610660576040805180820190915260058082527f466c75736800000000000000000000000000000000000000000000000000000060209283019081526002805460008290528251600a60ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506106f19291506103c7565b505061047e8260090261017c565b618d9d8110156106ff576040805180820190915260088082527f537472616967687400000000000000000000000000000000000000000000000060209283019081526002805460008290528251601060ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506107919291506103c7565b505061047e8260060261017c565b6201b06e81101561079f5760408051808201909152600f8082527f5468726565206f662061204b696e64000000000000000000000000000000000060209283019081526002805460008290528251601e60ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506108319291506103c7565b505061047e8260040261017c565b6203a96d81101561083f576040805180820190915260088082527f54776f205061697200000000000000000000000000000000000000000000000060209283019081526002805460008290528251601060ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506108d19291506103c7565b505061047e8260030261017c565b6206efa68110156108df5760408051808201909152600f8082527f4a61636b73206f7220426574746572000000000000000000000000000000000060209283019081526002805460008290528251601e60ff199190911617825590936000805160206109ac83398151915261010060018416150260001901909216859004601f010481019291506109639291506103c7565b505061047e8260020261017c565b60408051808201909152600781527f4e6f2048616e64000000000000000000000000000000000000000000000000006020918201908152600280546000829052915160ff1916600e1781559161096e916000805160206109ac833981519152601f6000196001841615610100020190921685900491909101919091048101906103c7565b505061047e8261017c565b50505b5050565b820191906000526020600020905b81548152906001019060200180831161098357829003601f168201915b5050505050905061007956405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace",
    "updated_at": 1471302000155,
    "links": {},
    "address": "0x028973735a8b9400af3c556453bc7f98c1dd5f1b"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "SlotMachine";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.SlotMachine = Contract;
  }
})();
