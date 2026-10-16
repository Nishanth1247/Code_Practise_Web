# Architecture & Design Specifications

This document outlines the software design, database schemas, and critical workflows for the **Level-Based Community Coding Practice Platform**.

---

## 1. System Architecture Overview

```
               [ React.js + Vite Client ]
             (Monaco Editor, Recharts, Tailwind)
                          │  ▲
              JSON / REST │  │  JWT Bearer Tokens
                          ▼  │
               [ Express.js REST API ]
   (Auth, Rate Limiters, Input Validators, Controllers)
           │                                 │
           ▼                                 ▼
   [ MySQL 8.0 Database ]            [ Judge0 Sandboxed Execution ]
 (Users, Curricula, Questions,       (Isolated C, C++, Java, Python)
  Reports, Submissions, Audits)
```

---

## 2. Critical Community Reporting & Replacement Workflow

The platform maintains library quality through a self-governing community report system:

### Report Progression
1. **User Submits Report**:
   - The user selects a reason (`Incorrect Statement`, `Incorrect Sample Output`, `Incorrect Test Cases`, `Compilation Issue`, or `Other`).
   - The contributor cannot report their own question.
   - Unique database constraint `UNIQUE KEY (question_id, reporter_id)` prevents repeated report inflation by the same user.
2. **Immediate Replacement**:
   - Inside a database transaction with row-level locking (`SELECT ... FOR UPDATE`), an alternative active question is selected from the **same programming language and level**.
   - Questions already reported by this user and non-active questions are excluded.
   - The frontend prompts the user and transitions them to the replacement question immediately.
   - If no alternative question exists in that level, a helpful fallback notification is returned.
3. **Automated 4-Report Threshold**:
   - As soon as the distinct valid reporter count reaches **4** (`COUNT(DISTINCT reporter_id) >= 4`):
     - The question status atomically transitions to `PENDING_REVIEW`.
     - An audit trail record is generated in `question_audit_logs`.
     - The question is excluded globally from all public practice lists.
     - The question enters the Admin Moderation Queue.

---

## 3. Question Lifecycle Status Model

```
       [ Contributor Uploads ]
                 │
                 ▼
          ┌─────────────┐
          │   ACTIVE    │ ◄────────────────────────┐
          └──────┬──────┘                          │
                 │ (4 Community Reports)           │ Admin Restores
                 ▼                                 │
       ┌──────────────────┐                        │
       │  PENDING_REVIEW  ├────────────────────────┤
       └─────────┬────────┘                        │
                 │ Admin Removes                   │
                 ▼                                 │
          ┌─────────────┐                          │
          │   REMOVED   ├──────────────────────────┘
          └─────────────┘
```

---

## 4. Database Schema Summary

The platform uses 12 normalized tables:

1. **`users`**: Account credentials, email, password hash, role (`USER` or `ADMIN`).
2. **`languages`**: Supported programming languages (`c`, `cpp`, `java`, `python`).
3. **`levels`**: 6 levels per language with descriptions and topic curricula.
4. **`questions`**: Problem statements, input/output formats, constraints, statuses (`ACTIVE`, `PENDING_REVIEW`, `REMOVED`).
5. **`question_samples`**: Publicly visible input/output examples with explanations.
6. **`question_test_cases`**: Private/hidden test suite used for submission verdict calculation.
7. **`question_votes`**: Community useful votes (`UNIQUE (question_id, user_id)`).
8. **`question_reports`**: Community issue reports (`UNIQUE (question_id, reporter_id)`).
9. **`submissions`**: Log of user code submissions, verdicts, test counts, runtime, and memory.
10. **`user_solved_questions`**: Tracks first-time solves per user per question.
11. **`starter_code_templates`**: Boilerplate code snippets per language.
12. **`question_audit_logs`**: Complete historical audit trail of status transitions.

---

## 5. Security Architecture

- **Code Execution Isolation**: Arbitrary user code is never executed directly inside Node.js/Express. Code is dispatched to isolated Judge0 sandbox containers with strict timeout (2.5s) and memory caps (128MB).
- **Private Test Data**: Hidden test inputs and outputs are never exposed in any public API responses.
- **Role Elevation Prevention**: Role assignment in registration endpoints is hardcoded to `USER`. Admin privileges can only be granted via server-side bootstrap script or existing admin actions.
- **Rate Limiting**: Rate limiting applied across authentication, code submission, reporting, and uploads.
- **SQL Injection Prevention**: All queries use parameterized inputs via `mysql2/promise`.
