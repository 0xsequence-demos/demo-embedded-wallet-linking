import { Box, Button, Card, Modal, Select, Switch, Text, TextInput, breakpoints, SignoutIcon } from '@0xsequence/design-system'
import {
  useStorage,
  useWaasFeeOptions,
  useIndexerClient,
  signEthAuthProof,
  validateEthProof,
  getModalPositionCss
} from '@0xsequence/kit'
import { allNetworks, ChainId } from '@0xsequence/network'
import { AnimatePresence } from 'framer-motion'
import React, { ComponentProps, useEffect } from 'react'
import { formatUnits, parseUnits } from 'viem'
import {
  useAccount,
  useChainId,
  useConnections,
  usePublicClient,
  useSendTransaction,
  useWalletClient,
  useWriteContract,
  useDisconnect
} from 'wagmi'

export const Connected = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const connections = useConnections()
  const chainId = useChainId()
  const indexerClient = useIndexerClient(chainId)
  const { disconnect } = useDisconnect()

  return (
    <>
        <Box paddingX="4" flexDirection="column" justifyContent="center" alignItems="center" style={{ margin: '140px 0' }}>
            <Box flexDirection="column" gap="4" style={{ maxWidth: breakpoints.md }}>
                <Box flexDirection="column" gap="2">
                    <Text color="text50" fontSize="medium" fontWeight="bold">
                        Wallet Connected:
                    </Text>
                    <Text color="text50" fontSize="medium" fontWeight="medium">
                        {address}
                    </Text>
                </Box>
                <Box marginTop="2">
                <Button
                  width="full"
                  shape="square"
                  variant="emphasis"
                  rightIcon={SignoutIcon}
                  label="Sign out"
                  onClick={() => disconnect()}
                />
              </Box>
            </Box>
        </Box>
    </>
  )
}
