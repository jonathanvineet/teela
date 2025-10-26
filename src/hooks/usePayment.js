import { useState } from 'react';
import { ethers } from 'ethers';
import { AGENT_ESCROW_ADDRESS, ESCROW_ABI, DOMAIN_RATES, DEFAULT_SESSION_HOURS } from '../config/contracts';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const createPaymentSession = async (domain) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check if wallet is connected
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        throw new Error('Please switch to Sepolia network');
      }

      // Get hourly rate for domain
      const rate = DOMAIN_RATES[domain] || DOMAIN_RATES.finance;
      const amount = ethers.parseEther(rate);

      // Create contract instance
      const escrow = new ethers.Contract(
        AGENT_ESCROW_ADDRESS,
        ESCROW_ABI,
        signer
      );

      console.log(`Creating session for ${domain} with ${rate} ETH...`);

      // Create session and pay
      const tx = await escrow.createSession({
        value: amount
      });

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract session ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = escrow.interface.parseLog(log);
          return parsed.name === 'SessionCreated';
        } catch {
          return false;
        }
      });

      let newSessionId = null;
      if (event) {
        const parsed = escrow.interface.parseLog(event);
        newSessionId = parsed.args.sessionId.toString();
      }

      setSessionId(newSessionId);
      setIsProcessing(false);

      return {
        success: true,
        sessionId: newSessionId,
        txHash: tx.hash,
        amount: rate,
        startTime: Date.now() // Add start time for timer
      };

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      setIsProcessing(false);
      return {
        success: false,
        error: err.message
      };
    }
  };

  const checkSession = async (sessionId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const escrow = new ethers.Contract(
        AGENT_ESCROW_ADDRESS,
        ESCROW_ABI,
        provider
      );

      const session = await escrow.getSession(sessionId);
      return {
        user: session.user,
        amount: ethers.formatEther(session.amount),
        startTime: Number(session.startTime),
        completed: session.completed
      };
    } catch (err) {
      console.error('Error checking session:', err);
      return null;
    }
  };

  return {
    createPaymentSession,
    checkSession,
    isProcessing,
    error,
    sessionId
  };
}
