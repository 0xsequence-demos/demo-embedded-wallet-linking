import {
  KitConfig,
  getDefaultConnectors,
  getDefaultChains,
  getKitConnectWallets,
  sequence,
  walletConnect,
} from "@0xsequence/kit";
import { ChainId } from "@0xsequence/network";
import { Transport } from "viem";
import { createConfig, http } from "wagmi";

const chains = getDefaultChains([ChainId.POLYGON]);
const transports = chains.reduce<Record<number, Transport>>((acc, chain) => {
  acc[chain.id] = http();
  return acc;
}, {});

export const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY;
export const waasConfigKey =import.meta.env.VITE_WAAS_CONFIG_KEY
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const defaultChainId = ChainId.POLYGON;
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_ID;
const appName = "Link Wallet Demo";

const connectors = getKitConnectWallets(projectAccessKey, [
  sequence({
    defaultNetwork: defaultChainId,
    connect: {
      app: appName,
    },
  }),
  walletConnect({
    projectId: walletConnectProjectId,
  }),
]);

export const wagmiConfig = createConfig({
  transports,
  chains,
  connectors,
});

export const kitConfig: KitConfig = {
  projectAccessKey,
  defaultTheme: "dark",
  signIn: {
    projectName: "Link Wallet Demo",
  },
};
