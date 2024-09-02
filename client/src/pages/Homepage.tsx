import { useEffect, useRef, useState } from "react";
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
import {
  useAccount,
  useConnections,
  useDisconnect,
  useSignMessage,
} from "wagmi";

import { ClickToCopy } from "../components/ClickToCopy";
import { ParentWalletLogin } from "../components/ParentWalletLogin";

import { projectAccessKey, waasConfigKey } from "../config";

import { API } from "../api/api.gen";

import sequenceIconSrc from "../asset/sequence-icon.svg";
import { Deferred } from "../utils/promise";

const api = new API("https://dev-api.sequence.app", fetch);

type GetSignatureResult = {
  parentMessage: string;
  childMessage: string;
  parentSig: string;
  childSig: string;
};

export const sequenceWaas = new SequenceWaaS({
  network: "polygon",
  projectAccessKey: projectAccessKey,
  waasConfigKey: waasConfigKey,
});

export const Homepage = () => {
  const isMobile = useMediaQuery("@media screen and (max-width: 770px)");

  const toast = useToast();

  const { setOpenConnectModal, openConnectModalState } = useOpenConnectModal();

  const connections = useConnections();

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

  // Only used for sequence universal wallet
  const [askForSignature, setAskForSignature] = useState<
    "linking" | "unlinking" | undefined
  >(undefined);
  const [askSignatureResult, setAskSignatureResult] = useState<
    GetSignatureResult | undefined
  >();

  const deferredPromiseRef = useRef<Deferred<GetSignatureResult> | null>(null);

  const askUserForSignature = async (
    messageFor: "linking" | "unlinking"
  ): Promise<GetSignatureResult> => {
    const deferred = new Deferred<GetSignatureResult>();

    deferredPromiseRef.current = deferred;

    setAskForSignature(messageFor);

    return deferred.promise;
  };

  useEffect(() => {
    if (askSignatureResult) {
      deferredPromiseRef.current?.resolve(askSignatureResult);
      setAskSignatureResult(undefined);
      setAskForSignature(undefined);
      deferredPromiseRef.current = null;
    }
  }, [askSignatureResult]);

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
    messageFor: "linking" | "unlinking"
  ): Promise<GetSignatureResult> => {
    const parentMessage = parentWalletMessage + childWalletAddress;
    let childMessage: string;

    if (messageFor === "linking") {
      childMessage = "Link to " + childWalletMessage + parentWalletAddress;
    } else {
      childMessage = "Unlink from " + childWalletMessage + parentWalletAddress;
    }

    const parentSigRes = await sequenceWaas.signMessage({
      message: parentMessage,
    });

    const parentSig = parentSigRes.data.signature;

    let childSig: string;
    try {
      const response = await signMessageAsync({
        message: childMessage,
      });
      // @ts-ignore
      if (response.result) {
        // @ts-ignore
        childSig = response.result as string;
      } else {
        childSig = response;
      }
    } catch (error) {
      toast({
        title: "Request rejected",
        description:
          "Please confirm signature the request in your wallet to continue.",
        variant: "error",
      });
      throw new Error("Could not get signature from wallet to be linked");
    }

    return { parentMessage, childMessage, parentSig, childSig };
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

    const isSequenceUniversalWallet =
      connections[0]?.connector.id === "sequence";

    try {
      let getSigResult: GetSignatureResult;

      if (isSequenceUniversalWallet) {
        getSigResult = await askUserForSignature("linking");
      } else {
        getSigResult = await getSignatures("linking");
      }

      if (!getSigResult) {
        console.error("Could not get signature from wallet to be linked");
        throw new Error("Could not get signature from wallet to be linked");
      }

      const { parentMessage, childMessage, parentSig, childSig } = getSigResult;

      const response = await api.linkWallet({
        signatureChainId: "137",
        parentWalletAddress,
        parentWalletMessage: parentMessage,
        parentWalletSignature: parentSig,
        linkedWalletAddress: childWalletAddress,
        linkedWalletMessage: childMessage,
        linkedWalletSignature: childSig,
      });

      if (response.status) {
        setLinkedWallets([
          ...linkedWallets,
          childWalletAddress.toLocaleLowerCase(),
        ]);
      }
      toast({
        title: "Linking successful",
        description: "The wallet has been linked successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLinkInProgress(false);
    }
  };

  const [walletToUnlink, setWalletToUnlink] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (walletToUnlink && childWalletAddress) {
      if (walletToUnlink === childWalletAddress.toLocaleLowerCase()) {
        handleUnlink();
      } else {
        const wallet = walletToUnlink;
        handleDisconnect().then(() => {
          setOpenConnectModal(true);
          // need to set again here because it gets reset by the connect modal closing
          setWalletToUnlink(wallet);
        });
      }
    } else if (walletToUnlink) {
      setOpenConnectModal(true);
    }
  }, [walletToUnlink, childWalletAddress]);

  const handleUnlink = async () => {
    if (!parentWalletAddress) {
      console.error("Parent wallet address not set.");
      throw new Error("Parent wallet address not set");
    }
    if (!childWalletAddress) {
      console.error("Child wallet address not set.");
      throw new Error("Child wallet address not set");
    }

    const isSequenceUniversalWallet =
      connections[0]?.connector.id === "sequence";

    try {
      let getSigResult: GetSignatureResult;

      if (isSequenceUniversalWallet) {
        getSigResult = await askUserForSignature("unlinking");
      } else {
        getSigResult = await getSignatures("unlinking");
      }
      const { parentMessage, childMessage, parentSig, childSig } = getSigResult;

      const response = await api.removeLinkedWallet({
        signatureChainId: "137",
        parentWalletAddress,
        parentWalletMessage: parentMessage,
        parentWalletSignature: parentSig,
        linkedWalletAddress: childWalletAddress,
        linkedWalletMessage: childMessage,
        linkedWalletSignature: childSig,
      });

      if (response.status) {
        const filtered = linkedWallets.filter(
          (wallet) => wallet !== childWalletAddress.toLocaleLowerCase()
        );

        setLinkedWallets([...filtered]);
      }
      toast({
        title: "Unlinking successful",
        description: "The wallet has been unlinked successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setWalletToUnlink(undefined);
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
                              onClick={async () => {
                                if (walletToUnlink) {
                                  setWalletToUnlink(undefined);
                                  await handleDisconnect();
                                }
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
                    }
                    setIsLinkInProgress(true);
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
            {isLinkInProgress && !askForSignature && (
              <Text variant="normal" color="text80" textAlign="center">
                Connect your wallet and confirm the signature <br />
                request to link.
              </Text>
            )}

            {isLinkInProgress && askForSignature && (
              <>
                <Text variant="normal" color="text80" textAlign="center">
                  Confirm the signature request to link your wallet.
                </Text>
                <Button
                  label="Confirm signature request"
                  variant="primary"
                  onClick={async () => {
                    const sigResult = await getSignatures("linking");
                    setAskSignatureResult(sigResult);
                  }}
                />
              </>
            )}

            {walletToUnlink && (
              <>
                <Text
                  variant="normal"
                  color="text80"
                  textAlign="center"
                  lineHeight="6"
                >
                  {walletToUnlink === childWalletAddress.toLocaleLowerCase()
                    ? "Confirm "
                    : "Connect your wallet and confirm "}
                  the signature request to unlink wallet <br />
                  <Text color="text100" fontWeight="bold">
                    {truncateAddress(walletToUnlink ?? "")}
                  </Text>
                </Text>
                {askForSignature && (
                  <Button
                    label="Confirm signature request"
                    variant="primary"
                    onClick={async () => {
                      const sigResult = await getSignatures("unlinking");
                      setAskSignatureResult(sigResult);
                    }}
                  />
                )}
              </>
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
