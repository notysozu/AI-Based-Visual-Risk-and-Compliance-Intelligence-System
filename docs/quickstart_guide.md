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
DATABASE_URL=sqlite:///./digital_twin.db
GROQ_API_KEY=your_groq_api_key_here
```

> **Note:** A valid `GROQ_API_KEY` unlocks live conversational Copilot intelligence, multi-action generation, and scenario synthesis. If offline or without an API key, the system automatically uses robust heuristic mathematical fallbacks.

---

*Back to [README.md](../README.md)*
