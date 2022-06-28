# Sample FIN Market Making Bot

This is a very simple demonstration of how you can use kujira.js to create a trading bot on FIN.

See the implementation in src/index.js for how it queries the current spread, calculates a new position
inside the spread, and then places orders in a batch.

Quickstart

```
git clone https://github.com/Team-Kujira/fin-bot-demo
cd fin-bot-demo
yarn
node src/index.js
```

If all is correct, you should see an error `Error: Account does not exist on chain. Send some tokens there before trying to query sequence.`. This is normal, and means that you need to import a mnemonic when creating your `DirectSecp256k1HdWallet`, so that you can load it with a balance.
