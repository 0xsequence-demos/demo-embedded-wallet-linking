import {ChainId, NetworkConfig, networks} from "@0xsequence/network";

export const enabledChainIDs = [
  ChainId.MAINNET,
  ChainId.SEPOLIA,
  ChainId.ARBITRUM,
  ChainId.ARBITRUM_NOVA,
  ChainId.ARBITRUM_SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_ZKEVM,
  ChainId.POLYGON_AMOY,
  ChainId.BASE,
  ChainId.BASE_SEPOLIA,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_SEPOLIA,
  ChainId.AVALANCHE,
  ChainId.AVALANCHE_TESTNET,
  ChainId.HOMEVERSE,
  ChainId.HOMEVERSE_TESTNET,
  ChainId.BSC,
  ChainId.BSC_TESTNET,
  ChainId.ASTAR_ZKEVM,
  ChainId.ASTAR_ZKYOTO,
  ChainId.XAI,
  ChainId.XAI_SEPOLIA,
  ChainId.XR_SEPOLIA
];

export const explorerNetworks = Object.fromEntries(
  Object.entries(networks).filter(([chainID]) =>
    enabledChainIDs.includes(parseInt(chainID))
  )
) as Record<ChainId, NetworkConfig>;

const networksSortedList = (includeMainnets = true, includeTestnets = true) =>
  Object.values(
    Object.entries(explorerNetworks).filter(([_, config]) => {
      if (includeMainnets && includeTestnets) return true;
      if (includeMainnets && !config.testnet) return true;
      if (includeTestnets && config.testnet) return true;
    })
  )
    .sort(([_, a], [__, b]) => {
      const aa = enabledChainIDs.indexOf(a.chainId);
      const bb = enabledChainIDs.indexOf(b.chainId);
      return aa - bb;
    })
    .map(([_, config]) => config);

export const networksFullList = networksSortedList(true, true);
