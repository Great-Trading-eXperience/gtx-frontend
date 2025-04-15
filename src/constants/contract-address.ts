import { getBalanceManagerAddress, getGTXRouterAddress, getPoolManagerAddress } from "@/utils/env";
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

// export const MOCK_USDC_ADDRESS = "0x1efa330dd86fb0a30eed4487a5e2160618eb3eb1"
export const MOCK_USDC_TX = "0x20a3479a8a6de3a9895e58b5718b5a244ce17dcea660cee87c88f298daa7e6e5"
export const MOCK_USDC_BLOCK = "115276473"

export const BITMAP_ADDRESS = "0x0cf21ff90c7f614d614563b0818126f3fa43985c"
export const BITMAP_TX = "0xac6a69cc5da5ed6fd1dd074a3eb3d7f7b077045af79f0523eab8eee6a26ba6c6"
export const BITMAP_BLOCK = "115276448"

// export const MOCK_WETH_ADDRESS = "0x468797250bd290533d211060cd419c7c4b3f41f6"
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

// CLOB DEX
export const BALANCE_MANAGER_ADDRESS = (chainId: number) => {
    return getBalanceManagerAddress(chainId)
}

export const POOL_MANAGER_ADDRESS = (chainId: number) => {
    return getPoolManagerAddress(chainId)
}

export const GTX_ROUTER_ADDRESS = (chainId: number) => {
    return getGTXRouterAddress(chainId)
}

export const MOCK_USDC_ADDRESS = "0x02950119C4CCD1993f7938A55B8Ab8384C3CcE4F"
export const MOCK_WETH_ADDRESS = "0xb2e9Eabb827b78e2aC66bE17327603778D117d18"
export const MOCK_WBTC_ADDRESS = "0xc2CC2835219A55a27c5184EaAcD9b8fCceF00F85"
export const MOCK_CHAINLINK_CONTRACT = "0x24b1ca69816247Ef9666277714FADA8B1F2D901E"
export const MOCK_PEPE_CONTRACT = "0x7FB2a815Fa88c2096960999EC8371BccDF147874"

export const MOCK_SHIB_ADDRESS = "0xF3812D5af4D74895ab957d26E33D89B0B4363820";
export const MOCK_SOL_ADDRESS = "0x45deaF475edC2092Af1F3b46A8Bd4D96c40b1573";
export const MOCK_DOGE_ADDRESS = "0x2e6937d2084E42dc3413152fa4d37452750EdECB";
export const MOCK_XRP_ADDRESS = "0x68FbeBD1678225f8b3cAFd04e371c76e1E669a2F";
export const MOCK_ADA_ADDRESS = "0x2BEcD7E727AF1449615e448E0D8d83B2fE2DFb51";

// Perpetual Contracts
export const FAUCET_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_FAUCET_ADDRESS,
    'NEXT_PUBLIC_FAUCET_ADDRESS'
);

// Token Addresses
export const WETH_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_WETH_ADDRESS,
    'NEXT_PUBLIC_WETH_ADDRESS'
);
export const WBTC_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_WBTC_ADDRESS,
    'NEXT_PUBLIC_WBTC_ADDRESS'
);
export const USDC_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_USDC_ADDRESS,
    'NEXT_PUBLIC_USDC_ADDRESS'
);
export const PEPE_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_PEPE_ADDRESS,
    'NEXT_PUBLIC_PEPE_ADDRESS'
);

export const TRUMP_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_TRUMP_ADDRESS,
    'NEXT_PUBLIC_TRUMP_ADDRESS'
);
export const DOGE_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_DOGE_ADDRESS,
    'NEXT_PUBLIC_DOGE_ADDRESS'
);
export const LINK_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_LINK_ADDRESS,
    'NEXT_PUBLIC_LINK_ADDRESS'
);
export const SHIBA_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_SHIBA_ADDRESS,
    'NEXT_PUBLIC_SHIBA_ADDRESS'
);
export const BONK_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_BONK_ADDRESS,
    'NEXT_PUBLIC_BONK_ADDRESS'
);
export const FLOKI_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_FLOKI_ADDRESS,
    'NEXT_PUBLIC_FLOKI_ADDRESS'
);

// Perpetual Contracts
export const DATA_STORE_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_DATA_STORE_ADDRESS,
    'NEXT_PUBLIC_DATA_STORE_ADDRESS'
);
export const MARKET_FACTORY_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS,
    'NEXT_PUBLIC_MARKET_FACTORY_ADDRESS'
);
export const ORACLE_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_ORACLE_ADDRESS,
    'NEXT_PUBLIC_ORACLE_ADDRESS'
);
export const ORDER_VAULT_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_ORDER_VAULT_ADDRESS,
    'NEXT_PUBLIC_ORDER_VAULT_ADDRESS'
);
export const DEPOSIT_VAULT_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_DEPOSIT_VAULT_ADDRESS,
    'NEXT_PUBLIC_DEPOSIT_VAULT_ADDRESS'
);
export const WITHDRAW_VAULT_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_WITHDRAW_VAULT_ADDRESS,
    'NEXT_PUBLIC_WITHDRAW_VAULT_ADDRESS'
);
export const ORDER_HANDLER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_ORDER_HANDLER_ADDRESS,
    'NEXT_PUBLIC_ORDER_HANDLER_ADDRESS'
);
export const POSITION_HANDLER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_POSITION_HANDLER_ADDRESS,
    'NEXT_PUBLIC_POSITION_HANDLER_ADDRESS'
);
export const MARKET_HANDLER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_MARKET_HANDLER_ADDRESS,
    'NEXT_PUBLIC_MARKET_HANDLER_ADDRESS'
);
export const DEPOSIT_HANDLER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_DEPOSIT_HANDLER_ADDRESS,
    'NEXT_PUBLIC_DEPOSIT_HANDLER_ADDRESS'
);
export const WITHDRAW_HANDLER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_WITHDRAW_HANDLER_ADDRESS,
    'NEXT_PUBLIC_WITHDRAW_HANDLER_ADDRESS'
);
export const ROUTER_ADDRESS = requireEnvAddress(
    process.env.NEXT_PUBLIC_ROUTER_ADDRESS,
    'NEXT_PUBLIC_ROUTER_ADDRESS'
);

// Curator Contracts
// export const CURATOR_REGISTRY_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_CURATOR_REGISTRY_ADDRESS,
//     'NEXT_PUBLIC_CURATOR_REGISTRY_ADDRESS'
// );

// export const CURATOR_FACTORY_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_CURATOR_FACTORY_ADDRESS,
//     'NEXT_PUBLIC_CURATOR_FACTORY_ADDRESS'
// );

// export const VAULT_FACTORY_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS,
//     'NEXT_PUBLIC_VAULT_FACTORY_ADDRESS'
// );

// export const WETH_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_WETH_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_WETH_USDC_MARKET_ADDRESS'
// );

// export const WBTC_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_WBTC_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_WBTC_USDC_MARKET_ADDRESS'
// );

// export const PEPE_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_PEPE_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_PEPE_USDC_MARKET_ADDRESS'
// );

// export const TRUMP_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_TRUMP_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_TRUMP_USDC_MARKET_ADDRESS'
// );

// export const DOGE_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_DOGE_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_DOGE_USDC_MARKET_ADDRESS'
// );

// export const LINK_USDC_MARKET_ADDRESS = requireEnvAddress(
//     process.env.NEXT_PUBLIC_LINK_USDC_MARKET_ADDRESS,
//     'NEXT_PUBLIC_LINK_USDC_MARKET_ADDRESS'
// );