import { KitConfig, getKitConnectWallets } from '@0xsequence/kit'
import { getDefaultConnectors, getDefaultWaasConnectors, mock } from '@0xsequence/kit-connectors'
import { findNetworkConfig, allNetworks } from '@0xsequence/network'
import { Transport, zeroAddress } from 'viem'
import { createConfig, http } from 'wagmi'
import { Chain, arbitrumNova, arbitrumSepolia, mainnet, polygon } from 'wagmi/chains'

const projectAccessKey = 'pk_live_4e4b3b4b-1b4b-4b4b-8b4b-4b4b4b4b4b4b'

const chains = [arbitrumNova, arbitrumSepolia, mainnet, polygon] as const satisfies Chain[]
const transports = chains.reduce<Record<number, Transport>>((acc, chain) => {
  const network = findNetworkConfig(allNetworks, chain.id)

  if (network) {
    acc[chain.id] = http(network.rpcUrl)
  }

  return acc
}, {})

chains.forEach(chain => {
  const network = findNetworkConfig(allNetworks, chain.id)
  if (!network) return
  transports[chain.id] = http(network.rpcUrl)
})

const getUniversalConnectors = () => {
  const connectors = [
    ...getDefaultConnectors({
      walletConnectProjectId: 'c65a6cb1aa83c4e24500130f23a437d8',
      defaultChainId: arbitrumNova.id,
      appName: 'Link EOA Wallet',
      projectAccessKey
    }),
  ]
  return connectors
}

export const wagmiConfig = createConfig({
  transports,
  chains,
  connectors: getUniversalConnectors()
})

export const kitConfig: KitConfig = {
  projectAccessKey,
  defaultTheme: 'dark',
  signIn: {
    projectName: 'Link EOA Wallet'
  }
}
