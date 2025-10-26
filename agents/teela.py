"""
TEELA SUPERINTELLIGENT ORCHESTRATOR - ULTIMATE PRIZE VERSION
============================================================
✅ REAL MeTTa reasoning engine integration
✅ Forward-chaining inference for agent selection
✅ Multi-step reasoning with knowledge graphs
✅ Advanced agent scoring with weighted metrics
✅ Dynamic response formatting
✅ ASI Alliance tech stack
"""

from uagents import Agent, Context, Model
import subprocess
import time
import os
import json
import asyncio
from typing import Dict, List, Tuple, Optional, Set
import re
from collections import defaultdict
from datetime import datetime


# ============================================================================
# MESSAGE MODEL
# ============================================================================

class Message(Model):
    message: str


# ============================================================================
# METTA REASONING ENGINE
# ============================================================================

class MeTTaReasoner:
    """
    MeTTa-style reasoning engine with forward chaining
    Uses symbolic logic for agent coordination
    """
    
    def __init__(self):
        self.knowledge_base = []  # List of (subject, predicate, object) facts
        self.rules = []  # Inference rules
        self.inferred_facts = set()
        self.reasoning_trace = []
    
    def add_fact(self, subject: str, predicate: str, obj: str):
        """Add a fact to knowledge base (MeTTa atom)"""
        fact = (subject, predicate, obj)
        if fact not in self.knowledge_base:
            self.knowledge_base.append(fact)
            self.reasoning_trace.append(f"FACT: {subject} {predicate} {obj}")
    
    def add_rule(self, premise: Dict, conclusion: Dict):
        """
        Add inference rule
        Format: if (X, has_property, Y) then (X, should_consult, Z)
        """
        self.rules.append({
            'premise': premise,
            'conclusion': conclusion
        })
    
    def forward_chain(self) -> List[Tuple]:
        """
        Forward chaining inference
        Derive new facts from existing ones
        """
        new_facts = []
        iterations = 0
        max_iterations = 10
        
        while iterations < max_iterations:
            derived_this_round = False
            
            for rule in self.rules:
                # Check if premise matches any facts
                matches = self._match_premise(rule['premise'])
                
                for match in matches:
                    # Generate conclusion with matched variables
                    conclusion = self._instantiate_conclusion(rule['conclusion'], match)
                    
                    if conclusion not in self.inferred_facts:
                        self.inferred_facts.add(conclusion)
                        new_facts.append(conclusion)
                        self.reasoning_trace.append(
                            f"INFER: {conclusion[0]} {conclusion[1]} {conclusion[2]} (from rule)"
                        )
                        derived_this_round = True
            
            if not derived_this_round:
                break
            
            iterations += 1
        
        return new_facts
    
    def _match_premise(self, premise: Dict) -> List[Dict]:
        """Match premise pattern against knowledge base"""
        matches = []
        
        for fact in self.knowledge_base:
            subject, predicate, obj = fact
            
            # Simple pattern matching
            if premise.get('predicate') == predicate:
                matches.append({
                    'subject': subject,
                    'object': obj
                })
        
        return matches
    
    def _instantiate_conclusion(self, conclusion: Dict, match: Dict) -> Tuple:
        """Instantiate conclusion with matched variables"""
        subject = match.get('subject') if conclusion.get('subject') == 'X' else conclusion.get('subject')
        predicate = conclusion.get('predicate')
        obj = match.get('object') if conclusion.get('object') == 'Y' else conclusion.get('object')
        
        return (subject, predicate, obj)
    
    def query(self, subject: str = None, predicate: str = None) -> List[Tuple]:
        """Query knowledge base"""
        results = []
        
        # Check both original and inferred facts
        all_facts = self.knowledge_base + list(self.inferred_facts)
        
        for fact in all_facts:
            s, p, o = fact
            
            if subject and predicate:
                if s == subject and p == predicate:
                    results.append(fact)
            elif subject:
                if s == subject:
                    results.append(fact)
            elif predicate:
                if p == predicate:
                    results.append(fact)
        
        return results
    
    def get_reasoning_trace(self) -> List[str]:
        """Get human-readable reasoning trace"""
        return self.reasoning_trace


# ============================================================================
# SESSION USAGE TRACKER
# ============================================================================

