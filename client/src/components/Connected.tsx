import {
  Box,
  Button,
  Card,
  Text,
  SignoutIcon,
  useMediaQuery,
  truncateAddress,
  ExternalLinkIcon,
} from "@0xsequence/design-system";

import { useAccount, useDisconnect } from "wagmi";
import { ClickToCopy } from "./ClickToCopy";

export const Connected = ({
  address,
  isLinked,
  onLinkClick,
  onUnlinkClick,
  onDisconnectClick,
}: {
  address: string;
  isLinked: boolean;
  onLinkClick: () => void;
  onUnlinkClick: () => void;
  onDisconnectClick: () => void;
}) => {
  const isMobile = useMediaQuery("@media screen and (max-width: 500px)");

  return (
    <>
      <Card flexDirection="column" marginTop="4" padding="6" width="full">
        <Box flexDirection="column" gap="2">
          <Box alignItems="flex-start" gap="2">
            <Text color="text50" fontSize="medium" fontWeight="bold">
              Child wallet:
            </Text>
            {address && (
              <Box alignItems="center" gap="2">
                <Text color="text100" fontSize="medium" fontWeight="medium">
                  {isMobile
                    ? truncateAddress(address)
                    : address.slice(0, 20) +
                      "..." +
                      address.slice(address.length - 10, address.length)}
                </Text>

                <ClickToCopy textToCopy={address} />
              </Box>
            )}
          </Box>
          <Box
            marginTop="2"
            gap="1"
            justifyContent="space-between"
            flexDirection={{ sm: "column", md: "row" }}
          >
            <Box gap="1" flexDirection={{ sm: "column", md: "row" }}>
              {!isLinked && (
                <Button
                  shape="square"
                  leftIcon={ExternalLinkIcon}
                  label="Link"
                  width={{ sm: "full", md: "auto" }}
                  onClick={onLinkClick}
                />
              )}
              {isLinked && (
                <Box flexDirection="row" gap="5" alignItems="center">
                  <Text color="positive" fontWeight="bold">
                    Linked
                  </Text>

                  <Button
                    shape="square"
                    label="Unlink"
                    onClick={onUnlinkClick}
                  />
                </Box>
              )}
            </Box>

            <Button
              shape="square"
              variant="danger"
              rightIcon={SignoutIcon}
              label="Sign out"
              width={{ sm: "full", md: "auto" }}
              onClick={onDisconnectClick}
            />
          </Box>
        </Box>
      </Card>
    </>
  );
};
