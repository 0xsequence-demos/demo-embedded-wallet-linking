import React from 'react'

import { Box, Button, Card, Text, Image, useTheme, CheckmarkIcon, breakpoints, Spinner } from '@0xsequence/design-system'
import { useOpenConnectModal } from '@0xsequence/kit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

import { Connected } from './Connected'


export const Homepage = () => {
  const { theme } = useTheme()
  const [ verifiedWaaSAddress, setVerifiedWaaSAddress ] = useState<string>()
  const [ inProgress, setInProgress ] = useState<boolean>(false)

  const verifyEmbeddedWallet = async () => {
    setInProgress(true)
    const urlParams = new URLSearchParams(location.search)
    const nonce: string | null = urlParams.get('nonce')
    const signature: string | null = urlParams.get('signature')
    const chainId: string | null = urlParams.get('chainId')
    const sessionId: string | null = urlParams.get('sessionId')

    console.log('nonce', nonce)
    console.log('signature', signature)
    console.log('chainId', chainId)
    console.log('sessionId', sessionId)

    if (!nonce || !signature || !chainId || !sessionId) {
        console.log('Missing parameters for embedded wallet verification')
        return
    }

    const response = await fetch('http://localhost:8787/verifyNonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nonce, signature, chainId, sessionId })
    })
      
    const data = await response.json()

    if (data.walletAddress) {
        console.log('Wallet is verified')
        setVerifiedWaaSAddress(data.walletAddress)
    } else {
        console.log('Wallet is not verified')
    }
    setInProgress(false)
  }

  useEffect(() => {
    verifyEmbeddedWallet()
  }, [])

  return (
    <main>
        <Box flexDirection="column" alignItems="center" justifyContent="center" gap="5" height="vh">

        {!inProgress && verifiedWaaSAddress != null ? (
            <EmbeddedWalletState walletAddress={verifiedWaaSAddress} />
        ) : (
            <Box gap="2" marginY="4" alignItems="center" justifyContent="center">
                <Spinner />
            </Box>
        )}
        </Box>
    </main>
  )
}

const EmbeddedWalletState = (props: {walletAddress?: string}) => {
    const { walletAddress } = props
    const { isConnected } = useAccount()
    const { setOpenConnectModal } = useOpenConnectModal()

    const onClickConnect = () => {
      setOpenConnectModal(true)
    }

    return (
        <>
            <Box gap="2" flexDirection="row" alignItems="center">
                <Text color="text50" fontSize="medium" fontWeight="bold">
                    Embedded Wallet Verified:
                </Text>
                <Text color="text50" fontSize="medium" fontWeight="medium">
                    {walletAddress}
                </Text>
            </Box>

        {!isConnected ? (
            <Box gap="2" flexDirection="row" alignItems="center">
                <Text color="text50" fontSize="medium" fontWeight="bold">
                    Connect your EOA Wallet:
                </Text>
                <Button onClick={onClickConnect} variant="feature" label="Connect" />
            </Box>
        ) : (
            <Connected />
        )}
        </>
    )
  }
