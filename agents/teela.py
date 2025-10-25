"""
TEELA ORCHESTRATOR - BASED ON YOUR WORKING CLIENT CODE
=======================================================
Uses EXACT same patterns as your working financial_client.py
"""

from uagents import Agent, Context, Model
import subprocess
import time
import os
import json
import asyncio
from typing import Dict, List

# ============================================================================
# MESSAGE MODEL - EXACT SAME AS YOUR CLIENT
# ============================================================================

class Message(Model):
    message: str


# ============================================================================
# CONFIGURATION
# ============================================================================

SEED_PHRASE = "teela-orchestrator-production-2025"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AGENTS_JSON_FILE = os.path.join(SCRIPT_DIR, "agents_registry.json")
REGISTRATION_FILE = os.path.join(SCRIPT_DIR, ".teela_registered")


# ============================================================================
# LOAD AGENT REGISTRY
# ============================================================================

def load_agents_from_json() -> List[Dict]:
    if not os.path.exists(AGENTS_JSON_FILE):
        default_data = {"domain": {"financial": {"agents": []}}}
        with open(AGENTS_JSON_FILE, 'w') as f:
            json.dump(default_data, f, indent=2)
        return []
    
    try:
        with open(AGENTS_JSON_FILE, 'r') as f:
            data = json.load(f)
        
        all_agents = []
        for domain, domain_data in data.get('domain', {}).items():
            for agent in domain_data.get('agents', []):
                if agent.get('status') == 'active':
                    all_agents.append(agent)
        
        return all_agents
    except Exception as e:
        print(f"❌ Error loading agents: {e}")
        return []


# ============================================================================
# CREATE TEELA AGENT - EXACT SAME AS YOUR CLIENT
# ============================================================================

teela = Agent(
    name="teela_orchestrator",
    seed=SEED_PHRASE,
    port=8000,
    mailbox=True
)

print(f"\n{'='*70}")
print(f"🤖 TEELA ORCHESTRATOR")
print(f"{'='*70}")
print(f"📍 Agent Address: {teela.address}")
print(f"💰 Wallet Address: {teela.wallet.address()}")
print(f"{'='*70}\n")

# Load agents
ACTIVE_AGENTS = load_agents_from_json()
print(f"📋 Loaded {len(ACTIVE_AGENTS)} active agents")
for agent in ACTIVE_AGENTS:
    print(f"   • {agent['name']} - {agent['address']}")


# ============================================================================
# REGISTRATION & FUNDING - EXACT SAME AS YOUR CLIENT
# ============================================================================

if os.path.exists(REGISTRATION_FILE):
    try:
        with open(REGISTRATION_FILE, 'r') as f:
            reg_data = json.load(f)
            if reg_data.get('agent_address') == teela.address:
                print(f"✅ TEELA already registered and funded!")
                print(f"📍 Skipping funding and registration...\n")
                print(f"{'='*70}")
                print(f"🚀 STARTING AGENT WITH MAILBOX")
                print(f"{'='*70}\n")
            else:
                os.remove(REGISTRATION_FILE)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"⚠️ Registration file corrupted: {e}")
        print(f"🔄 Removing corrupted file and re-registering...")
        os.remove(REGISTRATION_FILE)

if not os.path.exists(REGISTRATION_FILE):
    wallet_address = teela.wallet.address()
    
    print(f"{'='*70}")
    print(f"💰 FIRST TIME SETUP: FUNDING WALLET")
    print(f"{'='*70}\n")
    
    try:
        print(f"🔄 Requesting funds from faucet...")
        result = subprocess.run([
            'curl', '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-d', f'{{"address":"{wallet_address}"}}',
            'https://faucet-dorado.fetch.ai/api/v3/claims'
        ], capture_output=True, text=True)
        
        if '"status":"ok"' in result.stdout:
            print(f"✅ Wallet funded successfully!")
            print(f"📝 Response: {result.stdout}\n")
        else:
            print(f"⚠️ Funding response: {result.stdout}\n")
    except Exception as e:
        print(f"❌ Auto-funding failed: {e}")
    
    print(f"{'='*70}")
    print(f"⏳ Waiting 15 seconds for funding to process...")
    print(f"{'='*70}\n")
    time.sleep(15)
    
    print(f"{'='*70}")
    print(f"🚀 STARTING AGENT (First Registration)")
    print(f"{'='*70}")
    print(f"\n⚠️ IMPORTANT: This will register on Almanac contract")
    print(f"   Click Inspector URL and connect via Mailbox")
    print(f"   Wait for: 'Successfully registered as mailbox agent'\n")
    print(f"{'='*70}\n")
    
    @teela.on_event("startup")
    async def save_registration(ctx: Context):
        await asyncio.sleep(10)
        with open(REGISTRATION_FILE, 'w') as f:
            json.dump({
                'agent_address': teela.address,
                'wallet_address': teela.wallet.address(),
                'registered_at': time.time()
            }, f)
        ctx.logger.info("✅ Registration status saved")


