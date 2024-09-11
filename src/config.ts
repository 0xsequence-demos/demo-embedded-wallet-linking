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

export const projectAccessKey = "AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI";
export const waasConfigKey =
  "eyJwcm9qZWN0SWQiOjE2ODE1LCJlbWFpbFJlZ2lvbiI6ImNhLWNlbnRyYWwtMSIsImVtYWlsQ2xpZW50SWQiOiI2N2V2NXVvc3ZxMzVmcGI2OXI3NnJoYnVoIiwicnBjU2VydmVyIjoiaHR0cHM6Ly93YWFzLnNlcXVlbmNlLmFwcCJ9";
export const googleClientId =
  "970987756660-35a6tc48hvi8cev9cnknp0iugv9poa23.apps.googleusercontent.com";

const defaultChainId = ChainId.POLYGON;
const walletConnectProjectId = "c65a6cb1aa83c4e24500130f23a437d8";
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