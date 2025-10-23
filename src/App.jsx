import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { getEthBalanceFromBackend } from './api'
import { ethers } from 'ethers'

function App() {
  const [count, setCount] = useState(0)
  const { address, isConnected } = useAccount()
  const [backendBalance, setBackendBalance] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [agentStatus, setAgentStatus] = useState(null)

  useEffect(() => {
    if (!isConnected || !address) return
    // call backend
    getEthBalanceFromBackend(address)
      .then((data) => setBackendBalance(data))
      .catch((err) => console.error(err))

    // ethers.js example: use window.ethereum provider
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      provider.getBalance(address).then((b) => setWalletBalance(ethers.formatEther(b)))
    }
  }, [isConnected, address])

  useEffect(() => {
    fetchAgentStatus().then(setAgentStatus);
  }, []);

  async function fetchAgentStatus() {
    try {
      const res = await fetch('/api/agent-status');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>AgentRent (Vite + React)</h1>
      <div style={{ marginBottom: 16 }}>
        <ConnectButton />
      </div>

      {isConnected && (
        <div style={{ marginBottom: 16 }}>
          <h3>Connected address: {address}</h3>
          <p>Backend balance: {backendBalance ? backendBalance.balance?.ether : 'loading...'}</p>
          <p>Wallet balance (ethers.js): {walletBalance ?? 'loading...'}</p>
        </div>
      )}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <div style={{ padding: 20, fontFamily: 'Inter,system-ui,sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>TEELA 
            <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>Agent Dashboard</span>
          </h1>
          <ConnectButton />
        </header>

        <section style={{ marginTop: 20 }}>
          <h2>Agent Setup / Status</h2>
          {agentStatus ? (
            <div>
              <p><strong>Name:</strong> {agentStatus.name}</p>
              <p><strong>Address:</strong> {agentStatus.address}</p>
              <p><strong>Status:</strong> {agentStatus.online ? 'Online' : 'Offline'}</p>
            </div>
          ) : (
            <p>Loading agent status...</p>
          )}
        </section>
      </div>
    </>
  )
}

export default App