# ============================================================================
# STARTUP EVENT - DEBUG INFO & HTTP MESSAGE PROCESSOR
# ============================================================================

@teela.on_event("startup")
async def debug_startup(ctx: Context):
    """Log what we're listening for"""
    await asyncio.sleep(2)
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🚀 TEELA ORCHESTRATOR STARTED")
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"📍 My Address: {ctx.agent.address}")
    ctx.logger.info(f"📋 Monitoring {len(ACTIVE_AGENTS)} domain agents:")
    for agent in ACTIVE_AGENTS:
        ctx.logger.info(f"   • {agent['name']}: {agent['address']}")
    ctx.logger.info(f"\n💬 Ready to receive messages from:")
    ctx.logger.info(f"   • Users (any address not in agent list)")
    ctx.logger.info(f"   • Domain agents (responses)")
    ctx.logger.info(f"   • HTTP Bridge (frontend queries)")
    ctx.logger.info(f"{'='*70}\n")
    
    # Start HTTP message processor
    asyncio.create_task(process_http_messages(ctx))


async def process_http_messages(ctx: Context):
    """Process messages from HTTP bridge queue"""
    ctx.logger.info("🌐 HTTP message processor started\n")
    
    while True:
        try:
            # Check queue every 0.5 seconds
            await asyncio.sleep(0.5)
            
            if not http_message_queue.empty():
                msg_data = http_message_queue.get()
                user_message = msg_data['message']
                request_id = msg_data.get('request_id', f"http_req_{int(time.time() * 1000)}")
                
                ctx.logger.info(f"🌐 HTTP Bridge message received: {user_message[:50]}...")
                ctx.logger.info(f"🆔 Request ID: {request_id}")
                
                # Process as user query with special HTTP marker
                await handle_http_query(ctx, request_id, user_message)
                
        except Exception as e:
            ctx.logger.error(f"HTTP message processor error: {e}")


# ============================================================================
# ORCHESTRATION STATE - GLOBAL STORAGE
# ============================================================================

# Store responses per request
orchestration_state = {}

# Map agent addresses to agent info for quick lookup
AGENT_MAP = {agent['address']: agent for agent in ACTIVE_AGENTS}


# ============================================================================
# MESSAGE HANDLERS - USING YOUR WORKING PATTERN
# ============================================================================

@teela.on_message(model=Message)
async def handle_incoming_message(ctx: Context, sender: str, msg: Message):
    """
    Handle ALL incoming messages - routes based on sender
    THIS IS YOUR WORKING PATTERN!
    """
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🔔 MESSAGE RECEIVED!")
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"From: {sender}")
    ctx.logger.info(f"Message: {msg.message[:100]}")
    ctx.logger.info(f"Is Domain Agent: {sender in AGENT_MAP}")
    ctx.logger.info(f"{'='*70}\n")
    
    # Check if this is from one of our domain agents
    if sender in AGENT_MAP:
        # Response FROM domain agent
        ctx.logger.info(f"🟢 Response received from {AGENT_MAP[sender]['name']}")
        await handle_agent_response(ctx, sender, msg)
    else:
        # Query FROM user
        ctx.logger.info(f"🔵 User query from: {sender[:30]}...")
        await handle_user_query(ctx, sender, msg)