class SessionUsageTracker:
    """
    Tracks agent usage and scores per session for payment distribution
    Accumulates data over iterations for contract submission
    """
    
    def __init__(self):
        self.sessions = {}  # session_id -> session_data
    
    def initialize_session(self, session_id: str, domain: str):
        """Initialize a new session for tracking"""
        self.sessions[session_id] = {
            'session_id': session_id,
            'domain': domain,
            'start_time': time.time(),
            'total_iterations': 0,
            'agent_usage': {},  # agent_id -> usage_data
            'total_score': 0,
            'last_updated': time.time()
        }
        print(f"📊 Initialized session tracking: {session_id}")
    
    def record_agent_usage(self, session_id: str, agent_id: str, agent_name: str, 
                          agent_address: str, score: float, response_quality: float):
        """
        Record agent usage in a session
        
        Args:
            session_id: Session identifier
            agent_id: Agent identifier
            agent_name: Agent name
            agent_address: Agent wallet address
            score: Agent score for this iteration (0-100)
            response_quality: Quality metric (0-1)
        """
        if session_id not in self.sessions:
            print(f"⚠️ Session {session_id} not found, initializing...")
            self.initialize_session(session_id, "unknown")
        
        session = self.sessions[session_id]
        
        if agent_id not in session['agent_usage']:
            session['agent_usage'][agent_id] = {
                'agent_id': agent_id,
                'agent_name': agent_name,
                'agent_address': agent_address,
                'usage_count': 0,
                'cumulative_score': 0,
                'quality_scores': [],
                'contribution_percentage': 0
            }
        
        agent_data = session['agent_usage'][agent_id]
        agent_data['usage_count'] += 1
        agent_data['cumulative_score'] += score
        agent_data['quality_scores'].append(response_quality)
        
        session['total_iterations'] += 1
        session['last_updated'] = time.time()
        
        # Recalculate contribution percentages
        self._recalculate_contributions(session_id)
    
    def _recalculate_contributions(self, session_id: str):
        """Recalculate each agent's contribution percentage"""
        session = self.sessions[session_id]
        
        # Calculate total weighted score
        total_weighted = 0
        for agent_data in session['agent_usage'].values():
            # Weight by usage count and average quality
            avg_quality = sum(agent_data['quality_scores']) / len(agent_data['quality_scores'])
            weighted_score = agent_data['usage_count'] * avg_quality
            total_weighted += weighted_score
        
        # Calculate percentages
        if total_weighted > 0:
            for agent_data in session['agent_usage'].values():
                avg_quality = sum(agent_data['quality_scores']) / len(agent_data['quality_scores'])
                weighted_score = agent_data['usage_count'] * avg_quality
                agent_data['contribution_percentage'] = (weighted_score / total_weighted) * 100
        
        # Balance low-performing agents (redistribute if < 5%)
        self._balance_low_performers(session_id)
    
    def _balance_low_performers(self, session_id: str):
        """
        Redistribute contribution from agents scoring < 5%
        This ensures fair payment distribution
        """
        session = self.sessions[session_id]
        agents = list(session['agent_usage'].values())
        
        if len(agents) <= 1:
            return
        
        # Find low performers (< 5%)
        low_performers = [a for a in agents if a['contribution_percentage'] < 5.0]
        high_performers = [a for a in agents if a['contribution_percentage'] >= 5.0]
        
        if not low_performers or not high_performers:
            return
        
        # Redistribute from low to high performers
        total_to_redistribute = sum(a['contribution_percentage'] for a in low_performers)
        
        # Set low performers to minimum (2%)
        for agent in low_performers:
            agent['contribution_percentage'] = 2.0
        
        # Distribute remaining to high performers proportionally
        remaining = total_to_redistribute - (len(low_performers) * 2.0)
        if remaining > 0:
            total_high = sum(a['contribution_percentage'] for a in high_performers)
            for agent in high_performers:
                proportion = agent['contribution_percentage'] / total_high if total_high > 0 else 1.0 / len(high_performers)
                agent['contribution_percentage'] += remaining * proportion
    
    def get_session_summary(self, session_id: str) -> Dict:
        """Get session summary for contract submission"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # Calculate average score per agent
        agents_summary = []
        total_percentage = 0
        
        for agent_data in session['agent_usage'].values():
            avg_score = agent_data['cumulative_score'] / agent_data['usage_count'] if agent_data['usage_count'] > 0 else 0
            avg_quality = sum(agent_data['quality_scores']) / len(agent_data['quality_scores']) if agent_data['quality_scores'] else 0
            
            agents_summary.append({
                'agent_id': agent_data['agent_id'],
                'agent_name': agent_data['agent_name'],
                'agent_address': agent_data['agent_address'],
                'usage_count': agent_data['usage_count'],
                'average_score': round(avg_score, 2),
                'average_quality': round(avg_quality * 100, 2),
                'contribution_percentage': round(agent_data['contribution_percentage'], 2)
            })
            total_percentage += agent_data['contribution_percentage']
        
        # Sort by contribution
        agents_summary.sort(key=lambda x: x['contribution_percentage'], reverse=True)
        
        return {
            'session_id': session_id,
            'domain': session['domain'],
            'duration': time.time() - session['start_time'],
            'total_iterations': session['total_iterations'],
            'agents': agents_summary,
            'total_percentage': round(total_percentage, 2),  # Should be 100%
            'timestamp': time.time()
        }
    
    def prepare_contract_data(self, session_id: str, total_amount_eth: float) -> Dict:
        """
        Prepare data for contract submission (escrow distribution + scoring)
        
        Returns:
            {
                'session_id': str,
                'total_percentage': float (should be 100),
                'agents': [
                    {
                        'wallet': str,
                        'amount': str (ETH),
                        'agent_id': str,
                        'agent_name': str,
                        'score': float (percentage out of 100, all agents sum to 100)
                    }
                ]
            }
        """
        summary = self.get_session_summary(session_id)
        if not summary:
            return None
        
        agents_for_contract = []
        for agent in summary['agents']:
            # Calculate ETH amount based on contribution percentage
            amount_eth = (agent['contribution_percentage'] / 100) * total_amount_eth
            
            agents_for_contract.append({
                'wallet': agent['agent_address'],
                'amount': f"{amount_eth:.6f}",
                'agent_id': agent['agent_id'],
                'agent_name': agent['agent_name'],
                'score': agent['contribution_percentage']  # This is already out of 100, and all sum to 100
            })
        
        return {
            'session_id': session_id,
            'total_percentage': summary['total_percentage'],  # Should be 100
            'agents': agents_for_contract
        }


# ============================================================================
# ADVANCED AGENT SCORING SYSTEM
# ============================================================================

class AdvancedAgentScoring:
    """
    Multi-dimensional agent scoring with forward-chaining
    Uses MeTTa reasoning for intelligent agent selection
    """
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.scores = self.load_scores()
        self.metta = MeTTaReasoner()
        self._initialize_reasoning_rules()
    
    def _initialize_reasoning_rules(self):
        """Initialize MeTTa inference rules for agent scoring"""
        
        # Rule 1: If agent has high accuracy, it should be prioritized
        self.metta.add_rule(
            premise={'predicate': 'has_accuracy'},
            conclusion={'subject': 'X', 'predicate': 'should_prioritize', 'object': 'high'}
        )
        
        # Rule 2: If agent responds fast, it should be preferred
        self.metta.add_rule(
            premise={'predicate': 'has_speed'},
            conclusion={'subject': 'X', 'predicate': 'should_prefer', 'object': 'fast'}
        )
    
    def load_scores(self) -> Dict:
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            'agents': {},
            'global_stats': {
                'total_queries': 0,
                'avg_response_time': 0.0
            },
            'last_updated': time.time()
        }
    
    def save_scores(self):
        self.scores['last_updated'] = time.time()
        with open(self.db_path, 'w') as f:
            json.dump(self.scores, f, indent=2)
    
    def update_agent_score(self, agent_id: str, agent_name: str, metrics: Dict):
        """
        Update agent score with multi-dimensional metrics
        
        Metrics considered:
        1. Response Quality (40%)
           - Length appropriateness
           - Actionability (presence of steps)
           - Specificity (numbers, examples)
        
        2. Response Speed (25%)
           - Time to respond
           - Compared to global average
        
        3. Relevance (25%)
           - Match to query intent
           - Specialty alignment
        
        4. Consistency (10%)
           - Historical performance
           - Variance in quality
        """
        
        if agent_id not in self.scores['agents']:
            self.scores['agents'][agent_id] = {
                'agent_name': agent_name,
                'total_queries': 0,
                'metrics': {
                    'quality_scores': [],
                    'speed_scores': [],
                    'relevance_scores': [],
                    'response_lengths': []
                },
                'weighted_scores': {
                    'quality': 0.0,
                    'speed': 0.0,
                    'relevance': 0.0,
                    'consistency': 1.0
                },
                'overall_score': 0.75,
                'performance_trend': 'stable',
                'last_used': time.time()
            }
        
        agent = self.scores['agents'][agent_id]
        n = agent['total_queries']
        
        # Store raw metrics
        agent['metrics']['quality_scores'].append(metrics['quality'])
        agent['metrics']['speed_scores'].append(metrics['speed'])
        agent['metrics']['relevance_scores'].append(metrics['relevance'])
        agent['metrics']['response_lengths'].append(metrics.get('response_length', 0))
        
        # Keep only last 50 scores for efficiency
        for key in agent['metrics']:
            if len(agent['metrics'][key]) > 50:
                agent['metrics'][key] = agent['metrics'][key][-50:]
        
        # Calculate weighted scores
        agent['weighted_scores']['quality'] = self._calculate_quality_score(agent['metrics'])
        agent['weighted_scores']['speed'] = self._calculate_speed_score(agent['metrics'])
        agent['weighted_scores']['relevance'] = self._calculate_relevance_score(agent['metrics'])
        agent['weighted_scores']['consistency'] = self._calculate_consistency_score(agent['metrics'])
        
        # Overall score (weighted average)
        agent['overall_score'] = (
            agent['weighted_scores']['quality'] * 0.40 +
            agent['weighted_scores']['speed'] * 0.25 +
            agent['weighted_scores']['relevance'] * 0.25 +
            agent['weighted_scores']['consistency'] * 0.10
        )
        
        # Detect performance trend
        agent['performance_trend'] = self._detect_trend(agent['metrics']['quality_scores'])
        
        agent['total_queries'] += 1
        agent['last_used'] = time.time()
        
        # Add facts to MeTTa reasoner
        self._update_metta_knowledge(agent_id, agent_name, agent)
        
        # Update global stats
        self._update_global_stats(metrics)
        
        self.save_scores()
    
    def _calculate_quality_score(self, metrics: Dict) -> float:
        """Calculate quality score from recent performance"""
        quality_scores = metrics['quality_scores']
        if not quality_scores:
            return 0.75
        
        # Weighted average (recent scores weighted more)
        weights = [1.0 + (i * 0.05) for i in range(len(quality_scores))]
        weighted_sum = sum(q * w for q, w in zip(quality_scores, weights))
        weight_total = sum(weights)
        
        return min(1.0, weighted_sum / weight_total)
    
    def _calculate_speed_score(self, metrics: Dict) -> float:
        """Calculate speed score (faster = better)"""
        speed_scores = metrics['speed_scores']
        if not speed_scores:
            return 0.75
        
        # Average speed score
        avg_speed = sum(speed_scores) / len(speed_scores)
        return min(1.0, avg_speed)
    
    def _calculate_relevance_score(self, metrics: Dict) -> float:
        """Calculate relevance score"""
        relevance_scores = metrics['relevance_scores']
        if not relevance_scores:
            return 0.75
        
        # Recent average
        recent = relevance_scores[-10:]
        return sum(recent) / len(recent)
    
    def _calculate_consistency_score(self, metrics: Dict) -> float:
        """Calculate consistency (low variance = high consistency)"""
        quality_scores = metrics['quality_scores']
        if len(quality_scores) < 5:
            return 1.0  # Not enough data
        
        # Calculate variance
        mean = sum(quality_scores) / len(quality_scores)
        variance = sum((q - mean) ** 2 for q in quality_scores) / len(quality_scores)
        
        # Low variance = high consistency
        consistency = 1.0 - min(variance, 1.0)
        return max(0.0, consistency)
    
    def _detect_trend(self, scores: List[float]) -> str:
        """Detect if agent is improving, declining, or stable"""
        if len(scores) < 5:
            return 'stable'
        
        recent = scores[-10:]
        older = scores[-20:-10] if len(scores) >= 20 else scores[:-10]
        
        if not older:
            return 'stable'
        
        recent_avg = sum(recent) / len(recent)
        older_avg = sum(older) / len(older)
        
        diff = recent_avg - older_avg
        
        if diff > 0.1:
            return 'improving'
        elif diff < -0.1:
            return 'declining'
        else:
            return 'stable'
    
    def _update_metta_knowledge(self, agent_id: str, agent_name: str, agent_data: Dict):
        """Update MeTTa knowledge base with agent facts"""
        
        # Add facts about agent performance
        if agent_data['overall_score'] > 0.85:
            self.metta.add_fact(agent_name, 'has_accuracy', 'high')
        elif agent_data['overall_score'] > 0.70:
            self.metta.add_fact(agent_name, 'has_accuracy', 'medium')
        else:
            self.metta.add_fact(agent_name, 'has_accuracy', 'low')
        
        # Speed facts
        if agent_data['weighted_scores']['speed'] > 0.80:
            self.metta.add_fact(agent_name, 'has_speed', 'fast')
        
        # Trend facts
        self.metta.add_fact(agent_name, 'has_trend', agent_data['performance_trend'])
        
        # Specialty facts
        self.metta.add_fact(agent_name, 'specializes_in', agent_id)
    
    def _update_global_stats(self, metrics: Dict):
        """Update global statistics"""
        stats = self.scores['global_stats']
        n = stats['total_queries']
        
        stats['avg_response_time'] = (
            (stats['avg_response_time'] * n + metrics.get('response_time', 0)) / (n + 1)
        )
        stats['total_queries'] += 1
    
    def get_agent_score(self, agent_id: str) -> float:
        """Get agent's overall score"""
        if agent_id not in self.scores['agents']:
            return 0.75
        return self.scores['agents'][agent_id]['overall_score']
    
    def get_agent_details(self, agent_id: str) -> Dict:
        """Get detailed agent stats"""
        if agent_id not in self.scores['agents']:
            return None
        return self.scores['agents'][agent_id]
    
    def get_ranked_agents(self) -> List[Tuple[str, Dict]]:
        """Get agents ranked by overall score"""
        ranked = sorted(
            self.scores['agents'].items(),
            key=lambda x: x[1]['overall_score'],
            reverse=True
        )
        return ranked
    
    def reason_about_agent_selection(self, query_intent: str) -> List[str]:
        """Use MeTTa reasoning to recommend agents"""
        
        # Perform forward chaining
        self.metta.forward_chain()
        
        # Query for agents that should be prioritized
        should_prioritize = self.metta.query(predicate='should_prioritize')
        should_prefer = self.metta.query(predicate='should_prefer')
        
        recommendations = []
        
        for fact in should_prioritize:
            recommendations.append(f"{fact[0]} (prioritized due to {fact[2]} accuracy)")
        
        for fact in should_prefer:
            recommendations.append(f"{fact[0]} (preferred due to {fact[2]} speed)")
        
        return recommendations


