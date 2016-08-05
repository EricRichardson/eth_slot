contract Test {
  address public owner;

  function Test(){
    owner = msg.sender;
  }

  function greeting() constant returns (string) {
    return "Hello from Truffle";
  }

  function kill() {
    if (msg.sender == owner) selfdestruct(owner);
  }
}
