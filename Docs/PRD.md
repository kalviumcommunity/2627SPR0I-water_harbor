# Product Requirements Document (PRD)

## Campus WaterPoint Board

**Campus:** CHR  
**Squad:** 62  
**Team:** 03  
**Sprint:** 2627SPR0I  
**Sprint Duration:** 5 Weeks

## 1. Problem and Context

Students carrying bottles visit several campus water points before finding one that works. They may not know that a dispenser has been reported unavailable before reaching it.

Currently, students may have to physically visit multiple water points to find an available dispenser, while information about unavailable dispensers may be shared informally. Facilities staff also need a shared way to view reported problems, track unresolved issues, and record when an issue has been addressed.

The project aims to provide a centralized water-point issue board where students can report unavailable dispensers and facilities staff can confirm resolution. This helps students make informed choices and gives facilities staff a shared record of reported issues.

## 2. Users and Stakeholders

- **Students:** Browse campus water points, check their latest reported status, and report unavailable dispensers without creating an account.
- **Facilities Staff:** Log in, view unresolved reports, investigate issues, and confirm resolution.
- **Mentor/Evaluator:** Review project requirements, implementation, and sprint progress.
- **Project Team:** Design, develop, test, and maintain the application during the sprint.

## 3. Objectives and Success Measures

### Objectives

1. Provide students with a centralized directory of campus water points.
2. Allow students to report unavailable dispensers without creating an account.
3. Give facilities staff a dashboard to review unresolved reports and confirm resolutions.
4. Display the latest reported status and update time for each water point.
5. Preserve issue and resolution records across staff shifts and normal application restarts.

### Success Metrics

| Metric | Measurement | Target |
|---|---|---|
| Report Submission | Test student report submissions | 5/5 successful |
| Staff Resolution | Complete report-to-resolution workflow | 5/5 successful |
| Duplicate Reports | Attempt multiple active reports for one location | Duplicate active issue prevented or existing issue displayed |
| Data Persistence | Restart application without deleting database volume | Existing reports remain available |
| Access Control | Attempt staff actions without authentication | Unauthorized actions rejected |
| Status Accuracy | Verify displayed status and timestamps | Correct status and update time displayed |

## 4. Project Scope

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

## 5. User Stories and Acceptance Criteria

### US-01: Browse Water Points

**User Story:** As a student, I want to view campus water points and their latest reported status so that I can decide which location to visit.

**Acceptance Criteria:**
- The public directory displays available water-point locations.
- Each water point displays its latest recorded status and update time.
- Water points without a recent report are labelled Unknown or No Recent Report, not Working.
- Students can view the directory without logging in.

### US-02: Report an Unavailable Water Point

**User Story:** As a student, I want to report an unavailable dispenser so that facilities staff and other students can see the issue.

**Acceptance Criteria:**
- Students can submit a report without creating an account.
- A report is associated with the selected water-point location.
- A successful submission is saved in the database.
- The public board reflects the latest report.
- Duplicate active reports for the same location are prevented or the existing active issue is displayed.

### US-03: Review Unresolved Reports

**User Story:** As a facilities staff member, I want to view unresolved reports so that I can identify issues that need attention.

**Acceptance Criteria:**
- Staff can access the dashboard after successful login.
- Unauthenticated users cannot access protected staff functions.
- The dashboard displays unresolved reports and their associated water-point locations.
- Reports remain available after normal application restarts when the database volume is retained.

### US-04: Confirm Issue Resolution

**User Story:** As a facilities staff member, I want to confirm when an issue has been addressed so that students can see the updated status.

**Acceptance Criteria:**
- Only authenticated staff can confirm resolution.
- A successful resolution updates the report status.
- The resolution update is saved in PostgreSQL.
- The public board displays Staff-Confirmed Resolved and the updated timestamp.
- The report and its resolution history remain available.

## 6. Feasibility and Dependencies

### Technology Stack

- **Frontend:** React, JavaScript, Vite
- **Styling:** Tailwind CSS
- **Frontend Libraries:** React Router, Axios, Lucide React
- **Backend:** Python, FastAPI, Pydantic
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL
- **Authentication:** JWT and password hashing
- **Containerization:** Docker and Docker Compose
- **CI:** GitHub Actions

