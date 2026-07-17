# Matra Backend Blueprint

A reference map of every module, route, role, and non-trivial engineering component needed for the Matra MVP. Use this to stop re-deciding scope mid-build — when in doubt, check here first, and update this doc (not just the code) when scope genuinely changes.

---

## 1. Domain Modules (the "nouns" of the system)

Everything in Matra hangs off these core entities. Build roughly in this order, since later modules depend on earlier ones.

1. **Organizations** — hospitals/clinics (tenants)
2. **Users** — healthcare staff (Super Admin, Hospital Admin, Doctor, Nurse, CHW)
3. **Mothers** — the patients being monitored (not app users — they never log in)
4. **Enrollments** — a mother's active 42-day monitoring window
5. **Delivery Records** — clinical birth data tied to an enrollment
6. **Messages** — the SMS conversation log (in/out)
7. **Risk Assessments** — deterministic scoring from mother responses
8. **Escalations** — workflow triggered by high-risk assessments
9. **Escalation Rules** — org-configurable escalation policies
10. **EPDS Assessments** — postpartum depression screening
11. **Background Jobs** — scheduled check-ins, timeouts, reminders
12. **Analytics/Dashboard** — aggregated read endpoints for staff

You already have (1) and (2) partially built (register, login, invite-flow pending). Everything below builds on that foundation.

---

## 2. Roles & Permission Model

| Role | Scope | Typical permissions |
|---|---|---|
| `SUPER_ADMIN` | Org-wide | Everything within their org: manage users, escalation rules, view all data |
| `HOSPITAL_ADMIN` | Org-wide | Manage staff, view all mothers/escalations, configure rules |
| `DOCTOR` | Org-wide (or assigned) | View mothers, resolve escalations, record clinical notes |
| `NURSE` | Org-wide (or assigned) | Enroll mothers, record delivery info, acknowledge/resolve escalations |
| `CHW` | Assigned mothers only | View assigned mothers, basic check-in follow-up, limited write access |

Two authorization layers you'll need everywhere (you've already built the first):

- **`authenticateToken`** — who is this? (done)
- **`requireRole([...])`** — are they allowed to hit this route at all? (done)
- **`requireOrgScope`** (new, critical) — is the record they're requesting/modifying actually inside *their own* `organization_id`? This is separate from role — a `NURSE` in Org A must never be able to fetch a mother from Org B even if the route/role check passes. This should be enforced at the query layer (every query filtered by `organization_id` from `req.user`), not just checked once in middleware — see Section 5.

---

## 3. Routes by Module

### Auth (`/auth`) — mostly built
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | Org + Super Admin creation — done |
| POST | `/auth/login` | Public | Done |
| POST | `/auth/logout` | Authenticated | Token invalidation (stateless JWT — likely just a client-side no-op, or a token blocklist if you want real revocation) |
| GET | `/auth/me` | Authenticated | Done |
| POST | `/auth/invite` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Invite staff by email + role |
| POST | `/auth/accept-invite` | Public (invite token) | Invited staff sets password, activates account |
| POST | `/auth/forgot-password` | Public | Sends reset link/token |
| POST | `/auth/reset-password` | Public (reset token) | Sets new password |

### Users (`/users`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/users` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | List staff in own org |
| GET | `/users/:id` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | View one staff member |
| PATCH | `/users/:id` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Update role/status |
| DELETE | `/users/:id` | `SUPER_ADMIN` | Deactivate (soft-delete, never hard-delete medical-adjacent records) |

### Organizations (`/organizations`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/organizations/me` | Any authenticated staff | Own org details |
| PATCH | `/organizations/me` | `SUPER_ADMIN` | Update org info |

### Mothers (`/mothers`)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/mothers` | `NURSE`, `HOSPITAL_ADMIN` | Register a mother (pre-enrollment identity record) |
| GET | `/mothers` | Org staff (scoped by role) | List mothers in org; CHW sees only assigned |
| GET | `/mothers/:id` | Org staff | Full mother profile |
| PATCH | `/mothers/:id` | `NURSE`, `DOCTOR`, `HOSPITAL_ADMIN` | Update identity/contact info |