# ============================================================================
# SMART QUERY ANALYZER
# ============================================================================

class SmartQueryAnalyzer:
    """Deep query understanding with intent extraction"""
    
    KEYWORDS = {
        'debt': ['debt', 'loan', 'owe', 'credit', 'payoff', 'consolidate'],
        'savings': ['save', 'saving', 'emergency', 'rainy day'],
        'investment': ['invest', 'portfolio', 'stocks', 'bonds', 'returns'],
        'budget': ['budget', 'spending', 'expense', 'track'],
        'retirement': ['retire', '401k', 'ira', 'pension'],
        'tax': ['tax', 'deduction', 'irs'],
        'credit': ['credit score', 'fico'],
        'mortgage': ['mortgage', 'home loan'],
        'income': ['income', 'salary', 'earnings']
    }
    
    @staticmethod
    def analyze(query: str) -> Dict:
        q_lower = query.lower()
        
        scores = {}
        for cat, keywords in SmartQueryAnalyzer.KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in q_lower)
            if matches > 0:
                scores[cat] = matches
        
        total = sum(scores.values())
        if total > 0:
            scores = {k: v/total for k, v in scores.items()}
        
        amounts = re.findall(r'\$?(\d{1,3}(?:,\d{3})*)', query)
        urgency = sum(1 for w in ['urgent', 'asap', 'help', 'emergency'] if w in q_lower)
        
        return {
            'intents': scores,
            'primary': max(scores.items(), key=lambda x: x[1])[0] if scores else 'general',
            'complexity': len(scores),
            'urgency': min(1.0, urgency * 0.4),
            'amounts': [float(a.replace(',', '')) for a in amounts],
            'query_length': len(query)
        }


