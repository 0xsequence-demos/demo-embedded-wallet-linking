import {
  Box,
  Button,
  Card,
  Text,
  SignoutIcon,
  useMediaQuery,
  truncateAddress
} from "@0xsequence/design-system";

import React from "react";
import {useAccount, useDisconnect} from "wagmi";
import {ClickToCopy} from "./ClickToCopy";

export const Connected = () => {
  const {address} = useAccount();
  const {disconnect} = useDisconnect();
  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");

  return (
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
        <Box marginTop="2" justifyContent="flex-end">
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
  );
};
