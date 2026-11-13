**# Cloud Responsibility Map: Campus WaterPoint Board**

**\*\*Course Unit:\*\*** Kalvium Unit 2.12: Cloud Responsibility Map for the Assigned Host &#x20;

**\*\*Project:\*\*** Campus WaterPoint Board &#x20;

**\*\*Campus:\*\*** CHR | **\*\*Squad:\*\*** 62 | **\*\*Team:\*\*** 03 &#x20;

**\*\*Team Members:\*\*** Gowrishankar S, Paul Joe Koshy (refer to [CONTRIBUTORS.md]\(../CONTRIBUTORS.md)) &#x20;

**\*\*Tracking Incident Issue:\*\*** [#4 — Incident: Campus WaterPoint Board]\(https\://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4) &#x20;



\---



**## 1. Architectural Decisions and Current Status**



The Campus WaterPoint Board system is designed around a decoupled client-server architecture:



\- **\*\*Frontend:\*\*** React + Vite single-page application (SPA), planned for hosting on **\*\*Vercel\*\***.

\- **\*\*Backend:\*\*** Python FastAPI REST API, planned for hosting on **\*\*Render PaaS\*\*** as a containerized web service using Docker.

\- **\*\*Database:\*\*** PostgreSQL (with SQLAlchemy 2.0 and Alembic migrations), hosting choice **\*\*not finalized\*\*** (under evaluation).

\- **\*\*CI/CD:\*\*** GitHub Actions (automated testing and deployment pipelines).

\- **\*\*Local Development:\*\*** Local Python virtual environment and Node.js runtime, with containerized local orchestration planned via Docker Compose.



\> [!IMPORTANT]

\> **\*\*Deployment Status Disclaimer:\*\*** Deployment to Render and Vercel has **\*\*not\*\*** been executed. The project foundation currently operates in local development. All references to cloud hosting platforms represent planned architecture and operational assignments. No secrets, credentials, or live connection strings are stored in this repository.



\---



**## 2. Cloud Responsibility Map (Primary Host: Render PaaS)**



Render PaaS serves as the primary assigned cloud host for the backend API service. The table below outlines the division of responsibilities across the eight core operational areas under Render's shared responsibility model.



\| Responsibility Area | Owner | Provider Responsibility & Evidence Links | Team Responsibility & Repository Reference |

\|---|---|---|---|

\| **\*\*Hardware and facility\*\*** | \`Provider\` | Render manages and secures all physical compute, storage, rack infrastructure, power, cooling, and data center facilities through its underlying cloud infrastructure partners (AWS/GCP).\<br>*\*(Evidence: [Render Shared Responsibility Model]\(*&#x68;ttps\://render.com/docs/shared-responsibility-mode&#x6C;*))\** | None. Team has no physical access or responsibility for host hardware or data center facilities. |

\| **\*\*OS patches\*\*** | \`Split\` | Render patches and updates the underlying host operating system, hypervisors, and virtualization node infrastructure.\<br>*\*(Evidence: [Render Shared Responsibility Model]\(*&#x68;ttps\://render.com/docs/shared-responsibility-mode&#x6C;*), [Render Docker Deployment]\(*&#x68;ttps\://render.com/docs/docke&#x72;*))\** | **\*\*Team: Gowrishankar S & Paul Joe Koshy\*\***\<br>Responsible for patching the container guest OS, updating base images, and upgrading container-level packages inside the Dockerfile.\<br>*\*Repository Reference:\** **\*\*Not yet done, to be closed in the relevant future cloud unit.\*\*** |

\| **\*\*Container runtime\*\*** | \`Split\` | Render manages the cloud container execution infrastructure, building container images from repository Dockerfiles, provisioning runtime instances, executing containers, and handling automated process restarts upon unexpected crashes.\<br>*\*(Evidence: [Render Docker Deployment]\(*&#x68;ttps\://render.com/docs/docke&#x72;*), [Render Web Services]\(*&#x68;ttps\://render.com/docs/web-service&#x73;*))\** | **\*\*Team: Gowrishankar S & Paul Joe Koshy\*\***\<br>Responsible for authoring the Dockerfile, defining the application container image, and managing dependency updates.\<br>*\*Repository Reference:\** **\*\*Not yet done, to be closed in the relevant future cloud unit.\*\*** (A \`Dockerfile\` is not yet present in the repository). |

\| **\*\*Network and firewall\*\*** | \`Split\` | Render manages infrastructure-level network protections: built-in edge DDoS mitigation (mitigating Layer 3/4 network floods and volumetric Layer 7 attacks via Cloudflare), ingress routing from public HTTPS/HTTP ports to the internal container port (\`$PORT\`), and isolated private networking between services.\<br>*\*(Evidence: [Render DDoS Protection]\(*&#x68;ttps\://render.com/docs/ddos-protectio&#x6E;*), [Render Web Services]\(*&#x68;ttps\://render.com/docs/web-service&#x73;*))\** | **\*\*Team: Gowrishankar S\*\***\<br>Responsible for binding the web server to the internal port specified by the platform (\`PORT\`, defaulting to 10000 on Render) and configuring endpoint routes.\<br>*\*Note on distinction:\** Infrastructure firewalls, DDoS protection, and port routing operate at the network layer (managed by Render). In contrast, application-layer policies such as Cross-Origin Resource Sharing (CORS) headers and application-level authorization are HTTP application-layer concerns handled in FastAPI code. Both CORS middleware and application-level authorization are **\*\*not yet implemented\*\*** in the repository (to be integrated in future units).\<br>*\*Repository Reference:\** [backend/app/main.py]\(../backend/app/main.py), [backend/app/config.py]\(../backend/app/config.py) |

\| **\*\*TLS certificate\*\*** | \`Provider\` | Render automatically provisions, issues, validates, terminates, and renews managed TLS/SSL certificates (via Let's Encrypt) for all \`\*.onrender.com\` subdomains and custom domains, enforcing HTTP-to-HTTPS redirection.\<br>*\*(Evidence: [Render Custom Domains & TLS]\(*&#x68;ttps\://render.com/docs/custom-domain&#x73;*))\** | None. Certificate lifecycle and cryptographic handshakes are fully automated by Render edge routers. |

\| **\*\*Database backups\*\*** | \`Split\` | Conditional on the final hosting provider and plan: If Render Managed PostgreSQL is provisioned on a **\*\*paid plan\*\***, Render provides automated daily continuous backups with Point-in-Time Recovery (PITR) retained for 3 to 7 days, as well as manual export options. If Render's **\*\*free tier\*\*** is selected, Render does not provide automated backups or PITR.\<br>*\*(Evidence: [Render PostgreSQL Backups]\(*&#x68;ttps\://render.com/docs/postgresql-backup&#x73;*))\** | **\*\*Team: Gowrishankar S\*\***\<br>Conditional on final PostgreSQL hosting choice and tier:\<br>- If a paid managed database with automated PITR is chosen, team duties are limited to periodic export verification.\<br>- If a free-tier database (such as Render Free PostgreSQL) or a self-hosted PostgreSQL instance (e.g., campus VM or containerized DB) is chosen, the team is fully responsible for designing, scheduling, and executing automated backups (e.g., via \`pg_dump\` cron jobs and off-site backup storage).\<br>Because database hosting choice is not finalized, backup procedures are not yet implemented.\<br>*\*Repository Reference:\** **\*\*Not yet done, to be closed in the relevant future cloud unit.\*\*** |

\| **\*\*Secrets and config\*\*** | \`Split\` | Render provides an encrypted secret store and dashboard interface, securely injecting environment variables and secret files into the container runtime process without writing secrets to container image layers.\<br>*\*(Evidence: [Render Environment Variables]\(*&#x68;ttps\://render.com/docs/environment-variable&#x73;*))\** | **\*\*Team: Paul Joe Koshy & Gowrishankar S\*\***\<br>Responsible for managing environment variables across environments:\<br>- **\*\*Active DB Config:\*\*** Populating \`DATABASE_URL\` (or fallback parameters \`POSTGRES_USER\`, \`POSTGRES_PASSWORD\`, \`POSTGRES_HOST\`, \`POSTGRES_PORT\`, \`POSTGRES_DB\`) required by \`backend/app/config.py\` and \`backend/app/database.py\`.\<br>- **\*\*Frontend Target:\*\*** Configuring \`VITE_API_BASE_URL\` in the frontend environment.\<br>- **\*\*Future Work (Auth):\*\*** \`JWT_SECRET_KEY\`, \`JWT_ALGORITHM\`, and \`ACCESS_TOKEN_EXPIRE_MINUTES\` exist as placeholders in \`backend/app/config.py\` and \`.env.example\`, but staff authentication is not yet implemented; activating and rotating these keys is future work.\<br>- **\*\*Secret Hygiene:\*\*** Ensuring \`.env\` remains untracked in Git via \`.gitignore\`, committing only non-secret placeholders in \`.env.example\`, and configuring production values in the Render dashboard.\<br>*\*Repository Reference:\** [.gitignore]\(../.gitignore), [.env.example]\(../.env.example), [backend/app/config.py]\(../backend/app/config.py) |

\| **\*\*Application code\*\*** | \`Team: Gowrishankar S & Paul Joe Koshy\` | Render provides compute execution resources as requested, but has no ownership or visibility into application business logic, code correctness, or software vulnerabilities.\<br>*\*(Evidence: [Render Shared Responsibility Model]\(*&#x68;ttps\://render.com/docs/shared-responsibility-mode&#x6C;*))\** | **\*\*Team: Gowrishankar S & Paul Joe Koshy\*\***\<br>Responsible for developing, testing, maintaining, and debugging FastAPI endpoints, SQLAlchemy data models, Pydantic validation schemas, business rules, and migrations.\<br>*\*Repository Reference:\** [backend/app/main.py]\(../backend/app/main.py), [backend/app/models.py]\(../backend/app/models.py), [backend/app/schemas.py]\(../backend/app/schemas.py), [backend/app/crud.py]\(../backend/app/crud.py), [backend/app/database.py]\(../backend/app/database.py), [backend/tests/]\(../backend/tests/) |



\---



**## 3. Analysis: Why We Might Wrongly Assume the Cloud Provider Patches the OS**



A common architectural misconception when adopting a Platform as a Service (PaaS) like Render is assuming that the cloud provider handles **\*\*all\*\*** operating system patching.



**### 1. The Root of the Misconception**

In standard PaaS environments (such as Render's native Python runtime or Heroku buildpacks), developers only submit source code and dependency manifests (\`requirements.txt\`). In that operational model, the provider provisions the runtime environment, manages the operating system, and automatically applies system-level security patches to the underlying Linux distribution.



**### 2. The Docker Boundary Difference**

For Campus WaterPoint Board, the architectural decision specifies deploying the FastAPI backend **\*\*using Docker\*\***. This changes the security boundary:



\- **\*\*Host OS (Provider Managed):\*\*** Render operates and updates the underlying host server infrastructure, virtualization layer, and host operating system.

\- **\*\*Container Base OS (Team Managed):\*\*** The Docker container packages its own user-space operating system (e.g., Debian or Alpine within \`python:3.12-slim\`). Render treats this container as an opaque execution package. Render's orchestration platform does **\*\*not\*\*** inspect, modify, or update packages installed inside the container filesystem.



**### 3. Operational Consequence**

If a critical CVE emerges in a system library inside the container (e.g., \`glibc\`, \`libcrypto\`, or \`curl\`), Render will **\*\*not\*\*** patch it. Assuming the cloud provider patches the container OS leaves the service vulnerable. The team (Gowrishankar S and Paul Joe Koshy) remains responsible for:

1\. Monitoring base image vulnerabilities.

2\. Updating the base image tag in the \`Dockerfile\`.

3\. Rebuilding and deploying the updated container image.



**### 4. Comparison with Infrastructure as a Service (VM Misconception)**

If we had used an Oracle VM, we might have assumed Oracle patches the guest operating system. That would be incorrect: the team operating the VM must manage guest OS security updates. On our planned Render PaaS deployment, Render manages the underlying host OS, while our team maintains the container base image.



\---



**## 4. Planned Hosting Region for Campus Users**



Network proximity between the cloud host and end users directly influences round-trip latency, TCP handshake duration, and API responsiveness.



**### Campus Context & Candidate Region**

\- **\*\*Campus User Location:\*\*** Campus WaterPoint Board serves students and facilities staff at Campus CHR (India, UTC+05:30).

\- **\*\*Available Render Regions:\*\*** Render provides compute services in five regions:

&#x20; 1\. Singapore (\`singapore\` — Asia Southeast)

&#x20; 2\. Frankfurt, Germany (\`frankfurt\` — Europe Central)

&#x20; 3\. Oregon, USA (\`oregon\` — US West)

&#x20; 4\. Ohio, USA (\`ohio\` — US East)

&#x20; 5\. Virginia, USA (\`virginia\` — US East)

*\*(Reference: [Render Regions]\(*&#x68;ttps\://render.com/docs/region&#x73;*))\**



**### Regional Latency Rationale & Evaluation**

The **\*\*planned candidate region\*\*** for the backend service is **\*\*Singapore (\`singapore\`)\*\***, which will be evaluated for campus users. Because Campus CHR is located in India, Singapore is geographically proximate and serves as a primary candidate to benchmark against European (Frankfurt) or North American regions.



However, Singapore is a **\*\*candidate region to evaluate rather than a guaranteed lowest-latency location\*\***. Real-world latency depends on campus ISP transit routing, international peering agreements, and backbone hops. Empirical round-trip latency will be measured once deployed to verify whether Singapore or an alternative region delivers the most consistent responsiveness for students and staff.



\> [!NOTE]

\> **\*\*Region Selection Status:\*\*** A hosting region has **\*\*not yet been selected or finalized\*\***. The final hosting region will be confirmed upon mentor review, faculty infrastructure guidelines, and empirical latency evaluation during the cloud deployment unit. Render does not support migrating an existing service across regions without recreation ([Render Regions]\(https\://render.com/docs/regions)), making deliberate pre-provisioning evaluation necessary.



\---



**## 5. Connection-Time Measurement Protocol**



To ensure data integrity and avoid fabricated performance claims, connection-time metrics must be collected from real, deployed infrastructure rather than estimated.



**### Measurement Status**

\- **\*\*Status:\*\*** **\*\*PENDING\*\***

\- No connection-time measurements have been conducted yet. Live timing will be recorded once the backend container is provisioned on Render and a public health endpoint is operational.



**### Verification Command Protocol**

When the project backend is deployed to Render, the team will measure connection latency from the campus network using the following automated \`curl\` diagnostic:



\`\`\`bash

curl -o /dev/null -s -w "\\

DNS Lookup Time:        %{time_namelookup}s\n\\

TCP Connection Time:    %{time_connect}s\n\\

TLS Handshake Time:     %{time_appconnect}s\n\\

Pre-Transfer Time:      %{time_pretransfer}s\n\\

Time to First Byte:     %{time_starttransfer}s\n\\

\-----------------------------------------\n\\

Total Request Time:     %{time_total}s\n" \\

"https\://\<backend-service-slug>.onrender.com/health"

\`\`\`



**### Metrics to Record Post-Deployment**

\| Metric | Description | Status / Measured Value |

\|---|---|---|

\| \`time_namelookup\` | DNS resolution time from client to service edge | Pending deployment and measurement |

\| \`time_connect\` | TCP 3-way handshake completion time | Pending deployment and measurement |

\| \`time_appconnect\` | TLS cryptographic handshake completion time | Pending deployment and measurement |

\| \`time_pretransfer\` | Time from start until file transfer begins | Pending deployment and measurement |

\| \`time_starttransfer\` | Time to First Byte (TTFB), including server processing | Pending deployment and measurement |

\| \`time_total\` | Total duration of the round-trip HTTP transaction | Pending deployment and measurement |



\---



**## 6. Planned Frontend Platform: Vercel**



While Render PaaS is the assigned primary host for the containerized backend, the frontend client will be hosted independently.



\- **\*\*Architecture:\*\*** React + Vite Single Page Application (SPA).

\- **\*\*Target Platform:\*\*** **\*\*Vercel\*\*** (Static Site & Edge Network).

\- **\*\*Deployment Status:\*\*** **\*\*Not yet deployed\*\*** (currently running locally via \`npm run dev\`).



**### Operational Ownership on Vercel**

1\. **\*\*Vercel (Provider) Responsibilities:\*\***

&#x20;  \- Global Edge Content Delivery Network (CDN) distribution.

&#x20;  \- Automated SSL/TLS certificate generation and zero-config renewal.

&#x20;  \- Atomic deployments and preview branches linked to GitHub pull requests.

&#x20;  \- Built-in edge DDoS mitigation and HTTP compression (Brotli/Gzip).

2\. **\*\*Team Responsibilities:\*\***

&#x20;  \- **\*\*Team: Paul Joe Koshy & Gowrishankar S\*\***

&#x20;  \- Authoring and maintaining React components, styles, and asset bundles ([frontend/src/App.jsx]\(../frontend/src/App.jsx)).

&#x20;  \- Configuring the Vite build pipeline ([frontend/vite.config.js]\(../frontend/vite.config.js)).

&#x20;  \- Configuring the backend API target URL via the \`VITE_API_BASE_URL\` environment variable in Vercel project settings to route API requests to Render.

&#x20;  \- Managing client-side error states when the backend is sleeping or unreachable.



\---



**## 7. Secrets and Security Policy**



In accordance with Kalvium engineering guidelines:



1\. **\*\*Active Configuration vs. Future Work:\*\***

&#x20;  \- **\*\*Active Database Configuration:\*\*** \`DATABASE_URL\` (and individual fallback parameters \`POSTGRES_USER\`, \`POSTGRES_PASSWORD\`, \`POSTGRES_HOST\`, \`POSTGRES_PORT\`, \`POSTGRES_DB\`) and \`VITE_API_BASE_URL\` are active configurations used for database connectivity and frontend routing.

&#x20;  \- **\*\*Future Work (Authentication):\*\*** \`JWT_SECRET_KEY\`, \`JWT_ALGORITHM\`, and \`ACCESS_TOKEN_EXPIRE_MINUTES\` are reserved placeholders in [backend/app/config.py]\(../backend/app/config.py) and [.env.example]\(../.env.example). Because staff authentication and token verification routes are not yet implemented in the application, configuring and rotating production JWT secrets is marked as future work for the authentication unit.

2\. **\*\*No Credentials in Source Control:\*\*** No real passwords, tokens, API keys, or private database credentials are committed to this repository. The [.gitignore]\(../.gitignore) file strictly excludes \`.env\` and \`.env.\*\` files.

3\. **\*\*Template Documentation Only:\*\*** The [.env.example]\(../.env.example) file defines required variable keys with dummy placeholders to guide team configuration without leaking operational secrets.

4\. **\*\*Production Secret Injection:\*\*** When deploying to Render, production secrets will be securely configured via the Render web dashboard environment settings or encrypted secret files, injected into container process memory at runtime.