### Enrollments (`/enrollments`)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/enrollments` | `NURSE` | Start 42-day monitoring window for a mother |
| GET | `/enrollments` | Org staff | List active/past enrollments (filterable by status) |
| GET | `/enrollments/:id` | Org staff | Single enrollment detail |
| PATCH | `/enrollments/:id` | `NURSE`, `DOCTOR` | Update status (active/completed/withdrawn) |

### Delivery Records (`/enrollments/:id/delivery`)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/enrollments/:id/delivery` | `NURSE`, `DOCTOR` | One delivery record per enrollment |
| GET | `/enrollments/:id/delivery` | Org staff | View clinical baseline |
| PATCH | `/enrollments/:id/delivery` | `NURSE`, `DOCTOR` | Corrections |

### Messages (`/messages`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/mothers/:id/messages` | Org staff | Full conversation history for a mother |
| POST | `/webhooks/sms/inbound` | Africa's Talking (webhook, not a user) | Receives mother replies — see Section 5 |
| POST | `/messages/send` | System/internal, or `NURSE`/`DOCTOR` for manual outreach | Manually trigger a message outside the schedule |

### Risk Assessments (`/risk-assessments`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/mothers/:id/risk-assessments` | Org staff | History of scored assessments |
| GET | `/risk-assessments/:id` | Org staff | Single assessment detail incl. triggering message |
| (created internally, not via a user-facing POST — see Section 5) | | | |

### Escalations (`/escalations`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/escalations` | Org staff (assigned-filtered for CHW) | Active/resolved escalations, filterable |
| GET | `/escalations/:id` | Org staff | Full timeline |
| PATCH | `/escalations/:id/acknowledge` | Assigned role/user | Marks acknowledged, stops the timeout clock |
| PATCH | `/escalations/:id/resolve` | `NURSE`, `DOCTOR` | Closes with resolution notes |

### Escalation Rules (`/escalation-rules`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/escalation-rules` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | View org's configured rules |
| POST | `/escalation-rules` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Define new rule (severity → steps → timeouts) |
| PATCH | `/escalation-rules/:id` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Update thresholds/steps |

### EPDS (`/mothers/:id/epds`)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/mothers/:id/epds` | `NURSE`, `DOCTOR`, CHW (if permitted) | Record a completed screening + per-question responses |
| GET | `/mothers/:id/epds` | Org staff | History of screenings |
| GET | `/epds/:id` | Org staff | Single assessment incl. per-question breakdown |

### Dashboard / Analytics (`/dashboard`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/dashboard/summary` | Org staff | Active mothers count, open escalations, overdue check-ins |
| GET | `/dashboard/escalations/active` | Org staff | Quick-access list for the main staff view |
| GET | `/dashboard/analytics` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Trends over time — risk distribution, response rates, etc. |

---

## 4. Suggested Build Order

Build in phases — each phase should be fully working (including auth/scoping) before moving to the next, rather than building all routes shallowly at once.

**Phase 1 — Foundation (mostly done)**
- Org registration, Super Admin creation, login
- `authenticateToken`, `requireRole`
- Staff invite + accept-invite flow
- `requireOrgScope` pattern established (Section 5) — do this now, retrofitting later is painful

**Phase 2 — Core clinical records**
- Mothers CRUD
- Enrollments CRUD
- Delivery records

**Phase 3 — Messaging skeleton**
- Message model + `GET` history endpoint
- Africa's Talking inbound webhook receiver (even before real scheduling exists, get the webhook accepting and storing messages)
- Manual outbound send (before automating schedules)

**Phase 4 — Risk engine**
- Deterministic rule evaluator (pure function, heavily unit-testable, no DB/HTTP concerns inside it)
- Risk Assessment creation triggered by inbound messages
- Read endpoints

**Phase 5 — Escalation workflow**
- Escalation Rules CRUD
- Escalation creation triggered by high-risk assessments
- Acknowledge/resolve endpoints
- Timeout monitoring background job (BullMQ)

**Phase 6 — EPDS**
- Assessment + per-question response models
- Endpoints

**Phase 7 — Background jobs at scale**
- Redis + BullMQ: daily check-in scheduler, reminder jobs, escalation timeout jobs
- These depend on Phases 2–5 already existing

**Phase 8 — Dashboard/analytics**
- Aggregation endpoints — build last, since they read from everything above

