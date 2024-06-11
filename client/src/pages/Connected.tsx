import {
  Box,
  Button,
  Card,
  Text,
  SignoutIcon,
  useMediaQuery,
  truncateAddress,
  SendIcon,
  CurrencyIcon
} from "@0xsequence/design-system";

import React, {useState} from "react";
import {useAccount, useDisconnect} from "wagmi";
import {ClickToCopy} from "../components/ClickToCopy/ClickToCopy";
import {TransferTokenModal} from "./TransferTokenModal";
import {TransferCollectibleModal} from "./TransferCollectibleModal";

export const Connected = ({
  eoaWalletAddress,
  chainId
}: {
  eoaWalletAddress: `0x${string}` | undefined;
  chainId: number;
}) => {
  const {address} = useAccount();
  const {disconnect} = useDisconnect();
  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);

  return (
    <>
      <Card
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        marginTop="10"
        padding="6"
        style={{maxWidth: "700px"}}
        width="full">
        <Box flexDirection="column" gap="4">
          <Box flexDirection={{sm: "column", md: "row"}} alignItems="center" gap="2">
            <Text color="text50" fontSize="medium" fontWeight="bold">
              Wallet Connected:
            </Text>
            {address && (
              <Box alignItems="center" gap="2">
                <Text color="text100" fontSize="medium" fontWeight="medium">
                  {isMobile ? truncateAddress(address) : address}
                </Text>

                <ClickToCopy textToCopy={address} />
              </Box>
            )}
          </Box>
          <Box
            marginTop="2"
            gap="4"
            justifyContent="space-between"
            flexDirection={{sm: "column", md: "row"}}>
            <Box gap="2" flexDirection={{sm: "column", md: "row"}}>
              <Button
                shape="square"
                leftIcon={CurrencyIcon}
                label="Transfer Token"
                width={{sm: "full", md: "auto"}}
                onClick={() => setIsModalOpen(true)}
              />

              <Button
                shape="square"
                leftIcon={SendIcon}
                label="Transfer Collectible"
                width={{sm: "full", md: "auto"}}
                onClick={() => setIsCollectibleModalOpen(true)}
              />
            </Box>

            <Button
              shape="square"
              variant="danger"
              rightIcon={SignoutIcon}
              label="Sign out"
              width={{sm: "full", md: "auto"}}
              onClick={() => disconnect()}
            />
          </Box>
        </Box>
      </Card>

      {isModalOpen && (
        <TransferTokenModal
          chainId={chainId}
          eoaWalletAddress={eoaWalletAddress}
          embeddedWalletAddress={address}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isCollectibleModalOpen && (
        <TransferCollectibleModal
          chainId={chainId}
          eoaWalletAddress={eoaWalletAddress}
          embeddedWalletAddress={address}
          onClose={() => setIsCollectibleModalOpen(false)}
        />
      )}
    </>
  );
};
