# DefiLlama Users Server

Tracks user metrics relating to smart contracts

## How to list a new protocol

1. Make sure you are listed on defillama's TVL page (see https://github.com/DefiLlama/DefiLlama-Adapters)
2. Fork this repository
3. Create a new folder within [src/adaptors/](src/adaptors/) with your protocol name (use your project `slug` from `https://api.llama.fi/protocols`)
4. Write an adaptor for your protocol (tutorial below)
5. Test your adaptor by running `node test.js YOUR_ADAPTOR` (remember to install dependencies with `npm i` first!)
6. Submit a PR

### Adaptors

An adaptor is just a javascript file that exports a function (or an async function) that returns an array of addresses for a chain

```typescript
type MaybePromise<T> = T | Promise<T>;
type AdaptorExport = Record<Chain, () => MaybePromise<string[]>>;
```

A basic example for [OpenSea](src/adaptors/opensea/index.js) on Ethereum:

```javascript
import { ETHEREUM } from "../../helpers/chains";

export default {
  [ETHEREUM]: () => [
    "0x00000000006c3852cbef3e08e8df289169ede581", // Seaport 1.1
    "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b", // Wyvern v1
    "0x7f268357a8c2552623316e2562d90e642bb538e5", // Wyvern v2
    "0x1e0049783f008a0085193e00003d00cd54003c71", // Conduit
    "0x9C4e9CCE4780062942a7fe34FA2Fa7316c872956", // ENS Resolver
    "0xa5409ec958c83c3f309868babaca7c86dcb077c1", // Registry
  ],
};
```

For a more complex example of fetching addresses with code, view [LlamaPay](src/adaptors/llamapay/index.js)

A note on what addresses to include:

- only smart contract are allowed, no EOA addresses
- factory addresses are not included, look at [LlamaPay](src/adaptors/llamapay/index.js) as an example
- if you are a dex, do not return the pool addresses - instead return the router address unless users directly interact with the pool, look at [Uniswap](src/adaptors/uniswap/index.js) as an example
- token addresses (ERC20, ERC721 etc) should not be included
- only include addresses users **directly** interact with, e.g if you are a yield aggregator do not include the underlying pool

You can find examples for a bunch of other protocols in the [src/adaptors/](src/adaptors/) folder, and if you have any questions feel free to ask them on [our discord](https://discord.gg/defillama).