async def handle_http_query(ctx: Context, request_id: str, user_query: str):
    """
    HTTP QUERY - Start orchestration for HTTP frontend
    """
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🌐 NEW HTTP QUERY")
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"Request ID: {request_id}")
    ctx.logger.info(f"Query: {user_query}")
    ctx.logger.info(f"{'='*70}\n")
    
    if not ACTIVE_AGENTS:
        ctx.logger.error("❌ No agents available!")
        http_responses[request_id] = {
            'status': 'error',
            'message': '⚠️ No financial advisors available.'
        }
        return
    
    # Initialize state for this request
    orchestration_state[request_id] = {
        'user': 'http_frontend',
        'query': user_query,
        'responses': {},
        'expected': len(ACTIVE_AGENTS),
        'start_time': time.time(),
        'is_http': True  # Mark as HTTP request
    }
    
    # DISPATCH TO ALL AGENTS
    ctx.logger.info(f"📤 DISPATCHING TO {len(ACTIVE_AGENTS)} AGENTS:")
    ctx.logger.info(f"{'='*70}\n")
    
    for agent_info in ACTIVE_AGENTS:
        agent_address = agent_info['address']
        agent_name = agent_info['name']
        
        ctx.logger.info(f"🔵 Sending to {agent_name}")
        ctx.logger.info(f"   Address: {agent_address}")
        ctx.logger.info(f"   Query: {user_query[:50]}...")
        
        try:
            await ctx.send(agent_address, Message(message=user_query))
            ctx.logger.info(f"   ✅ SENT SUCCESSFULLY!\n")
        except Exception as e:
            ctx.logger.error(f"   ❌ FAILED: {e}\n")
    
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"⏳ Waiting 20 seconds for responses...")
    ctx.logger.info(f"{'='*70}\n")
    
    # Schedule response aggregation
    asyncio.create_task(wait_and_aggregate(ctx, request_id, 20))


async def handle_user_query(ctx: Context, sender: str, msg: Message):
    """
    NEW USER QUERY - Start orchestration (for mailbox messages)
    """
    
    user_query = msg.message
    request_id = f"req_{int(time.time() * 1000)}"
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🎯 NEW USER QUERY")
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"Request ID: {request_id}")
    ctx.logger.info(f"From: {sender}")
    ctx.logger.info(f"Query: {user_query}")
    ctx.logger.info(f"{'='*70}\n")
    
    if not ACTIVE_AGENTS:
        ctx.logger.error("❌ No agents available!")
        await ctx.send(sender, Message(message="⚠️ No financial advisors available."))
        return
    
    # Initialize state for this request
    orchestration_state[request_id] = {
        'user': sender,
        'query': user_query,
        'responses': {},
        'expected': len(ACTIVE_AGENTS),
        'start_time': time.time()
    }
    
    # DISPATCH TO ALL AGENTS - EXACTLY LIKE YOUR CLIENT SENDS
    ctx.logger.info(f"📤 DISPATCHING TO {len(ACTIVE_AGENTS)} AGENTS:")
    ctx.logger.info(f"{'='*70}\n")
    
    for agent_info in ACTIVE_AGENTS:
        agent_address = agent_info['address']
        agent_name = agent_info['name']
        
        ctx.logger.info(f"🔵 Sending to {agent_name}")
        ctx.logger.info(f"   Address: {agent_address}")
        ctx.logger.info(f"   Query: {user_query[:50]}...")
        
        try:
            await ctx.send(agent_address, Message(message=user_query))
            ctx.logger.info(f"   ✅ SENT SUCCESSFULLY!\n")
        except Exception as e:
            ctx.logger.error(f"   ❌ FAILED: {e}\n")
    
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"⏳ Waiting 20 seconds for responses...")
    ctx.logger.info(f"{'='*70}\n")
    
    # Schedule response aggregation
    asyncio.create_task(wait_and_aggregate(ctx, request_id, 20))