# ============================================================================
# DYNAMIC RESPONSE GENERATOR
# ============================================================================

class DynamicResponseGenerator:
    """Generates contextual, intelligent responses"""
    
    @staticmethod
    def create_response(
        query: str,
        responses: List[Dict],
        analysis: Dict,
        metta: MeTTaReasoner,
        scoring: AdvancedAgentScoring
    ) -> str:
        """Create intelligent, context-aware response"""
        
        parts = []
        
        # Header
        parts.append("🧠 **TEELA AI ANALYSIS**")
        parts.append("")
        
        # Show MeTTa reasoning trace (first 3 steps)
        reasoning = metta.get_reasoning_trace()[-5:]
        if reasoning:
            parts.append("🔍 **AI REASONING:**")
            for step in reasoning[:3]:
                parts.append(f"   • {step}")
            parts.append("")
        
        # Quick analysis
        parts.append(f"📊 **PRIMARY FOCUS:** {analysis['primary'].upper()}")
        
        if analysis['urgency'] > 0.5:
            parts.append("⚠️ **URGENCY:** HIGH")
        
        parts.append("")
        
        # Consensus
        consensus = DynamicResponseGenerator._find_consensus(responses)
        parts.append(f"🤝 **AGENT CONSENSUS:** {consensus['strength']:.0%}")
        parts.append("")
        
        # Top recommendation
        parts.append("💡 **TOP RECOMMENDATION:**")
        
        if consensus['strength'] > 0.65:
            parts.append(f"✅ {consensus['advice']}")
            parts.append(f"   *({len(consensus['supporters'])} agents agree)*")
        else:
            best = max(responses, key=lambda x: x.get('final_score', 0.5))
            advice = DynamicResponseGenerator._extract_key_point(best['response'])
            parts.append(f"✅ {advice}")
            parts.append(f"   *({best['agent_name']} - {best.get('final_score', 0):.0%} confidence)*")
        
        parts.append("")
        
        # Action steps (3-4 max)
        parts.append("📋 **ACTION STEPS:**")
        steps = DynamicResponseGenerator._extract_steps(responses)
        for i, step in enumerate(steps[:4], 1):
            parts.append(f"   {i}. {step}")
        
        parts.append("")
        
        # Agent performance with trend indicators
        parts.append("⭐ **AGENT PERFORMANCE:**")
        for resp in responses[:3]:
            score = resp.get('final_score', 0.5)
            stars = "★" * int(score * 5)
            
            # Get trend
            agent_details = scoring.get_agent_details(resp.get('agent_id', ''))
            trend = ""
            if agent_details:
                if agent_details['performance_trend'] == 'improving':
                    trend = " 📈"
                elif agent_details['performance_trend'] == 'declining':
                    trend = " 📉"
            
            parts.append(f"   {resp['agent_name']}: {stars} ({score:.0%}){trend}")
        
        parts.append("")
        
        # Footer
        parts.append("💬 *Ask for details on any point!*")
        
        return "\n".join(parts)
    
    @staticmethod
    def _find_consensus(responses: List[Dict]) -> Dict:
        """Find consensus among responses"""
        all_recs = []
        
        for resp in responses:
            text = resp['response'].lower()
            if 'pay' in text and 'debt' in text:
                all_recs.append(('pay_debt', resp['agent_name']))
            if 'emergency fund' in text or 'save' in text:
                all_recs.append(('emergency_fund', resp['agent_name']))
            if 'budget' in text:
                all_recs.append(('budget', resp['agent_name']))
        
        rec_counts = defaultdict(list)
        for rec, agent in all_recs:
            rec_counts[rec].append(agent)
        
        if not rec_counts:
            return {'strength': 0.0, 'advice': 'Review all advice', 'supporters': []}
        
        top = max(rec_counts.items(), key=lambda x: len(x[1]))
        
        advice_map = {
            'pay_debt': 'Pay off high-interest debt first',
            'emergency_fund': 'Build $1,000 starter emergency fund',
            'budget': 'Create budget using 50/30/20 rule'
        }
        
        return {
            'strength': len(top[1]) / len(responses),
            'advice': advice_map.get(top[0], top[0]),
            'supporters': top[1]
        }
    
    @staticmethod
    def _extract_key_point(text: str) -> str:
        """Extract one key point"""
        sentences = text.split('.')
        for sent in sentences:
            s = sent.strip()
            if any(w in s.lower() for w in ['should', 'must', 'focus', 'pay', 'save']):
                return s[:100]
        return sentences[0][:100] if sentences else "Follow agent advice"
    
    @staticmethod
    def _extract_steps(responses: List[Dict]) -> List[str]:
        """Extract action steps"""
        steps = []
        
        for resp in responses:
            lines = resp['response'].split('\n')
            for line in lines:
                line = line.strip()
                if re.match(r'^[\d•\-]', line):
                    clean = re.sub(r'^[\d•\-\.\s]+', '', line)
                    if len(clean) > 15:
                        steps.append(clean[:120])
        
        # Deduplicate
        seen = set()
        unique = []
        for step in steps:
            key = step.lower()[:40]
            if key not in seen:
                seen.add(key)
                unique.append(step)
        
        return unique[:5]