---

## 5. Components That Need Real Engineering Work

These aren't "just another CRUD route" — flag these explicitly so nobody underestimates them mid-sprint.

### a) Multi-tenant query scoping (`requireOrgScope`)
Every single query touching mothers/enrollments/messages/escalations must filter by `organization_id` derived from `req.user`, not from the request body or URL. Never trust a client-supplied `organization_id`. Recommended pattern: a shared query helper/base repository function that *always* injects `WHERE organization_id = $1` rather than relying on every developer remembering to add it by hand in every query. One missed `WHERE` clause here is a real patient-data leak between hospitals — this deserves a design review, not just a code review.

### b) SMS webhook handler (`/webhooks/sms/inbound`)
This route is hit by Africa's Talking, not by your own frontend — meaning:
- No `Authorization: Bearer` JWT — needs its own verification (shared secret/signature check per Africa's Talking's webhook auth mechanism).
- Must match an inbound message to the correct mother (by phone number) and the correct pending check-in (parent message threading).
- Must be idempotent — webhooks can be retried/duplicated by the provider; duplicate inbound messages shouldn't create duplicate risk assessments.
- Should respond fast (2xx) and do heavy processing (risk scoring) asynchronously via a queued job, not inline in the request/response cycle.

### c) Deterministic risk-scoring engine
This is the clinical core of the product. Recommend building it as a **pure, isolated function/module** — given structured symptom inputs, return a score/severity, with zero database or HTTP concerns inside it. This makes it independently unit-testable against known clinical scenarios (a huge deal for a health product — you want to be able to prove "headache + blurred vision → High" reliably, in a test, without spinning up the whole app). Keep this rule set version-controlled and reviewed like clinical logic, not like ordinary feature code.

### d) Escalation state machine + timeout monitoring
Escalations aren't a simple status field — they have a defined lifecycle (`created → notified → acknowledged → resolved`, with time-based auto-escalation if unacknowledged). This needs:
- A background job (BullMQ) scheduled per-escalation at creation time, checking after N minutes whether it's been acknowledged, and if not, advancing to the next escalation step.
- Careful handling of "what if it gets acknowledged right as the timeout job fires" (race condition) — check status inside the job before acting, don't assume it's still the same state it was when scheduled.

### e) Background job infrastructure (Redis + BullMQ)
This is new infrastructure, not just new code — needs Redis running (locally + in deployment), a queue/worker process structure separate from your main API process, and a decision on how workers are deployed (same process, or separate). Worth setting this up early (Phase 3-ish) even with a trivial job, so the infrastructure exists before Phase 5/7 depend on it heavily.

### f) Message threading (parent/child)
Outbound check-in → inbound reply → triggered risk assessment needs to stay linked. Store a `parent_message_id` on inbound messages so you can always trace "this risk assessment came from this reply, which was in response to this specific question" — important for clinical auditability, not just nice-to-have data modeling.

### g) Audit logging
Given this is health data, seriously consider an audit log (who viewed/modified which mother's record, when) fairly early rather than bolting it on later. Doesn't need to be fancy — an `audit_log` table with `user_id`, `action`, `resource`, `resource_id`, `timestamp` written on sensitive reads/writes is a reasonable MVP version.

### h) EPDS scoring integrity
Individual question responses must be stored even though only the total score matters for the risk flag — this is both a clinical requirement (reviewability) and likely a compliance expectation. Don't let anyone "optimize" this down to just storing the total.

---

## 6. What NOT to build yet (explicitly out of MVP scope)

Worth stating explicitly so the team doesn't accidentally scope-creep:
- WhatsApp integration (future)
- AI-driven clinical decisions (AI is assistive only — free-text interpretation, translation — never scoring/escalation logic)
- Full EHR functionality
- Insurance integrations
- Predictive/ML risk models (current MVP is rule-based only)
- Neonatal follow-up tracking

---

## 7. How to use this doc

- When someone asks "what do we build next," check Phase order in Section 4 first.
- When starting a new route, check Section 3 for the agreed shape before inventing a new one.
- When touching anything in Section 5, flag it in standup — these are the pieces most likely to need design discussion, not solo decisions.
- Update this file when scope genuinely changes — don't let it go stale while the code diverges from it.