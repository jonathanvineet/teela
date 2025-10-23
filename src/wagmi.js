import { createClient, configureChains, mainnet } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { publicProvider } from 'wagmi/providers/public'

import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

const { chains, provider } = configureChains([mainnet], [publicProvider()])

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [() => new InjectedConnector({ chains })],
  provider,
})

export { wagmiClient, chains, RainbowKitProvider, lightTheme }
