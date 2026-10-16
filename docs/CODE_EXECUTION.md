# Isolated Code Execution Setup Guide (Judge0)

This platform integrates with **Judge0**, an isolated, sandboxed code execution engine.

> **Security Rule**: The Express backend never executes user-submitted code directly on the host server. All code is dispatched to the isolated execution sandbox with CPU time limits (2.5s) and memory caps (128MB). Hidden test cases and expected outputs are evaluated server-side and never sent to the browser.

---

## Option A: RapidAPI Judge0 CE (Cloud, No Local Docker Required)

1. Sign up for a free account at [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce).
2. Copy your **RapidAPI Key** and **RapidAPI Host**.
3. Update `server/.env`:

```env
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key_here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

---

## Option B: Self-Hosted Judge0 with Docker (Local)

If Docker Desktop is installed on Windows:

1. Clone and start the official Judge0 CE Docker containers:
```powershell
git clone https://github.com/judge0/judge0.git
cd judge0
docker compose up -d db redis
docker compose up -d
```
2. Judge0 will be available at `http://localhost:2358`.
3. In `server/.env`, ensure:
```env
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
JUDGE0_API_HOST=
```

---

## Supported Programming Languages & Judge0 IDs

| Language | Judge0 CE ID | Compiler / Runtime |
|---|---|---|
| **C** | 50 | GCC 9.2.0 |
| **C++** | 54 | GCC 9.2.0 |
| **Java** | 62 | OpenJDK 13.0.1 |
| **Python** | 71 | Python 3.8.1 |

---

## Offline / Unconfigured Handling

If Judge0 is offline or credentials are not yet configured, the platform returns a descriptive `503 Service Unavailable` message informing the user that the code execution sandbox is offline, rather than fabricating a fake compilation or acceptance verdict.