async def handle_agent_response(ctx: Context, sender: str, msg: Message):
    """
    RESPONSE FROM DOMAIN AGENT - USING YOUR WORKING PATTERN
    """
    
    agent_info = AGENT_MAP[sender]
    agent_name = agent_info['name']
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🤖 {agent_name} Response:")
    ctx.logger.info(f"\n{msg.message[:200]}...")  # First 200 chars
    ctx.logger.info(f"{'='*70}\n")
    
    # Find which request this belongs to (latest active request)
    active_requests = [rid for rid, state in orchestration_state.items() 
                       if sender not in state['responses']]
    
    if not active_requests:
        ctx.logger.info(f"⚠️ No active request for {agent_name} (may be late response)")
        return
    
    # Use the most recent request
    request_id = max(active_requests)
    state = orchestration_state[request_id]
    
    # Store response
    response_time = time.time() - state['start_time']
    state['responses'][sender] = {
        'agent_name': agent_name,
        'response': msg.message,
        'specialty': agent_info.get('speciality', 'general'),
        'time': response_time
    }
    
    received = len(state['responses'])
    expected = state['expected']
    
    ctx.logger.info(f"✅ Stored response from {agent_name}")
    ctx.logger.info(f"📊 Progress: {received}/{expected} responses")
    ctx.logger.info(f"⏱️  Time: {response_time:.1f}s\n")


async def wait_and_aggregate(ctx: Context, request_id: str, wait_time: int):
    """
    Wait for responses then aggregate and send final response
    """
    
    await asyncio.sleep(wait_time)
    
    if request_id not in orchestration_state:
        ctx.logger.info(f"⚠️ Request {request_id} already processed")
        return
    
    state = orchestration_state[request_id]
    user_address = state['user']
    original_query = state['query']
    responses = state['responses']
    
    ctx.logger.info(f"\n{'='*70}")
    ctx.logger.info(f"🧠 AGGREGATING RESPONSES")
    ctx.logger.info(f"{'='*70}")
    ctx.logger.info(f"Received: {len(responses)}/{state['expected']}")
    ctx.logger.info(f"{'='*70}\n")
    
    if not responses:
        ctx.logger.info("⚠️ No responses received")
        final_message = "Sorry, I couldn't get responses from the advisors. Please try again."
    else:
        # Create beautiful final response
        final_message = create_final_response(original_query, list(responses.values()))
    
    # Check if this is an HTTP request
    is_http = state.get('is_http', False)
    
    if is_http:
        # Store response for HTTP polling
        ctx.logger.info(f"📤 Storing response for HTTP request")
        ctx.logger.info(f"   Length: {len(final_message)} chars\n")
        
        http_responses[request_id] = {
            'status': 'success',
            'message': final_message,
            'agent_count': len(responses),
            'timestamp': time.time()
        }
        
        ctx.logger.info(f"✅ Response stored for HTTP polling!\n")
    else:
        # SEND BACK TO USER via mailbox
        ctx.logger.info(f"📤 Sending final response to user")
        ctx.logger.info(f"   Length: {len(final_message)} chars\n")
        
        try:
            await ctx.send(user_address, Message(message=final_message))
            ctx.logger.info(f"✅ Final response sent!\n")
        except Exception as e:
            ctx.logger.error(f"❌ Failed to send: {e}\n")
    
    # Cleanup
    del orchestration_state[request_id]


def create_final_response(query: str, responses: List[Dict]) -> str:
    """Create synthesized response"""
    
    parts = [
        "╔══════════════════════════════════════════════════════════════╗",
        "║          🎯 TEELA AI FINANCIAL ADVISORY REPORT              ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        f"📋 YOUR QUERY:",
        f"   {query}",
        "",
        f"🧠 CONSULTED {len(responses)} SPECIALIZED FINANCIAL ADVISORS",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "💡 EXPERT RECOMMENDATIONS:",
        ""
    ]
    
    # Sort by response time (fastest first)
    responses.sort(key=lambda x: x['time'])
    
    for i, resp in enumerate(responses, 1):
        parts.extend([
            f"{i}. {resp['agent_name'].upper()} ({resp['specialty']})",
            f"   Response time: {resp['time']:.1f}s",
            "",
            f"{resp['response']}",
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            ""
        ])
    
    parts.extend([
        "",
        "⚠️  DISCLAIMER:",
        "This is AI-generated advice from multiple specialized agents.",
        "Please consult a certified financial advisor for personalized",
        "recommendations tailored to your specific situation.",
        "",
        "Powered by TEELA Multi-Agent Orchestrator 🤖"
    ])
    
    return "\n".join(parts)