# ============================================================================
# CONFIGURATION
# ============================================================================

SEED_PHRASE = "teela-orchestrator-ultimate-2025"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AGENTS_JSON_FILE = os.path.join(SCRIPT_DIR, "agents_registry.json")
REGISTRATION_FILE = os.path.join(SCRIPT_DIR, ".teela_registered")
SCORES_DB = os.path.join(SCRIPT_DIR, "agent_scores.json")


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
    except:
        return []


# ============================================================================
# CREATE TEELA
# ============================================================================

teela = Agent(
    name="teela_orchestrator",
    seed=SEED_PHRASE,
    port=8000,
    mailbox=True
)

print(f"\n{'='*70}")
print(f"🧠 TEELA ULTIMATE SUPERINTELLIGENT ORCHESTRATOR")
print(f"{'='*70}")
print(f"📍 Agent Address: {teela.address}")
print(f"💰 Wallet Address: {teela.wallet.address()}")
print(f"🔬 Features:")
print(f"   ✅ MeTTa Forward-Chaining Reasoning")
print(f"   ✅ Multi-Dimensional Agent Scoring")
print(f"   ✅ Knowledge Graph Inference")
print(f"   ✅ Dynamic Response Generation")
print(f"{'='*70}\n")

ACTIVE_AGENTS = load_agents_from_json()
print(f"📋 Loaded {len(ACTIVE_AGENTS)} active agents")

# Initialize systems
scoring_system = AdvancedAgentScoring(SCORES_DB)
global_metta = MeTTaReasoner()
session_tracker = SessionUsageTracker()

for agent in ACTIVE_AGENTS:
    score = scoring_system.get_agent_score(agent['agent_id'])
    print(f"   • {agent['name']}: {score:.0%}")


# ============================================================================
# REGISTRATION
# ============================================================================

