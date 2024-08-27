import { SetStateAction, useRef, useState } from "react";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import {
  Box,
  Button,
  Divider,
  PINCodeInput,
  Spinner,
  Text,
  TextInput,
} from "@0xsequence/design-system";

import { randomName } from "../utils/string";

import { useEmailAuth } from "../hooks/useEmailAuth";

import { googleClientId, sequenceWaas } from "../config";

export const ParentWalletLogin = ({
  setParentWalletAddress,
}: {
  setParentWalletAddress: React.Dispatch<SetStateAction<string | undefined>>;
}) => {
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

  const {
    inProgress: emailAuthInProgress,
    loading: emailAuthLoading,
    initiateAuth: initiateEmailAuth,
    sendChallengeAnswer,
    cancel: cancelEmailAuth,
  } = useEmailAuth({
    sessionName: randomName(),
    onSuccess: async ({ wallet }) => {
      setParentWalletAddress(wallet);
    },
  });

  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isEmailValid = inputRef.current?.validity.valid;
  const [showEmailWarning, setEmailWarning] = useState(false);
  const [code, setCode] = useState<string[]>([]);
  return (
    <Box
      flexDirection="column"
      gap="2"
      marginY="4"
      alignItems="center"
      justifyContent="center"
    >
      <Box marginBottom="2">
        <Text variant="large" color="text100" fontWeight="bold">
          Google Login
        </Text>
      </Box>
      <GoogleOAuthProvider clientId={googleClientId}>
        <GoogleLogin
          key="google"
          onSuccess={handleGoogleLogin}
          shape="circle"
          width={230}
        />
      </GoogleOAuthProvider>

      <Divider background="buttonGlass" width="full" />

      <Box>
        <Text variant="large" color="text100" fontWeight="bold">
          Email Login
        </Text>
      </Box>

      {sendChallengeAnswer ? (
        <Box flexDirection="column">
          <Box>
            <Text
              marginTop="2"
              variant="normal"
              color="text80"
              alignItems="center"
              justifyContent="center"
            >
              Enter code received in email.
            </Text>
          </Box>
          <Box marginTop="4">
            <PINCodeInput value={code} digits={6} onChange={setCode} />
          </Box>

          <Box gap="2" marginY="4" alignItems="center" justifyContent="center">
            {emailAuthLoading ? (
              <Spinner />
            ) : (
              <Button
                variant="primary"
                disabled={code.includes("")}
                label="Verify"
                onClick={() => sendChallengeAnswer(code.join(""))}
                data-id="verifyButton"
              />
            )}
          </Box>
        </Box>
      ) : (
        <Box marginTop="2" marginBottom="4">
          <Text variant="normal" color="text80">
            Enter your email to recieve a code to login and create your wallet.{" "}
            <br />
            Please check your spam folder if you don't see it in your inbox.
          </Text>

          <Box marginTop="6">
            <TextInput
              name="email"
              type="email"
              onChange={(ev: { target: { value: SetStateAction<string> } }) => {
                setEmail(ev.target.value);
              }}
              ref={inputRef}
              onKeyDown={(ev: { key: string }) => {
                if (email && ev.key === "Enter") {
                  initiateEmailAuth(email);
                }
              }}
              onBlur={() => setEmailWarning(!!email && !isEmailValid)}
              value={email}
              placeholder="hello@example.com"
              required
              data-id="loginEmail"
            />
            {showEmailWarning && (
              <Text as="p" variant="small" color="negative" marginY="2">
                Invalid email address
              </Text>
            )}
          </Box>
          <Box gap="2" marginY="4" alignItems="center" justifyContent="center">
            {emailAuthLoading ? (
              <Spinner />
            ) : (
              <Button
                variant="primary"
                disabled={!isEmailValid}
                label="Continue"
                onClick={() => initiateEmailAuth(email)}
                data-id="continueButton"
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