### Dependencies

- Campus water-point names and location information, or clearly labelled synthetic data for demonstration.
- PostgreSQL database for storing water points, reports, and resolution history.
- Staff login credentials for accessing protected facilities functions.
- Docker and Docker Compose for local application setup.
- GitHub repository and Actions for version control and automated checks.

No external API or sensor integration is required for the initial version.

### Technical Limitations

- Water-point status depends on student-submitted reports and staff updates.
- The application cannot independently verify whether a dispenser is working.
- The accuracy of the directory depends on the availability of reliable campus location information.
- The initial version is designed for local demonstration and does not depend on cloud deployment.

### Security and Privacy Considerations

- Staff-only actions must be protected by authentication and authorization.
- Staff passwords must be stored as hashes, not plain text.
- JWT secrets and database credentials must be stored in environment variables and not committed to the repository.
- Students do not need accounts to submit reports.
- Synthetic data should be used for demonstrations where real campus data is unavailable.
- Only the information required to report and resolve an issue should be collected.

## 7. Delivery and Validation Plan

### Team Responsibilities

- **Team Lead:** Coordinate sprint activities, maintain the repository, manage integration, review pull requests, and oversee final validation and submission.
- **Team Member:** Work on assigned frontend/backend features, database integration, documentation, and testing through individual feature branches and pull requests.
- **Both Members:** Discuss requirements, review progress, test the integrated application, and resolve issues.

### Five-Week Sprint Timeline

| Week | Planned Activities | Expected Outcome |
|---|---|---|
| **Week 1 – Planning and PRD** | Understand the problem, identify target users, define objectives and success metrics, finalize scope and architecture, prepare repository documentation, and raise the PRD PR for mentor review. | Reviewed PRD and finalized project plan. |
| **Week 2 – Project Setup and Backend** | Set up React, FastAPI, PostgreSQL, and Docker Compose. Design database tables and implement water-point and report APIs. | Working project foundation and backend APIs. |
| **Week 3 – Frontend Development** | Build student dashboard, water-point directory, report form, staff login, and facilities dashboard. Implement staff authentication and resolution actions. | Main student and staff workflows. |
| **Week 4 – Integration and Testing** | Connect frontend and backend, implement duplicate handling, status history, timestamps, persistent database configuration, GitHub Actions checks, and manual testing. | Fully integrated working application. |
| **Week 5 – Finalization and Submission** | Fix remaining issues, prepare synthetic demo data, complete README and runbook, verify setup instructions, perform final review, and submit the required PR. | Tested, documented, submission-ready project. |

### Testing and Validation Plan

The team will manually verify the following workflows:

1. Students can view the public water-point directory.
2. Students can submit an unavailable report without logging in.
3. Duplicate active reports are handled correctly.
4. Staff can log in and view unresolved reports.
5. Unauthenticated users cannot perform staff-only actions.
6. Authorized staff can confirm resolution.
7. Status labels and timestamps update correctly.
8. Reports remain available after an application restart when the database volume is retained.

GitHub Actions will be used for the configured repository checks.

### Demonstration Plan

The project will be demonstrated locally using Docker Compose.

The demonstration will cover:

1. Opening the public water-point directory.
2. Viewing a water point's latest reported status.
3. Submitting an unavailable report as a student.
4. Logging in as facilities staff.
5. Viewing the unresolved report and confirming resolution.
6. Returning to the public board to verify the updated status and timestamp.
7. Restarting the application to demonstrate data persistence.

Cloud deployment is not part of the initial scope unless separately required.

## 8. Key Assumptions and Constraints

- The project follows a five-week sprint timeline.
- The team aims to complete the core working application within two weeks of implementation, using the remaining sprint time for testing, reliability, documentation, and final submission.
- Synthetic demonstration records may be used if verified campus water-point data is unavailable.
- Staff must investigate an issue before confirming it as resolved.
- Reports must remain stored across normal application restarts when the database volume is retained.
- Demo records must be clearly identified as synthetic.
- All contributions must be submitted through pull requests targeting the main branch.