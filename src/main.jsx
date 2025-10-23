import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'RainbowKit Vite App',
  projectId: 'f3a3e201f33dd60d470e1d506848ae76', // Replace with your WalletConnect Project ID
  chains: [mainnet, sepolia],
  ssr: false,
});

const queryClient = new QueryClient();

// DEV: suppress noisy analytics errors from wallet SDKs (e.g., cca-lite.coinbase.com blocked by adblockers)
// This is a local convenience only; do not use in production logging.
(() => {
  const originalWarn = console.warn.bind(console);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args) => {
    try {
      const joined = args.map((a) => String(a)).join(' ');
      if (joined.includes('cca-lite.coinbase.com') || joined.includes('Analytics SDK: TypeError: Failed to fetch')) return;
    } catch (e) {
      // pass through
    }
    return originalWarn(...args);
  };
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider appInfo={{}}
          // @ts-ignore
          chains={config.chains}
        >
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </StrictMode>
);