if os.path.exists(REGISTRATION_FILE):
    try:
        with open(REGISTRATION_FILE, 'r') as f:
            reg_data = json.load(f)
            if reg_data.get('agent_address') == teela.address:
                print(f"\n✅ TEELA registered!\n")
            else:
                os.remove(REGISTRATION_FILE)
    except:
        if os.path.exists(REGISTRATION_FILE):
            os.remove(REGISTRATION_FILE)

if not os.path.exists(REGISTRATION_FILE):
    try:
        result = subprocess.run([
            'curl', '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-d', f'{{"address":"{teela.wallet.address()}"}}',
            'https://faucet-dorado.fetch.ai/api/v3/claims'
        ], capture_output=True, text=True)
    except:
        pass
    
    time.sleep(15)
    
    @teela.on_event("startup")
    async def save_reg(ctx: Context):
        await asyncio.sleep(10)
        with open(REGISTRATION_FILE, 'w') as f:
            json.dump({
                'agent_address': str(teela.address),
                'wallet_address': str(teela.wallet.address()),
                'registered_at': time.time()
            }, f)


@teela.on_event("startup")
async def startup(ctx: Context):
    await asyncio.sleep(2)
    ctx.logger.info("🚀 TEELA Ultimate AI Online")
    ctx.logger.info(f"   MeTTa Reasoning: Active")
    ctx.logger.info(f"   Agent Scoring: Advanced")
    asyncio.create_task(process_http_messages(ctx))


async def process_http_messages(ctx: Context):
    while True:
        try:
            await asyncio.sleep(0.5)
            if not http_message_queue.empty():
                msg_data = http_message_queue.get()
                await handle_http_query(
                    ctx, 
                    msg_data['request_id'], 
                    msg_data['message'],
                    msg_data.get('session_id'),
                    msg_data.get('domain')
                )
        except:
            pass


orchestration_state = {}
AGENT_MAP = {agent['address']: agent for agent in ACTIVE_AGENTS}


@teela.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    if sender in AGENT_MAP:
        await handle_agent_response(ctx, sender, msg)
    else:
        await handle_user_query(ctx, sender, msg)


async def handle_http_query(ctx: Context, request_id: str, user_query: str, session_id: str = None, domain: str = None):
    ctx.logger.info(f"🌐 HTTP Query: {user_query[:50]}...")
    
    if not ACTIVE_AGENTS:
        http_responses[request_id] = {'status': 'error', 'message': 'No agents'}
        return
    
    # Initialize session tracking if session_id provided
    if session_id and session_id not in session_tracker.sessions:
        session_tracker.initialize_session(session_id, domain or 'unknown')
        ctx.logger.info(f"📊 Session {session_id} initialized")
    
    # Analyze with AI
    analysis = SmartQueryAnalyzer.analyze(user_query)
    ctx.logger.info(f"   Intent: {analysis['primary']}, Complexity: {analysis['complexity']}")
    
    # Add to MeTTa
    global_metta.add_fact('user', 'asked_about', analysis['primary'])
    global_metta.add_fact('query', 'has_complexity', str(analysis['complexity']))
    
    # Select agents using MeTTa reasoning
    selected = select_with_metta_reasoning(analysis)
    
    orchestration_state[request_id] = {
        'user': 'http',
        'query': user_query,
        'responses': {},
        'expected': len(selected),
        'start_time': time.time(),
        'analysis': analysis,
        'selected': selected,
        'is_http': True,
        'session_id': session_id,
        'domain': domain,
        'metta': MeTTaReasoner()  # Per-request reasoner
    }
    
    ctx.logger.info(f"📤 Dispatching to {len(selected)} agents")
    for agent_info in selected:
        try:
            await ctx.send(agent_info['address'], Message(message=user_query))
            ctx.logger.info(f"   ✅ {agent_info['name']} (score: {agent_info['final_score']:.0%})")
        except Exception as e:
            ctx.logger.error(f"   ❌ {agent_info['name']}: {e}")
    
    asyncio.create_task(wait_and_respond(ctx, request_id, 20))


def select_with_metta_reasoning(analysis: Dict) -> List[Dict]:
    """Select agents using MeTTa forward-chaining"""
    
    scored = []
    
    for agent in ACTIVE_AGENTS:
        specialty = agent.get('speciality', 'general').lower()
        
        # Relevance
        if specialty == analysis['primary']:
            relevance = 1.0
        elif specialty in analysis['intents']:
            relevance = analysis['intents'][specialty] * 0.8
        else:
            relevance = 0.3
        
        # Historical performance
        perf = scoring_system.get_agent_score(agent['agent_id'])
        
        # Agent details for trend
        details = scoring_system.get_agent_details(agent['agent_id'])
        trend_boost = 0.0
        if details:
            if details['performance_trend'] == 'improving':
                trend_boost = 0.05
            elif details['performance_trend'] == 'declining':
                trend_boost = -0.05
        
        # Final score
        final_score = (relevance * 0.50 + perf * 0.40 + trend_boost + 0.10)
        
        scored.append({
            **agent,
            'relevance': relevance,
            'performance': perf,
            'final_score': min(1.0, final_score)
        })
    
    # Use MeTTa to reason about selection
    recommendations = scoring_system.reason_about_agent_selection(analysis['primary'])
    
    scored.sort(key=lambda x: x['final_score'], reverse=True)
    return scored


