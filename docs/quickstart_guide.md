# Quickstart Guide — Visual Risk AI

Follow this guide to clone, configure, install, and run Visual Risk AI on your local environment.

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python**: Version 3.10 or higher (`python3 --version`)
- **Node.js**: Version 18.0 or higher (`node --version`)
- **npm** or **pnpm**: (`npm --version`)
- **Git**: (`git --version`)

---

## 2. Clone the Repository

```bash
git clone https://github.com/notysozu/AI-Based-Visual-Risk-and-Compliance-Intelligence-System.git
cd AI-Based-Visual-Risk-and-Compliance-Intelligence-System
```

---

## 3. Backend Setup

```bash
# 1. Create a Python virtual environment
python3 -m venv .venv

# 2. Activate the virtual environment
# On macOS / Linux:
source .venv/bin/activate
# On Windows (Command Prompt):
# .venv\Scripts\activate.bat
# On Windows (PowerShell):
# .venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node packages
npm install

# 3. Return to the root directory
cd ..
```

---

## 5. Environment Variables Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` with your preferred settings:

```env
# Local MongoDB instance:
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=digital_twin_ai

# Or MongoDB Atlas Cloud Cluster:
# MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
# MONGODB_DB_NAME=digital_twin_ai

# Groq LLM API Key (Optional for heuristic mode, required for live LLM):
GROQ_API_KEY=your_groq_api_key_here
```

> **Database Note:** If a local MongoDB instance is not detected, the application automatically initializes an embedded in-memory database fallback (`mongomock_motor`) for immediate development with zero configuration.
>
> **AI Copilot Note:** A valid `GROQ_API_KEY` unlocks live conversational Copilot intelligence, multi-action generation, and scenario synthesis. If offline or without an API key, the system automatically uses robust heuristic mathematical fallbacks.

---

*Back to [README.md](../README.md)*
