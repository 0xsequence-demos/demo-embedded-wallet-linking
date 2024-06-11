import {Box, Button, Spinner, Text, TextInput} from "@0xsequence/design-system";
import {
  ContractType,
  GetEtherBalanceArgs,
  SequenceIndexer,
  TokenBalance
} from "@0xsequence/indexer";
import React, {useEffect, useState} from "react";
import {ContentModal} from "../components/ContentModal/ContentModal";
import {allNetworks} from "@0xsequence/network";
import {useWriteContract} from "wagmi";
import {ERC1155_ABI, ERC721_ABI} from "../constants/abi";
import {CollectibleSelectButton} from "../components/CollectibleSelectButton/CollectibleSelectButton";

const PROJECT_ACCESS_KEY = import.meta.env.VITE_SEQUENCE_PROJECT_ACCESS_KEY;
export const TransferCollectibleModal = ({
  chainId,
  eoaWalletAddress,
  embeddedWalletAddress,
  onClose
}: {
  chainId: number;
  eoaWalletAddress: `0x${string}` | undefined;
  embeddedWalletAddress: `0x${string}` | undefined;
  onClose: () => void;
}) => {
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const network = allNetworks.find((n) => n.chainId === chainId);
  const [amount, setAmount] = useState("");
  const client = new SequenceIndexer(
    "https://" + network?.name + "-indexer.sequence.app",
    PROJECT_ACCESS_KEY
  );
  const {writeContract, isPending: isWriteContractPending} = useWriteContract();
  const isPending = isWriteContractPending;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (eoaWalletAddress) {
      fetchTokenBalances();
    }
  }, [embeddedWalletAddress]);

  const fetchTokenBalances = async () => {
    if (!network || !eoaWalletAddress) {
      return;
    }

    try {
      setIsLoading(true);

      const tokenBalances = await client.getTokenBalances({
        accountAddress: embeddedWalletAddress,
        includeMetadata: true
      } as GetEtherBalanceArgs);

      if (tokenBalances && tokenBalances.balances && tokenBalances.balances.length > 0) {
        const filteredBalances = tokenBalances.balances.filter(
          (balance) => balance.contractType !== "ERC20"
        );
        let balances: TokenBalance[] = [];
        for (const token of filteredBalances) {
          const tokenInfo = await client.getTokenBalances({
            accountAddress: embeddedWalletAddress,
            contractAddress: token.contractAddress,
            includeMetadata: true
          } as GetEtherBalanceArgs);
          balances = [...balances, ...tokenInfo.balances];
        }
        setTokenBalances(balances);
        setSelectedToken(balances[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransactionHandler = async () => {
    const to = eoaWalletAddress as `0x${string}`;
    const from = embeddedWalletAddress as `0x${string}`;
    const value = amount;

    if (selectedToken) {
      const tokenAddress = selectedToken.contractAddress;
      const abi =
        selectedToken.contractInfo?.type === ContractType.ERC721
          ? ERC721_ABI
          : ERC1155_ABI;
      const functionName =
        selectedToken.contractInfo?.type === ContractType.ERC721
          ? "transferFrom"
          : "safeTransferFrom";
      const args =
        selectedToken.contractInfo?.type === ContractType.ERC721
          ? [from, to, selectedToken.tokenID]
          : [from, to, selectedToken.tokenID, value, "0x0"];

      writeContract({
        address: tokenAddress as `0x${string}`,
        abi,
        functionName,
        args
      });
    }
  };

  return (
    <ContentModal onClose={onClose}>
      <Box display="flex" flexDirection="column" gap="10" overflowY="scroll" padding="6">
        <Box flexDirection="column" gap="3">
          <Text as="h1" variant="normal" fontWeight="medium" color="text100">
            Transfer Collectible
          </Text>

          {isLoading ? (
            <Spinner />
          ) : (
            <>
              {tokenBalances && tokenBalances.length > 0 && (
                <>
                  <Box
                    overflow="auto"
                    style={{
                      maxHeight: "200px"
                    }}>
                    <Box flexDirection="column" gap="2">
                      {tokenBalances.map((token) => (
                        <CollectibleSelectButton
                          token={token}
                          selected={selectedToken === token}
                          handleSelectCoin={() => {
                            setSelectedToken(token);
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <TextInput
                    readOnly
                    value={embeddedWalletAddress}
                    label="From"
                    labelLocation="left"
                  />

                  <TextInput
                    readOnly
                    value={eoaWalletAddress}
                    label="To"
                    labelLocation="left"
                  />

                  {selectedToken &&
                    selectedToken.contractType === ContractType.ERC1155 && (
                      <TextInput
                        type="number"
                        value={amount}
                        label="Amount"
                        labelLocation="left"
                        onChange={(e: any) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    )}

                  <Button
                    marginLeft="auto"
                    onClick={sendTransactionHandler}
                    variant="primary"
                    shape="square"
                    leftIcon={isPending ? () => <Spinner /> : undefined}
                    label="Send Transaction"
                    disabled={
                      isPending ||
                      (amount === "" &&
                        selectedToken?.contractType === ContractType.ERC1155)
                    }
                  />
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </ContentModal>
  );
};
