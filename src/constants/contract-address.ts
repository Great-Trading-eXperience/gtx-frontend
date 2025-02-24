// export const IDRT_ADDRESS = "0x078cC2Af3Cdd9Bd242f336c3d20Ee2F29C891106";
// export const USDT_ADDRESS = "0x4361e5c43A1c432736F1d32F35057C5B4817CA6D";

import { HexAddress } from "@/types/web3/general/address";
import { requireEnvAddress } from "../../helper";

// export const BALANCE_MANAGER_ADDRESS = "0x474c48cc0c29504c627ddb77189edbabe063176d"
export const BALANCE_MANAGER_TX = "0x30429d62916f337d480df8746e9ecb4c3a9fb79f7b3b4028696319a257164e0b"
export const BALANCE_MANAGER_BLOCK = "115276516"

export const ENGINE_ADDRESS = "0xb4c4de8f023fcb4a5d3f475c451052806c423174"
export const ENGINE_TX = "0x68cff880bc05922670096fafef33b86f7515df5f604faeb4141c2b1315cecebc"
export const ENGINE_BLOCK = "115276425"

export const MATCHER_ADDRESS = "0x06bc51c65044d40bbfca5f840909e896e2227918"
export const MATCHER_TX = "0x734298a38022dac110fcba88d33ecf9fa3fda17de4c63084f6210abdcb230054"
export const MATCHER_BLOCK = "115276409"

export const MOCK_USDC_ADDRESS = "0x1efa330dd86fb0a30eed4487a5e2160618eb3eb1"
export const MOCK_USDC_TX = "0x20a3479a8a6de3a9895e58b5718b5a244ce17dcea660cee87c88f298daa7e6e5"
export const MOCK_USDC_BLOCK = "115276473"

export const BITMAP_ADDRESS = "0x0cf21ff90c7f614d614563b0818126f3fa43985c"
export const BITMAP_TX = "0xac6a69cc5da5ed6fd1dd074a3eb3d7f7b077045af79f0523eab8eee6a26ba6c6"
export const BITMAP_BLOCK = "115276448"

export const MOCK_WETH_ADDRESS = "0x468797250bd290533d211060cd419c7c4b3f41f6"
export const MOCK_WETH_TX = "0x6e801bbe1391c3912f8ed8ddac1e6bf5ffb69cbb1f62ed2805a93ffbf1847cd5"
export const MOCK_WETH_BLOCK = "115276496"

export const TICK_ADDRESS = "0x5546140fb8bc99f7003882baf24779b44e8dffe8"
export const TICK_TX = "0xbb7042e55005a247485ea4e5f510b234a80fbe2cb655a4a83dac480af34aafad"
export const TICK_BLOCK = "115276374"

// export const POOL_MANAGER_ADDRESS = "0x70ace7bb86ad7f9bbb73e4857bb67a1bc2e16164"
export const POOL_MANAGER_TX = "0xf85416cbd1445389aadc4466a4e0f4d9c7526ca5376f88a4caf01c0fc51e124c"
export const POOL_MANAGER_BLOCK = "115276531"

export const POOL_ORDERBOOK_ADDRESS = "0x12d61353ec2f3e7e1b66b6d7d488cee60c6f3992"
export const POOL_ORDERBOOK_TX = "0xd1e53dc82d0d19b0ec75ea057cea3c6675a7dee24200d5754101db9a1d4d3be4"
export const POOL_ORDERBOOK_BLOCK = "115276553"

export const ORDER_ADDRESS = "0x6b3f090fb979e59ee95c14e07d8a8e3b0ffce582"
export const ORDER_TX = "0x599d8c7c65c32584c96a9d135eb6ff48a3f0beb7cb4869dc3ae8c9e1760a1d41"
export const ORDER_BLOCK = "115276393"


// Address for GTX Project Update Below

// Faucet Address
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
export const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS;
export const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;


// CLOB DEX Contracts
// export const ORDERBOOK_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_ORDERBOOK_ADDRESS,
//     'NEXT_PUBLIC_ORDERBOOK_ADDRESS'
// );
export const ORDERBOOK_ADDRESS = "0x92D8387421fe5205051C82E4a6473E0aC5cc636b"
export const BALANCE_MANAGER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_BALANCE_MANAGER_ADDRESS,
    'NEXT_PUBLIC_BALANCE_MANAGER_ADDRESS'
);
export const POOL_MANAGER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS,
    'NEXT_PUBLIC_POOL_MANAGER_ADDRESS'
);
export const GTX_ROUTER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_GTX_ROUTER_ADDRESS,
    'NEXT_PUBLIC_GTX_ROUTER_ADDRESS'
);