import React from "react";

import {
  Box,
  Button,
  Card,
  Text,
  Image,
  Spinner,
  truncateAddress,
  useMediaQuery
} from "@0xsequence/design-system";
import {useOpenConnectModal} from "@0xsequence/kit";
import {useAccount} from "wagmi";
import {useEffect, useState} from "react";

import {Connected} from "./Connected";
import {ClickToCopy} from "./ClickToCopy";

import sequenceIconSrc from "../asset/sequence-icon.svg";

const SERVER_URL = import.meta.env.VITE_SERVER_URL!;

export const Homepage = () => {
  const [verifiedWaaSAddress, setVerifiedWaaSAddress] = useState<string>();
  const [inProgress, setInProgress] = useState<boolean>(false);

  const verifyEmbeddedWallet = async () => {
    setInProgress(true);
    const urlParams = new URLSearchParams(location.search);
    const nonce: string | null = urlParams.get("nonce");
    const signature: string | null = urlParams.get("signature");
    const chainId: string | null = urlParams.get("chainId");
    const sessionId: string | null = urlParams.get("sessionId");

    console.log("nonce", nonce);
    console.log("signature", signature);
    console.log("chainId", chainId);
    console.log("sessionId", sessionId);

    if (!nonce || !signature || !chainId || !sessionId) {
      console.log("Missing parameters for embedded wallet verification");
      return;
    }

    const response = await fetch(`${SERVER_URL}/verifyNonce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({nonce, signature, chainId, sessionId})
    });

    const data = await response.json();

    if (data.walletAddress) {
      console.log("Wallet is verified");
      setVerifiedWaaSAddress(data.walletAddress);
    } else {
      console.log("Wallet is not verified");
    }
    setInProgress(false);
  };

  useEffect(() => {
    verifyEmbeddedWallet();
  }, []);

  return (
    <main>
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="5"
        height="vh">
        <Image
          src={sequenceIconSrc}
          alt="Sequence Logo"
          style={{
            width: "150px"
          }}
        />

        {!inProgress && verifiedWaaSAddress != null ? (
          <EmbeddedWalletState walletAddress={verifiedWaaSAddress} />
        ) : (
          <Box gap="2" marginY="4" alignItems="center" justifyContent="center">
            <Spinner />
          </Box>
        )}
      </Box>
    </main>
  );
};

const EmbeddedWalletState = (props: {walletAddress?: string}) => {
  const {walletAddress} = props;
  const {isConnected} = useAccount();
  const {setOpenConnectModal} = useOpenConnectModal();
  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");

  const onClickConnect = () => {
    setOpenConnectModal(true);
  };

  return (
    <Box padding="4" marginX="auto">
      <Card
        padding="6"
        gap="2"
        alignItems="center"
        flexDirection={{sm: "column", md: "row"}}
        style={{maxWidth: "700px"}}
        width="full">
        <Text color="text50" fontSize="medium" fontWeight="bold">
          Embedded Wallet Verified:
        </Text>
        {walletAddress && (
          <Box alignItems="center" gap="1">
            <Text color="text100" fontSize="medium" fontWeight="medium">
              {isMobile ? truncateAddress(walletAddress) : walletAddress}
            </Text>

            <ClickToCopy textToCopy={walletAddress} />
          </Box>
        )}
      </Card>

      {!isConnected ? (
        <Box marginX="auto" gap="2" justifyContent="center" marginTop="10">
          <Button
            onClick={onClickConnect}
            variant="feature"
            label="Connect your EOA Wallet"
          />
        </Box>
      ) : (
        <Connected />
      )}
    </Box>
  );
};