# ============================================================================
# HTTP BRIDGE FOR FRONTEND (Port 8010)
# ============================================================================

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
from queue import Queue

# Queue to pass messages from HTTP to agent
http_message_queue = Queue()

# Store responses for HTTP requests (request_id -> response)
http_responses = {}

class _ChatHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress HTTP logs
    
    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            body = self.rfile.read(length) if length > 0 else b'{}'
            data = json.loads(body.decode('utf-8') or '{}')
            msg = str(data.get('message') or '').strip()
            
            if not msg:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'message required'}).encode('utf-8'))
                return
            
            # Generate request ID
            request_id = f"http_req_{int(time.time() * 1000)}"
            
            # Put message in queue for agent to process
            http_message_queue.put({
                'message': msg,
                'request_id': request_id,
                'timestamp': time.time()
            })
            
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'reply': json.dumps({
                    'message': 'Query received. TEELA will orchestrate responses.',
                    'agent_count': len(ACTIVE_AGENTS),
                    'status': 'processing',
                    'request_id': request_id
                })
            }).encode('utf-8'))
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_GET(self):
        global ACTIVE_AGENTS, AGENT_MAP
        
        # Check for response polling: /response?request_id=xxx
        if self.path.startswith('/response'):
            try:
                from urllib.parse import urlparse, parse_qs
                query_params = parse_qs(urlparse(self.path).query)
                request_id = query_params.get('request_id', [None])[0]
                
                if not request_id:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'request_id required'}).encode('utf-8'))
                    return
                
                # Check if response is ready
                if request_id in http_responses:
                    response_data = http_responses[request_id]
                    self._set_headers(200)
                    self.wfile.write(json.dumps(response_data).encode('utf-8'))
                    # Clean up old response
                    del http_responses[request_id]
                elif request_id in orchestration_state:
                    # Still processing
                    self._set_headers(200)
                    self.wfile.write(json.dumps({
                        'status': 'processing',
                        'message': 'Agents are still responding...'
                    }).encode('utf-8'))
                else:
                    # Not found
                    self._set_headers(404)
                    self.wfile.write(json.dumps({
                        'status': 'not_found',
                        'message': 'Request not found or expired'
                    }).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        
        elif self.path == '/status':
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'active_agents': len(ACTIVE_AGENTS),
                'active_requests': len(orchestration_state),
                'address': str(teela.address)
            }).encode('utf-8'))
        elif self.path == '/reload':
            ACTIVE_AGENTS = load_agents_from_json()
            AGENT_MAP = {agent['address']: agent for agent in ACTIVE_AGENTS}
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'success': True,
                'agent_count': len(ACTIVE_AGENTS)
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))


def start_http_bridge(port: int = 8010):
    server = ThreadingHTTPServer(('127.0.0.1', port), _ChatHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[HTTP Bridge] Listening on http://127.0.0.1:{port}")
    print(f"[HTTP Bridge] Endpoints: POST /chat, GET /status, GET /reload\n")
    return server


# ============================================================================
# RUN TEELA - EXACT SAME AS YOUR CLIENT
# ============================================================================

if __name__ == "__main__":
    print(f"{'='*70}")
    print(f"🚀 TEELA ORCHESTRATOR READY")
    print(f"{'='*70}")
    print(f"📍 Agent Address: {teela.address}")
    print(f"📋 Active Agents: {len(ACTIVE_AGENTS)}")
    print(f"📫 Mailbox: Enabled")
    print(f"🌐 HTTP Bridge: Port 8010")
    print(f"{'='*70}\n")
    
    # Start HTTP bridge
    try:
        start_http_bridge(8010)
    except Exception as e:
        print(f"[HTTP Bridge] Failed to start: {e}\n")
    
    print(f"⏳ TEELA is now listening for queries...\n")
    print(f"{'='*70}\n")
    
    teela.run()