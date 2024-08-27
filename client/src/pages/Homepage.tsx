import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  Text,
  Image,
  truncateAddress,
  useMediaQuery,
  SignoutIcon,
} from "@0xsequence/design-system";
import { useOpenConnectModal } from "@0xsequence/kit";

import { useAccount, useDisconnect, useWalletClient } from "wagmi";

import { Connected } from "../components/Connected";
import { ClickToCopy } from "../components/ClickToCopy";
import { ParentWalletLogin } from "../components/ParentWalletLogin";

import { API } from "../api/api.gen";
import { sequenceWaas } from "../config";

import sequenceIconSrc from "../asset/sequence-icon.svg";

const api = new API("https://dev-api.sequence.app", fetch);

export const Homepage = () => {
  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");

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

  const [isLinkInProgress, setIsLinkInProgress] = useState(false);

  const handleOnLinkClick = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set");
      throw new Error("Child wallet address not set");
    }

    setIsLinkInProgress(true);

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage = childWalletMessage + parentWalletAddress;

    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLinkInProgress(false);
    }
  };

  const [isUnlinkInProgress, setIsUnlinkInProgress] = useState(false);

  const handleOnUnlinkClick = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set.");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set.");
      throw new Error("Child wallet address not set");
    }

    setIsUnlinkInProgress(true);

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage = childWalletMessage + parentWalletAddress;

    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsUnlinkInProgress(false);
    }
  };

  const handleOnParentWalletDisconnectClick = async () => {
    setParentWalletAddress(undefined);
    setLinkedWallets([]);
    await sequenceWaas.dropSession();
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

        {parentWalletAddress ? (
          <>
            <Box padding="4">
              <Box marginBottom="4">
                <Text variant="large" color="white">
                  Connected Wallets
                </Text>
              </Box>

              <Card
                padding="6"
                gap="4"
                alignItems="flex-start"
                flexDirection="column"
                style={{ maxWidth: "700px" }}
                width="full"
              >
                <Box>
                  <Box alignItems="center" gap="1">
                    <Text color="text50" fontSize="medium" fontWeight="bold">
                      Parent Wallet:
                    </Text>

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
                </Box>
                <Button
                  marginLeft="auto"
                  shape="square"
                  variant="danger"
                  rightIcon={SignoutIcon}
                  label="Sign out"
                  onClick={handleOnParentWalletDisconnectClick}
                />
              </Card>

              {!childWalletAddress ? (
                <Box marginX="auto" gap="2" justifyContent="center" marginY="6">
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
                    isLinkInProgress={isLinkInProgress}
                    isUnlinkInProgress={isUnlinkInProgress}
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
          <ParentWalletLogin setParentWalletAddress={setParentWalletAddress} />
        )}
      </Box>
    </main>
  );
};
