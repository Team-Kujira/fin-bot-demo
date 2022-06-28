import { FinClient, tx, registry } from "kujira.js";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coins, SigningStargateClient, GasPrice } from "@cosmjs/stargate";

const RPC_ENDPOINT = "https://rpc-harpoon.kujira.app";

// 1. Set up the query and the signing clients for the contract;
const signer = await DirectSecp256k1HdWallet.generate(24, {
  prefix: "kujira",
});

const FIN_KUJI_DEMO =
  "kujira1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrsqq4jjh";

const [account] = await signer.getAccounts();
const cwClient = await CosmWasmClient.connect({
  url: RPC_ENDPOINT,
});

const contract = new FinClient(cwClient, account.address, FIN_KUJI_DEMO);
const signingClient = await SigningStargateClient.connectWithSigner(
  RPC_ENDPOINT,
  signer,
  {
    registry,
    gasPrice: GasPrice.fromString("0.00125ukuji"),
  }
);

// 2. Query the current spread in the order book. Here, the `limit` param
// is the number of price bands away from the central limit to query
const { base, quote } = await contract.book({ limit: 1 });
const buy = base[0];
const sell = quote[0];

console.log({ buy, sell });

// 3. Let's place both a buy and a sell order inside the spread.
// This contract has a step of 3 decimal places.

let newBuy = parseFloat(buy.quote_price);
let newSell = parseFloat(sell.quote_price);
// create an integer value truncated to 3 dp
newBuy = Math.round(newBuy * 10 ** 3);
newSell = Math.round(newSell * 10 ** 3);
// Step
newBuy -= 1;
newSell += 1;
// and re-decimalise
newBuy = newBuy / 10 ** 3;
newSell = newSell / 10 ** 3;

// Check we're not going to fill our own order
if (newBuy <= newSell) throw new Error("Overlap");

// Now let's place the orders
// `FinClient` has a `submitOrder` function which will allow you to submit a single
// order. That's not good enough here, so we're going to use the raw tx constructor
const sellMsg = tx.wasm.msgExecuteContract({
  sender: account.address,
  contract: FIN_KUJI_DEMO,
  msg: Buffer.from(
    JSON.stringify({ submit_order: { price: newSell.toString() } })
  ),
  funds: coins(100000000, "ukuji"),
});

const buyMsg = tx.wasm.msgExecuteContract({
  sender: account.address,
  contract: FIN_KUJI_DEMO,
  msg: Buffer.from(
    JSON.stringify({ submit_order: { price: newBuy.toString() } })
  ),
  funds: coins(100000000, "ukuji"),
});

// 4. Finally we broadcast our trnasaction, and can query our open orders

await signingClient.signAndBroadcast(
  account.address,
  [sellMsg, buyMsg],
  "auto"
);

const orders = await contract.ordersByUser({ address: account.address });

console.log(orders);
