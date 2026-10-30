# Product Requirements Document (PRD)
## Campus WaterPoint Board

**Campus:** CHR  
**Squad:** 62  
**Team:** 03  
**Sprint:** 2627SPR0I  
**Sprint Duration:** 5 Weeks

## 1. Business Problem

Students carrying bottles visit several campus water points before finding one that works. They may not know that a dispenser has been reported unavailable before reaching it.

Facilities staff also need a shared platform to view reported problems, track unresolved issues, and record when an issue has been addressed.

The project aims to provide a centralized water-point issue board where students can report unavailable dispensers and facilities staff can confirm resolution.

## 2. Target Users

- **Students:** Browse campus water points, check their latest reported status, and report unavailable dispensers without creating an account.
- **Facilities Staff:** Log in, view unresolved reports, investigate issues, and confirm resolution.
- **Mentor/Evaluator:** Review project requirements, implementation, and sprint progress.

## 3. Success Metrics

| Metric | Measurement | Target |
|---|---|---|
| Report Submission | Test student report submissions | 5/5 successful |
| Staff Resolution | Complete report-to-resolution workflow | 5/5 successful |
| Duplicate Reports | Attempt multiple active reports for one location | Duplicate active issue prevented or existing issue displayed |
| Data Persistence | Restart application without deleting database volume | Existing reports remain available |
| Access Control | Attempt staff actions without authentication | Unauthorized actions rejected |
| Status Accuracy | Verify displayed status and timestamps | Correct status and update time displayed |

## 4. Feature Requirements

### Must-Have Features

1. Public directory displaying campus water points and their locations.
2. Latest reported status and update time for each water point.
3. Students can report unavailable dispensers without logging in.
4. Duplicate active reports for the same location are prevented or handled.
5. Separate staff login.
6. Staff dashboard displaying unresolved reports.
7. Only authorized staff can confirm issue resolution.
8. Reports and resolution history are stored in PostgreSQL.
9. Reports remain available across staff shifts and application restarts.

### Optional Features

- Search and filter water points by building or floor.
- Campus map or floor-plan view, if reliable location information and time are available.

### Status Rules

- **Reported Unavailable:** A student has submitted a report; it is not independently verified.
- **Staff-Confirmed Resolved:** An authorized staff member has recorded that the issue was addressed.
- **No Recent Report / Unknown:** No current report is available. This must not be displayed as Working.

The application uses human-submitted reports and staff updates. It does not use sensors or provide real-time verification.

## 5. Project Scope

### In Scope

- Student water-point directory and issue reporting.
- Staff authentication and facilities dashboard.
- Staff-confirmed resolution.
- Latest status and timestamps.
- Persistent report history.
- PostgreSQL database.
- React frontend and FastAPI backend.
- Docker Compose local setup.
- GitHub Actions checks.
- Synthetic demo data for presentation, clearly labelled and removable after the demo.

### Out of Scope

- IoT sensors or automatic dispenser monitoring.
- Real-time sensor verification.
- Student accounts.
- SMS, email, or push notifications.
- AI-based predictions.
- Redis or background queues.
- Native mobile application.
- Complex analytics.
- Full interactive campus map unless time and reliable data are available.
- Cloud hosting or deployment unless separately required.

## 6. Five-Week Sprint Timeline

| Week | Planned Activities | Expected Outcome |
|---|---|---|
| **Week 1 – Planning and PRD** | Understand the problem, identify target users, define requirements and success metrics, finalize scope and architecture, prepare repository documentation, raise PRD PR for mentor review. | Reviewed PRD and finalized project plan. |
| **Week 2 – Project Setup and Backend** | Set up React, FastAPI, PostgreSQL and Docker Compose. Design database tables and implement water-point and report APIs. | Working project foundation and backend APIs. |
| **Week 3 – Frontend Development** | Build student dashboard, water-point directory, report form, staff login, and facilities dashboard. Implement staff authentication and resolution actions. | Main student and staff workflows. |
| **Week 4 – Integration and Testing** | Connect frontend and backend, implement duplicate handling, status history, timestamps, persistent database configuration, GitHub Actions checks, and manual testing. | Fully integrated working application. |
| **Week 5 – Finalization and Submission** | Fix remaining issues, prepare synthetic demo data, complete README and runbook, verify setup and rollback instructions, perform final review, and submit the required PR. | Tested, documented, submission-ready project. |

## 7. Key Assumptions and Constraints

- The project follows a five-week sprint timeline.
- The team aims to complete the core working application within two weeks of implementation, using the remaining sprint time for testing, reliability, documentation, and final submission.
- Synthetic demonstration records may be used if verified campus water-point data is unavailable.
- Staff must investigate an issue before confirming it as resolved.
- Reports must remain stored across normal application restarts.
- Demo records must be clearly identified as synthetic.
- All contributions must be submitted through PRs targeting the main branch.