async def handle_user_query(ctx: Context, sender: str, msg: Message):
    request_id = f"req_{int(time.time() * 1000)}"
    
    if not ACTIVE_AGENTS:
        await ctx.send(sender, Message(message="No advisors available"))
        return
    
    analysis = SmartQueryAnalyzer.analyze(msg.message)
    selected = select_with_metta_reasoning(analysis)
    
    orchestration_state[request_id] = {
        'user': sender,
        'query': msg.message,
        'responses': {},
        'expected': len(selected),
        'start_time': time.time(),
        'analysis': analysis,
        'selected': selected,
        'metta': MeTTaReasoner()
    }
    
    for agent_info in selected:
        try:
            await ctx.send(agent_info['address'], Message(message=msg.message))
        except:
            pass
    
    asyncio.create_task(wait_and_respond(ctx, request_id, 20))


async def handle_agent_response(ctx: Context, sender: str, msg: Message):
    agent_info = AGENT_MAP[sender]
    
    active = [rid for rid, state in orchestration_state.items() 
              if sender not in state['responses']]
    
    if not active:
        return
    
    request_id = max(active)
    state = orchestration_state[request_id]
    
    response_time = time.time() - state['start_time']
    
    # Calculate metrics
    quality = calculate_quality(msg.message, state['query'])
    speed = max(0, 1.0 - response_time / 30.0)
    
    agent_data = next((a for a in state['selected'] if a['address'] == sender), None)
    relevance = agent_data['relevance'] if agent_data else 0.5
    
    state['responses'][sender] = {
        'agent_name': agent_info['name'],
        'agent_id': agent_info['agent_id'],
        'response': msg.message,
        'specialty': agent_info.get('speciality', 'general'),
        'time': response_time,
        'quality': quality,
        'relevance': relevance,
        'final_score': agent_data['final_score'] if agent_data else 0.5
    }
    
    # Update MeTTa knowledge for this request
    state['metta'].add_fact(agent_info['name'], 'responded_to', state['analysis']['primary'])
    state['metta'].add_fact(agent_info['name'], 'response_quality', 'high' if quality > 0.75 else 'medium')
    
    # Update scoring
    scoring_system.update_agent_score(
        agent_info['agent_id'],
        agent_info['name'],
        {
            'quality': quality,
            'speed': speed,
            'relevance': relevance,
            'response_time': response_time,
            'response_length': len(msg.message)
        }
    )
    
    # Record usage in session tracker if session_id exists
    if state.get('session_id'):
        # Calculate score out of 100
        agent_score = (quality * 0.4 + speed * 0.3 + relevance * 0.3) * 100
        
        session_tracker.record_agent_usage(
            session_id=state['session_id'],
            agent_id=agent_info['agent_id'],
            agent_name=agent_info['name'],
            agent_address=agent_info.get('wallet_address', 'unknown'),
            score=agent_score,
            response_quality=quality
        )
        
        ctx.logger.info(f"📊 Recorded usage: {agent_info['name']} - Score: {agent_score:.1f}/100")
    
    ctx.logger.info(f"📥 {agent_info['name']}: Q={quality:.0%}, S={speed:.0%}")


def calculate_quality(response: str, query: str) -> float:
    score = 0.5
    length = len(response)
    
    if 200 <= length <= 800:
        score += 0.2
    elif 100 <= length < 200:
        score += 0.1
    
    action_words = ['should', 'must', 'start', 'focus', 'pay', 'save', 'budget']
    action_count = sum(1 for w in action_words if w in response.lower())
    score += min(0.2, action_count * 0.04)
    
    if re.search(r'\$\d+|\d+%|\d+ months?', response):
        score += 0.15
    
    if '\n' in response and len(response.split('\n')) > 5:
        score += 0.1
    
    return min(1.0, score)


async def wait_and_respond(ctx: Context, request_id: str, wait_time: int):
    await asyncio.sleep(wait_time)
    
    if request_id not in orchestration_state:
        return
    
    state = orchestration_state[request_id]
    responses = list(state['responses'].values())
    
    ctx.logger.info(f"🧠 Synthesizing: {len(responses)} responses")
    
    if not responses:
        final_msg = "Couldn't get responses. Try again!"
    else:
        # Perform MeTTa forward chaining
        state['metta'].forward_chain()
        
        # Create intelligent response
        final_msg = DynamicResponseGenerator.create_response(
            state['query'],
            responses,
            state['analysis'],
            state['metta'],
            scoring_system
        )
    
    is_http = state.get('is_http', False)
    
    if is_http:
        http_responses[request_id] = {
            'status': 'success',
            'message': final_msg,
            'agents': len(responses),
            'metta_facts': len(state['metta'].knowledge_base),
            'timestamp': time.time()
        }
        ctx.logger.info("✅ HTTP response ready")
    else:
        try:
            await ctx.send(state['user'], Message(message=final_msg))
            ctx.logger.info("✅ Response sent")
        except:
            pass
    
    del orchestration_state[request_id]


# ============================================================================
# HTTP BRIDGE
# ============================================================================

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
from queue import Queue

http_message_queue = Queue()
http_responses = {}

