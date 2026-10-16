# Level-Based Community Coding Practice Platform (`CodeCraft`)

A full-stack, production-minded coding practice web application built with **React**, **Express**, **MySQL**, and **Judge0 code execution**.

Users learn programming by solving problems organized into **6 structured tiers** across **C**, **C++**, **Java**, and **Python**. The platform features community question uploads, community useful voting, an atomic **4-report moderation workflow with immediate replacement**, and a comprehensive **administrator dashboard**.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Monaco Editor (`@monaco-editor/react`), Lucide React, Recharts.
- **Backend**: Node.js, Express.js, REST API, JWT Authentication, bcrypt, express-validator, express-rate-limit, helmet, morgan.
- **Database**: MySQL 8.0 with `mysql2/promise` connection pooling, parameterized queries, row-level transaction locking, and normalized schema.
- **Code Execution**: Isolated Judge0 sandbox integration (C, C++, Java, Python) with server-side hidden test case verification and output normalization.

---

## 2. Directory Structure

```
prac_web/
├── client/                      # React frontend with Vite & Tailwind CSS
│   ├── src/
│   │   ├── components/common/   # Navbar, Footer, Badges, Modals, EmptyState
│   │   ├── context/             # AuthContext (JWT persistence, user roles)
│   │   ├── layouts/             # MainLayout, AdminLayout, ProtectedRoute
│   │   ├── pages/               # Workspace, Dashboard, Curricula, Review
│   │   ├── services/            # Axios API client with interceptors
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                      # Express backend & REST API
│   ├── src/
│   │   ├── config/              # Database pool, env parser, Judge0 config
│   │   ├── controllers/         # Auth, Languages, Levels, Questions, Admin
│   │   ├── middleware/          # JWT Auth, requireAdmin, Rate limiters, Error handler
│   │   ├── routes/              # Modular REST endpoint routing
│   │   ├── services/            # Code execution, atomic reporting, admin
│   │   ├── validators/          # Input validation suites
│   │   ├── app.js               # Express application
│   │   └── server.js            # Server entrypoint
│   ├── migrations/              # Migration runners
│   ├── scripts/                 # run-migrations.js, seed-db.js, bootstrap-admin.js
│   ├── test/                    # Jest automated test suites
│   └── .env.example
├── database/
│   ├── schema.sql               # MySQL 8 schema (12 normalized tables)
│   └── seed.sql                 # Curricula (24 levels across 4 languages)
├── docs/                        # Architecture, DB Setup, Code Execution guides
├── .env.example                 # Root configuration template
├── package.json                 # Monorepo task orchestration scripts
└── README.md
```

---

## 3. Quick Start on Windows PowerShell

### Step 1: Open PowerShell in Project Directory
```powershell
cd "C:\Users\nisha\OneDrive\Desktop\prac_web"
```

### Step 2: Install Dependencies
Dependencies for both client and server are already installed, or can be installed with:
```powershell
npm run install:all
```

### Step 3: Configure Database Credentials
Copy `.env.example` to `server/.env`:
```powershell
Copy-Item .env.example server/.env
```
Open `server/.env` and update your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=prac_web
```

### Step 4: Create Database, Run Migrations & Seed Curricula
Ensure your MySQL Windows service is running:
```powershell
Start-Service -Name MySQL80 -ErrorAction SilentlyContinue
```

Run database migration (creates `prac_web` database and all 12 tables):
```powershell
npm run db:migrate
```

Seed 4 languages (C, C++, Java, Python), 24 levels, and starter practice questions:
```powershell
npm run db:seed
```

### Step 5: Bootstrap the Administrator Account
Create the initial administrator user safely (default: `admin@pracweb.dev` / `Admin@PracWeb2026!`):
```powershell
npm run admin:bootstrap
```

### Step 6: Start the Application

Open two separate Windows PowerShell terminals:

**Terminal 1 (Backend Server on http://localhost:5000):**
```powershell
cd "C:\Users\nisha\OneDrive\Desktop\prac_web"
npm run server
```

**Terminal 2 (Frontend Client on http://localhost:5173):**
```powershell
cd "C:\Users\nisha\OneDrive\Desktop\prac_web"
npm run client
```

Navigate to `http://localhost:5173` in your browser.

---

## 4. Key Platform Features

1. **Structured 6-Tier Curricula**:
   - **C**: Fundamentals, Conditions, Loops, Arrays & Strings, Functions & Recursion, Pointers & Structures.
   - **C++**: Basics & Streams, Decisions, Loops, Vectors, References, OOP & STL.
   - **Java**: Syntax & Scanner, Branching, Loops, Arrays & Strings, Methods, Classes.
   - **Python**: Variables, Conditions, Sequences, Lists & Strings, Functions, Dicts & Sets.
   - Non-linear progression: practice any level freely.
2. **Coding Workspace**:
   - Split panel interface with problem statement, constraints, visible test cases.
   - Monaco Editor with language highlighting and starter boilerplate.
   - **Run Code**: Tests against visible sample cases with stdout and stderr output.
   - **Submit Solution**: Evaluates against hidden test cases in sandbox without exposing test data to the user.
3. **Question Contribution**:
   - Any registered user can contribute questions with starter code, visible samples, and hidden test cases.
   - Server-side validation publishes questions directly to community practice.
4. **Community Moderation & Immediate Replacement**:
   - Mark as Useful (1 vote per user).
   - Report Wrong Question (1 report per user, authors cannot report own questions).
   - **Immediate Question Replacement**: When a user reports a question, the platform atomically selects an alternative practice question from the same language and level, excluding already reported questions.
   - **Automatic 4-Report Threshold**: Upon reaching 4 distinct user reports, the question atomically transitions to `PENDING_REVIEW`, is excluded from practice lists globally, and enters the Admin Moderation Queue.
5. **Administrator Dashboard**:
   - Platform overview stats (users, questions, active, pending review, removed, submissions).
   - Reported questions review queue.
   - Inspection of hidden test cases and report history.
   - Status actions: **Remove Question** (`REMOVED`) or **Restore Question** (`ACTIVE`) with complete historical audit trail.

---

## 5. Automated Tests & Production Build

Run backend unit and integration test suite:
```powershell
npm test
```

Test production build of the React client:
```powershell
npm run build:client
```
*(Built with Vite: 0 errors).*

---

## 6. Code Execution Setup (Judge0)

- **RapidAPI Judge0 CE**: Add `JUDGE0_API_URL`, `JUDGE0_API_KEY`, and `JUDGE0_API_HOST` in `server/.env`.
- **Local Docker Judge0**: Run `docker compose up -d` in a Judge0 instance listening on `http://localhost:2358`.
- If Judge0 is offline, the platform returns a descriptive error explaining sandbox status without faking execution. See [docs/CODE_EXECUTION.md](docs/CODE_EXECUTION.md) for details.
