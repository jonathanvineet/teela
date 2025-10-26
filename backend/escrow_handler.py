"""
Escrow contract handler for TEELA
Manages payment distribution after chat sessions
"""
import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

# Contract addresses
ESCROW_ADDRESS = "0x177994988621cF33676CFAE86A9176e553c1D879"
SCORING_ADDRESS = "0xbD3616c1c430054eD01c1E083742ddFD3b7DeA81"

# Contract ABIs
ESCROW_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
            {"internalType": "address[]", "name": "recipients", "type": "address[]"},
            {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"},
            {"internalType": "string[]", "name": "agentIds", "type": "string[]"},
            {"internalType": "uint256[]", "name": "scores", "type": "uint256[]"}
        ],
        "name": "distributePayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
        "name": "getSession",
        "outputs": [
            {"internalType": "address", "name": "user", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "uint256", "name": "startTime", "type": "uint256"},
            {"internalType": "bool", "name": "completed", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

class EscrowHandler:
    def __init__(self):
        # Connect to Sepolia
        rpc_url = os.getenv('WEB3_PROVIDER_URL', 'https://ethereum-sepolia-rpc.publicnode.com')
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        # Load private key
        private_key = os.getenv('PRIVATE_KEY')
        if not private_key:
            raise ValueError("PRIVATE_KEY not found in environment")
        
        self.account = Account.from_key(private_key)
        print(f"✅ Escrow handler initialized with account: {self.account.address}")
        
        # Create contract instance
        self.escrow = self.w3.eth.contract(
            address=Web3.to_checksum_address(ESCROW_ADDRESS),
            abi=ESCROW_ABI
        )
    
    def get_session(self, session_id):
        """Get session details from contract"""
        try:
            session = self.escrow.functions.getSession(session_id).call()
            return {
                'user': session[0],
                'amount': session[1],
                'startTime': session[2],
                'completed': session[3]
            }
        except Exception as e:
            print(f"❌ Error getting session: {e}")
            return None
    
    def distribute_payment(self, session_id, agent_wallets, agent_amounts, agent_ids, agent_scores):
        """
        Distribute payment to agents after session ends
        
        Args:
            session_id: The session ID from contract
            agent_wallets: List of agent wallet addresses
            agent_amounts: List of amounts in ETH (will be converted to wei)
            agent_ids: List of agent IDs for scoring
            agent_scores: List of scores (0-100) for each agent
        """
        try:
            # Validate inputs
            if not (len(agent_wallets) == len(agent_amounts) == len(agent_ids) == len(agent_scores)):
                raise ValueError("All arrays must have the same length")
            
            # Convert amounts to wei
            amounts_wei = [self.w3.to_wei(amount, 'ether') for amount in agent_amounts]
            
            # Convert addresses to checksum format
            recipients = [Web3.to_checksum_address(addr) for addr in agent_wallets]
            
            print(f"📊 Distributing payment for session {session_id}")
            print(f"   Recipients: {len(recipients)}")
            print(f"   Total amount: {sum(agent_amounts)} ETH")
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            tx = self.escrow.functions.distributePayment(
                session_id,
                recipients,
                amounts_wei,
                agent_ids,
                agent_scores
            ).build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            print(f"📤 Transaction sent: {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                print(f"✅ Payment distributed successfully!")
                return {
                    'success': True,
                    'txHash': tx_hash.hex(),
                    'gasUsed': receipt['gasUsed']
                }
            else:
                print(f"❌ Transaction failed")
                return {
                    'success': False,
                    'error': 'Transaction reverted'
                }
                
        except Exception as e:
            print(f"❌ Error distributing payment: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
escrow_handler = None

def get_escrow_handler():
    """Get or create escrow handler instance"""
    global escrow_handler
    if escrow_handler is None:
        escrow_handler = EscrowHandler()
    return escrow_handler
