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
  Modal,
  Spinner,
  useToast,
} from "@0xsequence/design-system";
import { useOpenConnectModal } from "@0xsequence/kit";
import { SequenceWaaS } from "@0xsequence/waas";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

import { ClickToCopy } from "../components/ClickToCopy";
import { ParentWalletLogin } from "../components/ParentWalletLogin";

import { API } from "../api/api.gen";
import { projectAccessKey, waasConfigKey } from "../config";

import sequenceIconSrc from "../asset/sequence-icon.svg";

const api = new API("https://dev-api.sequence.app", fetch);

export const sequenceWaas = new SequenceWaaS({
  network: "polygon",
  projectAccessKey: projectAccessKey,
  waasConfigKey: waasConfigKey,
});

export const Homepage = () => {
  const isMobile = useMediaQuery("@media screen and (max-width: 770px)");

  const toast = useToast();

  const { setOpenConnectModal, openConnectModalState } = useOpenConnectModal();

  const { disconnect } = useDisconnect();

  const { address: kitWalletAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();

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
    const message = "parent wallet with address " + parentWalletAddress;
    const signature = await sequenceWaas.signMessage({
      message: message,
    });
    if (!signature.data.signature) {
      console.error("Could not get signature from wallet to be linked");
      throw new Error("Could not get signature from wallet to be linked");
    }
    const response = await api.getLinkedWallets({
      parentWalletAddress: parentWalletAddress as `0x${string}`,
      parentWalletMessage: message,
      parentWalletSignature: signature.data.signature,
      signatureChainId: "137",
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

    let childSig: string;
    try {
      childSig = (await signMessageAsync({
        message: childMessage,
      })) as string;
    } catch (error) {
      toast({
        title: "Request rejected",
        description:
          "Please approve signature the request in your wallet to continue the operation.",
        variant: "error",
      });
      throw new Error("Could not get signature from wallet to be linked");
    }

    console.log("childSig", childSig);

    return { parentSig, childSig };
  };

  const [isLinkInProgress, setIsLinkInProgress] = useState(false);

  useEffect(() => {
    if (isLinkInProgress && childWalletAddress) {
      handleLink();
    }
  }, [isLinkInProgress, childWalletAddress]);

  const handleLink = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set");
      throw new Error("Child wallet address not set");
    }

    if (linkedWallets.includes(childWalletAddress.toLocaleLowerCase())) {
      setIsLinkInProgress(false);
      toast({
        title: "Wallet already linked",
        description: "The connected wallet is already linked.",
        variant: "normal",
      });
      return;
    }

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage =
      "Link to " + childWalletMessage + parentWalletAddress;

    try {
      const { parentSig, childSig } = await getSignatures(
        finalParentWalletMessage,
        finalChildWalletMessage
      );

      if (!childSig) {
        console.error("Could not get signature from wallet to be linked");
        throw new Error("Could not get signature from wallet to be linked");
      }

      const response = await api.linkWallet({
        signatureChainId: "137",
        parentWalletAddress,
        parentWalletMessage: finalParentWalletMessage,
        parentWalletSignature: parentSig,
        linkedWalletAddress: childWalletAddress,
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
      toast({
        title: "Linking successful",
        description: "The wallet has been linked successfully.",
        variant: "success",
      });
    }
  };

  const [walletToUnlink, setWalletToUnlink] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (walletToUnlink && childWalletAddress) {
      if (walletToUnlink === childWalletAddress.toLocaleLowerCase()) {
        handleUnlink(walletToUnlink);
      } else {
        handleDisconnect().then(() => {
          setOpenConnectModal(true);
        });
      }
    } else if (walletToUnlink) {
      setOpenConnectModal(true);
    }
  }, [walletToUnlink, childWalletAddress]);

  const handleUnlink = async (linkedWallet: string) => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set.");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set.");
      throw new Error("Child wallet address not set");
    }

    const finalParentWalletMessage = parentWalletMessage + childWalletAddress;
    const finalChildWalletMessage =
      "Unlink from " + childWalletMessage + parentWalletAddress;

    try {
      const { parentSig, childSig } = await getSignatures(
        finalParentWalletMessage,
        finalChildWalletMessage
      );

      const response = await api.removeLinkedWallet({
        signatureChainId: "137",
        parentWalletAddress,
        parentWalletMessage: finalParentWalletMessage,
        parentWalletSignature: parentSig,
        linkedWalletAddress: childWalletAddress,
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
      setWalletToUnlink(undefined);
      toast({
        title: "Unlinking successful",
        description: "The wallet has been unlinked successfully.",
        variant: "success",
      });
    }
  };

  const handleOnParentWalletDisconnectClick = async () => {
    setWalletToUnlink(undefined);
    setIsLinkInProgress(false);
    setParentWalletAddress(undefined);
    setLinkedWallets([]);
    await sequenceWaas.dropSession();
  };

  const handleDisconnect = async () => {
    return new Promise<void>((resolve) => {
      setChildWalletAddress(undefined);
      disconnect(undefined, {
        onSuccess: () => {
          resolve();
        },
      });
    });
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
                  Parent Wallet
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

              {linkedWallets.length > 0 && (
                <Box marginTop="4">
                  <Box marginBottom="4">
                    <Text variant="large" color="white">
                      Linked wallets
                    </Text>
                  </Box>
                  <Box flexDirection="column" gap="3">
                    {linkedWallets.map((wallet, index) => (
                      <Card key={index} padding="4">
                        <Box flexDirection="column" gap="2">
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
                          <Box gap="2" alignItems="center">
                            {childWalletAddress?.toLocaleLowerCase() ===
                              wallet && (
                              <Text color="positive" fontWeight="bold">
                                Connected
                              </Text>
                            )}
                            <Button
                              shape="square"
                              label={
                                childWalletAddress?.toLocaleLowerCase() ===
                                wallet
                                  ? "Unlink"
                                  : "Connect and unlink"
                              }
                              onClick={() => {
                                setWalletToUnlink(wallet);
                              }}
                            />
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}

              <Box marginX="auto" gap="2" justifyContent="center" marginY="6">
                <Button
                  onClick={async () => {
                    setWalletToUnlink(undefined);
                    if (childWalletAddress) {
                      await handleDisconnect();
                      setIsLinkInProgress(true);
                    }
                    setOpenConnectModal(true);
                  }}
                  variant="feature"
                  label={
                    linkedWallets.length === 0
                      ? "Link a wallet"
                      : "Link another wallet"
                  }
                />
              </Box>
            </Box>
          </>
        ) : (
          <ParentWalletLogin setParentWalletAddress={setParentWalletAddress} />
        )}
      </Box>

      {(isLinkInProgress || walletToUnlink) && childWalletAddress && (
        <Modal size="small" isDismissible={false}>
          <Box
            flexDirection="column"
            gap="4"
            alignItems="center"
            justifyContent="center"
            paddingY="10"
            paddingX="8"
          >
            <Spinner size="lg" />
            <Text variant="large" color="text100" fontWeight="bold">
              {isLinkInProgress ? "Linking" : "Unlinking"}
            </Text>
            {isLinkInProgress && (
              <Text variant="normal" color="text80" textAlign="center">
                Connect your wallet and approve the signature <br />
                request to link.
              </Text>
            )}

            {walletToUnlink && (
              <Text
                variant="normal"
                color="text80"
                textAlign="center"
                lineHeight="6"
              >
                {walletToUnlink === childWalletAddress.toLocaleLowerCase()
                  ? "Approve "
                  : "Connect your wallet and approve "}
                the signature request to unlink wallet <br />
                <Text color="text100" fontWeight="bold">
                  {truncateAddress(walletToUnlink ?? "")}
                </Text>
              </Text>
            )}
          </Box>
        </Modal>
      )}

      {walletToUnlink && !childWalletAddress && openConnectModalState && (
        <Card
          flexDirection="column"
          gap="4"
          alignItems="center"
          justifyContent="center"
          paddingY="10"
          paddingX="8"
          position="absolute"
          zIndex="50"
          left="0"
          style={isMobile ? { top: 0 } : { bottom: 0 }}
        >
          <Spinner size="lg" />
          <Text variant="normal" color="text80">
            Waiting connection to wallet
          </Text>

          <Text color="text100" fontWeight="bold">
            {isMobile ? truncateAddress(walletToUnlink ?? "") : walletToUnlink}
          </Text>

          <Text variant="normal" color="text80">
            to unlink
          </Text>
        </Card>
      )}
    </main>
  );
};
