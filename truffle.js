module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js",
      "javascripts/awesome_coin.js",
      "javascripts/eth_slot.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
