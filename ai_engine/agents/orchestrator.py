"""
JARVIS 100-Agent Swarm Orchestrator — Cognitive Intelligence, Memory & Action Dispatcher

Routes user queries to the optimal specialized sub-agent from the 100-agent swarm,
injects persistent MongoDB long-term memories, and executes cockpit actions.
"""

import json
import re
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from database import crud, models
from .swarm_registry import find_matching_agents, get_agent_by_id, AgentProfile, SWARM_AGENTS_CATALOG


class JarvisAgentSwarmOrchestrator:
    """
    Central cognitive coordinator for J.A.R.V.I.S.
    Orchestrates 100+ specialized agents with long-term memory retrieval and action dispatch.
    """

    @staticmethod
    async def process_turn(
        user_id: str,
        prompt: str,
        subject: str = "General Study",
        history: Optional[List[Dict[str, Any]]] = None,
        cockpit_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        prompt = prompt.strip()
        if not prompt:
            return {
                "text": "I'm online and listening, sir.",
                "action": None,
                "agent": {
                    "id": "chief_jarvis",
                    "name": "Chief J.A.R.V.I.S.",
                    "category": "Core AI Commander"
                },
                "memories_count": 0,
                "prompt": "",
                "timestamp": datetime.utcnow().isoformat()
            }

        p_low = prompt.lower()
        user = await crud.get_user(user_id)
        username = user.username if user and user.username else "Sir"
        history = history or []

        # 1. Check Explicit Voice Actions First
        action_result = await JarvisAgentSwarmOrchestrator._check_cockpit_actions(user, username, prompt, p_low, subject)
        if action_result is not None:
            return action_result

        # 2. Retrieve Persistent Long-Term Memory Facts from MongoDB
        memories = await crud.get_jarvis_memories(user_id, limit=15)
        memory_lines = [f"- {m.memory_key}: {m.content}" for m in memories]
        memory_context_str = "\n".join(memory_lines) if memory_lines else "No previous memories recorded yet."

        # 3. Retrieve User Telemetry & Academic Profile
        study_profile = await crud.get_user_study_profile(user_id) if user else {}
        onboarded_subjects = study_profile.get("subjects", [])
        exams = study_profile.get("exams", [])
        exam_summary = ", ".join([f"{e.get('subject')} on {e.get('date')}" for e in exams]) if exams else "None scheduled"

        # 4. Multi-Agent Swarm Dynamic Routing (Selects the top specialized agent out of 100)
        matched_agents = find_matching_agents(prompt, subject=subject, top_k=2)
        primary_agent = matched_agents[0][0]
        primary_score = matched_agents[0][1]

        # 5. Build High-Context Multi-Agent System Prompt
        system_prompt = f"""You are J.A.R.V.I.S. operating through your specialized sub-agent: [{primary_agent.name}] ({primary_agent.category}).
User Name: {username}
Current Subject in Focus: {subject}
Enrolled Subjects: {', '.join(onboarded_subjects) if onboarded_subjects else 'General Studies'}
Upcoming Exams: {exam_summary}

SPECIALIZED AGENT DIRECTIVE ({primary_agent.name}):
{primary_agent.system_prompt}

USER'S PERSISTENT MEMORY FACTS (Remember who they are):
{memory_context_str}

CRITICAL SPOKEN VOICE GUIDELINES:
1. Speak in a crisp, refined, polite British AI persona ('Right away, sir', 'Certainly', 'At your service').
2. Deliver a sharp, high-IQ, directly useful response in 1 to 2 concise sentences.
3. NEVER use markdown hashes (#), asterisks (**), or bullet points because this will be read aloud by Text-to-Speech.
4. If the user mentions a personal fact, goal, or preference, acknowledge it naturally."""

        messages_payload = [{"role": "system", "content": system_prompt}]
        for h in history[-4:]:
            r = h.get("role")
            c = h.get("content") or h.get("text")
            if r in ["user", "assistant"] and c:
                messages_payload.append({"role": r, "content": c})
        messages_payload.append({"role": "user", "content": prompt})

        # 6. Execute LLM Inference with Groq Multi-Model Engine
        response_text = None
        try:
            from ai_engine.llm_integration.client import get_groq_client, get_active_groq_models
            client = get_groq_client()
            if client:
                models_to_try = get_active_groq_models(client)
                for model_name in models_to_try:
                    try:
                        resp = client.chat.completions.create(
                            model=model_name,
                            messages=messages_payload,
                            temperature=0.35,
                            max_tokens=180,
                            timeout=6.0
                        )
                        raw_content = resp.choices[0].message.content.strip()
                        # Clean out think tokens or markdown
                        clean_content = re.sub(r"<think>[\s\S]*?</think>", "", raw_content).strip()
                        clean_content = clean_content.replace("**", "").replace("*", "").replace("###", "").replace("##", "")
                        clean_content = re.sub(r"[\n\r]+", " ", clean_content).strip()
                        if clean_content:
                            response_text = clean_content
                            break
                    except Exception as me:
                        continue
        except Exception as e:
            print(f"[Jarvis Swarm] LLM dispatch error: {e}")

        # Fallback intelligent generation if LLM unavailable
        if not response_text:
            response_text = JarvisAgentSwarmOrchestrator._generate_agent_heuristic_reply(primary_agent, prompt, username, subject)

        # 7. Background Auto-Fact Extraction to Persistent MongoDB Memory
        try:
            await JarvisAgentSwarmOrchestrator._extract_and_persist_facts(user_id, prompt, response_text)
        except Exception as ex:
            print(f"[Jarvis Swarm] Memory extraction notice: {ex}")

        return {
            "text": response_text,
            "action": None,
            "agent": {
                "id": primary_agent.id,
                "name": primary_agent.name,
                "category": primary_agent.category
            },
            "memories_count": len(memories),
            "prompt": prompt,
            "timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    async def _check_cockpit_actions(
        user: Optional[models.UserDoc],
        username: str,
        prompt: str,
        p_low: str,
        subject: str
    ) -> Optional[Dict[str, Any]]:
        """Evaluate fast-path cockpit window, timer, and note-taking actions."""
        # 1. Take a Note / Idea
        if any(k in p_low for k in ["take a note", "note down", "write a note", "save an idea", "save idea", "add a note", "remember this", "make a note"]):
            cleaned = re.sub(r"^(jarvis\s*,?\s*|hey jarvis\s*,?\s*|please\s*)", "", prompt, flags=re.IGNORECASE)
            cleaned = re.sub(r"^(take a note\s*(that|about|:|to)?|note down\s*(that|about|:|to)?|write a note\s*(that|about|:|to)?|save an idea\s*(that|about|:|to)?|save idea\s*(that|about|:|to)?|add a note\s*(that|about|:|to)?|remember this\s*(that|about|:|to)?|make a note\s*(that|about|:|to)?)\s*", "", cleaned, flags=re.IGNORECASE).strip()
            note_content = cleaned if cleaned else prompt
            words = note_content.split()
            note_title = " ".join(words[:4]).capitalize() if len(words) >= 4 else note_content.capitalize()

            created_note = None
            if user:
                try:
                    created_note = await crud.save_user_note(user.id, {
                        "title": note_title,
                        "content": note_content,
                        "category": "ideas",
                        "tags": ["jarvis", subject.lower()]
                    })
                    # Also persist as an explicit memory
                    await crud.save_jarvis_memory(
                        user_id=user.id,
                        memory_key=f"note_{note_title[:20].lower().replace(' ', '_')}",
                        content=note_content,
                        category="academic",
                        importance=0.9
                    )
                except Exception as e:
                    print(f"[Jarvis] Auto-note save error: {e}")

            return {
                "text": f"Noted, {username}. I have recorded that into your notes and memory.",
                "action": {
                    "type": "create_note",
                    "payload": {
                        "id": str(created_note.id) if created_note else str(uuid.uuid4()),
                        "title": note_title,
                        "content": note_content,
                        "category": "ideas"
                    }
                },
                "agent": {
                    "id": "note_taking_philosopher",
                    "name": "Second Brain Architect",
                    "category": "Cognitive & Study Strategy"
                },
                "memories_count": 1,
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 2. Window Controls
        if any(k in p_low for k in ["open youtube", "play youtube", "start youtube", "show youtube"]):
            return {
                "text": f"Opening your YouTube focus player, {username}.",
                "action": {"type": "open_youtube"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["close youtube", "hide youtube", "stop youtube"]):
            return {
                "text": "YouTube player dismissed.",
                "action": {"type": "close_youtube"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        if any(k in p_low for k in ["open spotify", "play spotify", "start spotify", "show spotify", "play music"]):
            return {
                "text": f"Launching Spotify music player for focus.",
                "action": {"type": "open_spotify"},
                "agent": {"id": "soundscape_curator", "name": "Acoustic Focus Scientist", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["close spotify", "hide spotify", "stop spotify", "stop music"]):
            return {
                "text": "Spotify player closed.",
                "action": {"type": "close_spotify"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        if any(k in p_low for k in ["open browser", "launch browser", "show browser", "open web"]):
            return {
                "text": f"Opening in-cockpit web browser.",
                "action": {"type": "open_browser"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["close browser", "hide browser"]):
            return {
                "text": "Web browser closed.",
                "action": {"type": "close_browser"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        if any(k in p_low for k in ["open notes", "open my notes", "show notes", "show my notes"]):
            return {
                "text": f"Displaying your notes and ideas board.",
                "action": {"type": "open_notes"},
                "agent": {"id": "note_taking_philosopher", "name": "Second Brain Architect", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["close notes", "hide notes"]):
            return {
                "text": "Notes board minimized.",
                "action": {"type": "close_notes"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        if any(k in p_low for k in ["open workspace", "show tasks", "open planner", "show planner", "show workspace"]):
            return {
                "text": f"Opening your study workspace and task planner.",
                "action": {"type": "open_workspace"},
                "agent": {"id": "deep_work_coach", "name": "Deep Work Coach", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["close workspace", "hide workspace", "hide tasks"]):
            return {
                "text": "Workspace minimized to background.",
                "action": {"type": "close_workspace"},
                "agent": {"id": "cockpit_commander", "name": "Cockpit Commander", "category": "Cockpit Control"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 3. Timer Controls
        if any(k in p_low for k in ["start timer", "play timer", "resume timer", "start focus", "begin sprint"]):
            return {
                "text": f"Starting your focus sprint timer now. Let's make progress, {username}.",
                "action": {"type": "start_timer"},
                "agent": {"id": "pomodoro_tactician", "name": "Pomodoro Tactician", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["pause timer", "stop timer", "pause sprint"]):
            return {
                "text": "Focus timer paused.",
                "action": {"type": "pause_timer"},
                "agent": {"id": "pomodoro_tactician", "name": "Pomodoro Tactician", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
        if any(k in p_low for k in ["reset timer", "restart timer"]):
            return {
                "text": "Timer reset to initial duration.",
                "action": {"type": "reset_timer"},
                "agent": {"id": "pomodoro_tactician", "name": "Pomodoro Tactician", "category": "Cognitive & Study Strategy"},
                "prompt": prompt,
                "timestamp": datetime.utcnow().isoformat()
            }

        return None

    @staticmethod
    async def _extract_and_persist_facts(user_id: str, prompt: str, response: str):
        """Auto-extract and persist user facts, goals, and preferences to MongoDB."""
        p_low = prompt.lower()

        # Target exam declaration
        exam_match = re.search(r"(?:preparing for|target exam is|studying for|my exam is)\s+([a-zA-Z0-9\s]+?)(?:in|on|next|\.|$)", p_low)
        if exam_match:
            exam_name = exam_match.group(1).strip().title()
            await crud.save_jarvis_memory(
                user_id=user_id,
                memory_key="target_exam",
                content=f"Preparing for {exam_name}",
                category="academic",
                importance=1.0
            )

        # Study time preference
        if any(k in p_low for k in ["study at night", "night owl", "morning person", "study in morning"]):
            pref = "Prefers studying at night" if "night" in p_low else "Prefers morning study sessions"
            await crud.save_jarvis_memory(
                user_id=user_id,
                memory_key="study_time_preference",
                content=pref,
                category="preference",
                importance=0.8
            )

        # Favorite subject / domain
        subj_match = re.search(r"(?:favorite subject is|i love studying|major is|specializing in)\s+([a-zA-Z0-9\s]+?)(?:\.|$)", p_low)
        if subj_match:
            subj_name = subj_match.group(1).strip().title()
            await crud.save_jarvis_memory(
                user_id=user_id,
                memory_key="favorite_subject",
                content=f"Specializes in {subj_name}",
                category="academic",
                importance=0.85
            )

    @staticmethod
    def _generate_agent_heuristic_reply(agent: AgentProfile, prompt: str, username: str, subject: str) -> str:
        """Intelligent heuristic response generator tailored to the active agent and prompt context."""
        p_low = prompt.lower()

        # Quantum Mechanics & Modern Physics
        if any(k in p_low for k in ["quantum", "schrodinger", "wavefunction", "superposition", "entanglement", "qubit"]):
            return f"In quantum mechanics, state vectors evolve deterministically under unitary transformations until measurement projects them onto observable eigenstates."

        # Calculus & Analysis
        if any(k in p_low for k in ["derivative", "integral", "calculus", "limit", "taylor series", "gradient"]):
            return f"For {subject}, evaluate the rate of change via the limit of difference quotients, or compute cumulative accumulation across defined integration boundaries."

        # Linear Algebra
        if any(k in p_low for k in ["matrix", "eigenvalue", "eigenvector", "vector space", "svd", "determinant"]):
            return f"Eigenvectors define invariant rotational axes under linear transformations, scaled directly by their characteristic eigenvalues."

        # Software Architecture & Algorithms
        if any(k in p_low for k in ["algorithm", "complexity", "big o", "recursion", "data structure", "tree", "graph", "api", "code"]):
            return f"Optimal architecture balances asymptotic time complexity against cache locality and explicit state boundaries."

        # Active Recall & Study Strategy
        if any(k in p_low for k in ["feynman", "remember", "memory", "recall", "study method", "spaced repetition", "quiz"]):
            return f"To master {subject}, apply the Feynman technique: explain the concept simply without jargon, isolate knowledge gaps, and test through active retrieval."

        # Category-based tailored synthesis
        if agent.category == "STEM & Mathematics":
            return f"As your {agent.name}, I recommend approaching this through foundational axioms, algebraic reduction, and step-by-step mathematical derivation for {subject}."
        elif agent.category == "STEM & Physics":
            return f"From a first-principles physics perspective, we evaluate conservation laws, boundary conditions, and governing field equations for {subject}, {username}."
        elif agent.category == "STEM & Chemistry":
            return f"In chemical kinetics and thermodynamics, reaction spontaneity is driven by minimizing Gibbs free energy and transition state activation barriers."
        elif agent.category == "STEM & Biology":
            return f"Biological systems optimize homeostatic equilibrium through metabolic feedback loops, cellular signaling, and synaptic plasticity."
        elif agent.category == "Software Engineering":
            return f"As your {agent.name}, I suggest structuring this with clean modularity, deterministic state boundaries, and optimal asymptotic complexity."
        elif agent.category == "Cognitive & Study Strategy":
            return f"To maximize your retention for {subject}, I recommend an intense 45-minute focus sprint followed by an active recall session."
        elif agent.category == "Wealth & Economics":
            return f"Evaluating the asymmetric upside and risk distribution, systematic long-term compounding yields exponential expected value, {username}."
        elif agent.category == "Philosophy & Humanities":
            return f"Reflecting from first principles, focus with clarity on what is within your direct volition and control, {username}."
        else:
            return f"Understood, {username}. As your {agent.name}, I am analyzing {subject} through first principles to maximize your focus and performance."