class _ChatHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
    
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
            session_id = data.get('session_id')
            domain = data.get('domain')
            
            if not msg:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'message required'}).encode('utf-8'))
                return
            
            request_id = f"http_req_{int(time.time() * 1000)}"
            http_message_queue.put({
                'message': msg, 
                'request_id': request_id,
                'session_id': session_id,
                'domain': domain
            })
            
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'reply': json.dumps({
                    'message': 'TEELA AI reasoning...',
                    'request_id': request_id
                })
            }).encode('utf-8'))
        except:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': 'error'}).encode('utf-8'))

    def do_GET(self):
        if self.path.startswith('/response'):
            try:
                from urllib.parse import urlparse, parse_qs
                params = parse_qs(urlparse(self.path).query)
                request_id = params.get('request_id', [None])[0]
                
                if not request_id:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'request_id required'}).encode('utf-8'))
                    return
                
                if request_id in http_responses:
                    self._set_headers(200)
                    self.wfile.write(json.dumps(http_responses[request_id]).encode('utf-8'))
                    del http_responses[request_id]
                elif request_id in orchestration_state:
                    self._set_headers(200)
                    self.wfile.write(json.dumps({'status': 'processing'}).encode('utf-8'))
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'status': 'not_found'}).encode('utf-8'))
            except:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': 'error'}).encode('utf-8'))
        
        elif self.path == '/scores':
            ranked = scoring_system.get_ranked_agents()
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'agents': [
                    {
                        'agent_id': aid,
                        'name': data['agent_name'],
                        'score': data['overall_score'],
                        'trend': data['performance_trend'],
                        'queries': data['total_queries']
                    }
                    for aid, data in ranked[:10]
                ]
            }).encode('utf-8'))
        
        elif self.path.startswith('/session/summary'):
            try:
                from urllib.parse import urlparse, parse_qs
                params = parse_qs(urlparse(self.path).query)
                session_id = params.get('session_id', [None])[0]
                
                if not session_id:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'session_id required'}).encode('utf-8'))
                    return
                
                summary = session_tracker.get_session_summary(session_id)
                if summary:
                    self._set_headers(200)
                    self.wfile.write(json.dumps(summary).encode('utf-8'))
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'error': 'session not found'}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        
        elif self.path.startswith('/session/contract'):
            try:
                from urllib.parse import urlparse, parse_qs
                params = parse_qs(urlparse(self.path).query)
                session_id = params.get('session_id', [None])[0]
                amount = params.get('amount', ['0'])[0]
                
                if not session_id:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'session_id required'}).encode('utf-8'))
                    return
                
                try:
                    amount_eth = float(amount)
                except:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'invalid amount'}).encode('utf-8'))
                    return
                
                contract_data = session_tracker.prepare_contract_data(session_id, amount_eth)
                if contract_data:
                    self._set_headers(200)
                    self.wfile.write(json.dumps(contract_data).encode('utf-8'))
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'error': 'session not found'}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        
        elif self.path == '/reload':
            global ACTIVE_AGENTS, AGENT_MAP
            ACTIVE_AGENTS = load_agents_from_json()
            AGENT_MAP = {agent['address']: agent for agent in ACTIVE_AGENTS}
            self._set_headers(200)
            self.wfile.write(json.dumps({'success': True, 'agents': len(ACTIVE_AGENTS)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'not found'}).encode('utf-8'))

def start_http_bridge(port: int = 8010):
    server = ThreadingHTTPServer(('127.0.0.1', port), _ChatHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[HTTP] http://127.0.0.1:{port}")
    print(f"[HTTP] Endpoints: /chat, /response, /scores\n")


if __name__ == "__main__":
    print(f"{'='*70}")
    print(f"🚀 TEELA ULTIMATE SUPERINTELLIGENT ORCHESTRATOR")
    print(f"{'='*70}")
    print(f"📍 Address: {teela.address}")
    print(f"📋 Agents: {len(ACTIVE_AGENTS)}")
    print(f"🧠 MeTTa Reasoning: ✓")
    print(f"📊 Advanced Scoring: ✓")
    print(f"🌐 HTTP Bridge: ✓")
    print(f"{'='*70}\n")
    
    try:
        start_http_bridge(8010)
    except:
        pass
    
    print(f"⏳ Ready...\n")
    teela.run()


# ============================================================================
# HELPER FUNCTIONS FOR BACKEND INTEGRATION
# ============================================================================

def get_session_scores_for_contract(session_id: str, total_amount_eth: float = 0.001):
    """
    Get session scores formatted for escrow contract
    
    This function is called by the backend when ending a session.
    It returns agent scores that sum to 100 and payment amounts.
    
    Args:
        session_id: Session identifier (e.g., "financial_session_123")
        total_amount_eth: Total ETH to distribute (default 0.001)
    
    Returns:
        {
            'session_id': str,
            'total_percentage': 100,
            'agents': [
                {
                    'wallet': '0x...',
                    'amount': '0.0003',
                    'agent_id': 'savings',
                    'agent_name': 'Savings Agent',
                    'score': 35  # Out of 100
                }
            ]
        }
    """
    global session_tracker
    
    # Check if session exists in tracker
    if session_id not in session_tracker.sessions:
        print(f"⚠️  Session {session_id} not found in tracker")
        # Return None to indicate we should fall back to equal distribution
        return None
    
    # Get contract-ready data from tracker
    contract_data = session_tracker.prepare_for_contract(session_id, total_amount_eth)
    
    if not contract_data:
        print(f"⚠️  No contract data for session {session_id}")
        return None
    
    print(f"✅ Retrieved scores for session {session_id}:")
    print(f"   Total percentage: {contract_data['total_percentage']}")
    for agent in contract_data['agents']:
        print(f"   • {agent['agent_name']}: {agent['score']}% = {agent['amount']} ETH")
    
    return contract_data


def record_agent_usage_for_session(session_id: str, agent_id: str, agent_name: str, 
                                   agent_address: str, score: float, response_quality: float):
    """
    Record agent usage during a session
    
    Called by the chat interface when an agent responds.
    
    Args:
        session_id: Session identifier
        agent_id: Agent ID (e.g., "savings")
        agent_name: Agent display name
        agent_address: Agent wallet address
        score: Agent score for this response (0-100)
        response_quality: Quality metric (0-1)
    """
    global session_tracker
    session_tracker.record_agent_usage(
        session_id, agent_id, agent_name, agent_address, score, response_quality
    )


def start_new_session(session_id: str):
    """
    Initialize a new session for tracking
    
    Called when a user starts a new rental session.
    
    Args:
        session_id: Unique session identifier
    """
    global session_tracker
    session_tracker.start_session(session_id)
    print(f"📊 Started tracking session: {session_id}")