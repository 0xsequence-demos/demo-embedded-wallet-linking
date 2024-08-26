import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Text,
  Image,
  Spinner,
  truncateAddress,
  useMediaQuery,
} from "@0xsequence/design-system";
import { useOpenConnectModal } from "@0xsequence/kit";
import {
  useAccount,
  useSwitchChain,
  useDisconnect,
  useWalletClient,
} from "wagmi";

import { Connected } from "../components/Connected";
import { ClickToCopy } from "../components/ClickToCopy";

import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";

import sequenceIconSrc from "../asset/sequence-icon.svg";
import { API } from "../api/api.gen";
import { googleClientId, sequenceWaas } from "../config";
import { randomName } from "../utils/string";

const api = new API("https://dev-api.sequence.app", fetch);

export const Homepage = () => {
  const handleGoogleLogin = async (tokenResponse: CredentialResponse) => {
    try {
      const res = await sequenceWaas.signIn(
        {
          idToken: tokenResponse.credential!,
        },
        randomName()
      );

      setParentWalletAddress(res.wallet);
    } catch (error) {
      console.error(error);
    }
  };

  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");

  const [inProgress, setInProgress] = useState<boolean>(false);

  const { setOpenConnectModal } = useOpenConnectModal();

  const { disconnect } = useDisconnect();

  const { address: kitWalletAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [linkedWallets, setLinkedWallets] = useState<string[]>([]);

  const parentWalletMessage = "child wallet with address ";
  const childWalletMessage = "parent wallet with address ";

  const [parentWalletAddress, setParentWalletAddress] = useState<
    string | undefined
  >(undefined);

  const [childWalletAddress, setChildWalletAddress] = useState<
    string | undefined
  >(undefined);

  const checkAccounts = async () => {
    try {
      const address = await sequenceWaas.getAddress();
      if (address) {
        setParentWalletAddress(address);
      }
    } catch (error) {
      console.error(error);
    }

    if (kitWalletAddress) {
      setChildWalletAddress(kitWalletAddress);
    }
  };

  useEffect(() => {
    checkAccounts();
  }, []);

  useEffect(() => {
    if (parentWalletAddress) {
      getLinkedWallets();
    }
  }, [parentWalletAddress]);

  useEffect(() => {
    if (kitWalletAddress && !childWalletAddress) {
      setChildWalletAddress(kitWalletAddress);
    }
  }, [kitWalletAddress]);

  const getLinkedWallets = async () => {
    const response = await api.getLinkedWallets({
      walletAddress: parentWalletAddress as `0x${string}`,
    });

    setLinkedWallets(response.linkedWallets);
  };

  const getSignatures = async (
    parentMessage: string,
    childMessage: string
  ): Promise<{
    parentSig: string;
    childSig: string;
  }> => {
    const parentSigRes = await sequenceWaas.signMessage({
      message: parentMessage,
    });

    const parentSig = parentSigRes.data.signature;

    const childSig = (await walletClient?.signMessage({
      account: childWalletAddress as `0x${string}`,
      message: childMessage,
    })) as string;

    return { parentSig, childSig };
  };

  const handleOnLinkClick = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set");
      throw new Error("Child wallet address not set");
    }

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage = childWalletMessage + parentWalletAddress;

    const { parentSig, childSig } = await getSignatures(
      finalParentWalletMessage,
      finalChildWalletMessage
    );

    const response = await api.linkWallet({
      chainId: "137",
      parentWalletAddress,
      parentWalletMessage: finalParentWalletMessage,
      parentWalletSignature: parentSig,
      linkedWalletMessage: finalChildWalletMessage,
      linkedWalletSignature: childSig,
    });

    if (response.status) {
      setLinkedWallets([
        ...linkedWallets,
        childWalletAddress.toLocaleLowerCase(),
      ]);
    }
  };

  const handleOnUnlinkClick = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set");
      throw new Error("Child wallet address not set");
    }

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage = childWalletMessage + parentWalletAddress;

    const { parentSig, childSig } = await getSignatures(
      finalParentWalletMessage,
      finalChildWalletMessage
    );

    const response = await api.removeLinkedWallet({
      chainId: "137",
      parentWalletAddress,
      parentWalletMessage: finalParentWalletMessage,
      parentWalletSignature: parentSig,
      linkedWalletMessage: finalChildWalletMessage,
      linkedWalletSignature: childSig,
    });

    if (response.status) {
      const filtered = linkedWallets.filter(
        (wallet) => wallet !== childWalletAddress.toLocaleLowerCase()
      );

      setLinkedWallets([...filtered]);
    }
  };

  const handleOnDisconnectClick = async () => {
    setChildWalletAddress(undefined);
    disconnect();
  };

  return (
    <main>
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="5"
        height="vh"
      >
        <Image
          src={sequenceIconSrc}
          alt="Sequence Logo"
          style={{
            width: "150px",
          }}
        />

        {!inProgress && parentWalletAddress ? (
          <>
            <Box padding="4">
              <Box marginBottom="4">
                <Text variant="large" color="white">
                  Connected Wallets
                </Text>
              </Box>

              <Card
                padding="6"
                gap="2"
                alignItems="center"
                flexDirection={{ sm: "column", md: "row" }}
                style={{ maxWidth: "700px" }}
                width="full"
              >
                <Text color="text50" fontSize="medium" fontWeight="bold">
                  Parent Wallet:
                </Text>
                {parentWalletAddress && (
                  <Box alignItems="center" gap="1">
                    <Text color="text100" fontSize="medium" fontWeight="medium">
                      {isMobile
                        ? truncateAddress(parentWalletAddress)
                        : parentWalletAddress.slice(0, 20) +
                          "..." +
                          parentWalletAddress.slice(
                            parentWalletAddress.length - 10,
                            parentWalletAddress.length
                          )}
                    </Text>

                    <ClickToCopy textToCopy={parentWalletAddress} />
                  </Box>
                )}
              </Card>

              {!childWalletAddress ? (
                <Box
                  marginX="auto"
                  gap="2"
                  justifyContent="center"
                  marginTop="10"
                >
                  <Button
                    onClick={() => {
                      setOpenConnectModal(true);
                    }}
                    variant="feature"
                    label="Connect your EOA Wallet"
                  />
                </Box>
              ) : (
                childWalletAddress && (
                  <Connected
                    address={childWalletAddress}
                    isLinked={linkedWallets.includes(
                      childWalletAddress.toLocaleLowerCase()
                    )}
                    onLinkClick={handleOnLinkClick}
                    onUnlinkClick={handleOnUnlinkClick}
                    onDisconnectClick={handleOnDisconnectClick}
                  />
                )
              )}
              {linkedWallets.length > 0 && (
                <Box marginTop="4">
                  <Box marginBottom="4">
                    <Text variant="large" color="white">
                      All linked wallets
                    </Text>
                  </Box>
                  <Box flexDirection="column" gap="3">
                    {linkedWallets.map((wallet, index) => (
                      <Card key={index} padding="4">
                        <Box
                          flexDirection="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Text color="text100" fontSize="medium">
                            {isMobile ? truncateAddress(wallet) : wallet}
                          </Text>
                          <ClickToCopy textToCopy={wallet} />
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box gap="2" marginY="4" alignItems="center" justifyContent="center">
            <GoogleOAuthProvider clientId={googleClientId}>
              <GoogleLogin
                key="google"
                onSuccess={handleGoogleLogin}
                shape="circle"
                width={230}
              />
            </GoogleOAuthProvider>
          </Box>
        )}
      </Box>
    </main>
  );
};
