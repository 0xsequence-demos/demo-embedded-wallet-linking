import "@0xsequence/design-system/styles.css";

import { ThemeProvider, ToastProvider } from "@0xsequence/design-system";
import { KitProvider } from "@0xsequence/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { Homepage } from "./pages/Homepage";
import { kitConfig, wagmiConfig } from "./config";
import { KitWalletProvider } from "@0xsequence/kit-wallet";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <KitProvider config={kitConfig}>
          <KitWalletProvider>
            <div id="app">
              <ThemeProvider root="#app" scope="app" theme="dark">
                <ToastProvider duration={2500}>
                  <Homepage />
                </ToastProvider>
              </ThemeProvider>
            </div>
          </KitWalletProvider>
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
