# Eth Slots

Eth Slots is a project to demonstrate Ethereum's potential to support a
gambling App, which is transparent and honest.

With traditional gambling, especially online gambling, it is impossible to be
sure the machine is fair. Traditionally in electronic forms of gambling players
must trust the machines, without being able to see the inner workings.

On a platform like Ethereum it is possible to create gambling apps that players
can verify themselves it is fair. Anyone is free to examine the source code for
the app, and confirm that program is really at the supposed address by comparing
the compiled version of the code.

Eth Slots is a simple slot machine type game. I created my own currency to be
used with Eth Slots, so I can become familiar with that aspect of Ethereum.
Of course it would be easy to modify the code so the machine would use real
Ether as its token.

To deploy this app you will need to have truffle. Use

`npm install -g truffle`

You will also need an Ethereum client. For testing purposes use testrpc which
will create a local block chain with 0 difficulty and will mine only when there
are pending transactions

`npm install -g ethereumjs-testrpc`

If you want to deploy to the main or testnets you will need an actual client like
geth or pairity

Once you have the requirements and have downloaded and navigated to this repo run

`testrpc`

to start a client. In a new tab type

`truffle migrate`

to deploy the contracts. Lastly run

`truffle serve`

to start the server. By default it will start from port 8080 so naviagte to
localhost:8080
