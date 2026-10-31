# Campus WaterPoint Board


## Problem Statement


Students carrying bottles visit several campus water points before finding one that works. Build a water-point issue board where students report unavailable dispensers and facilities staff confirm resolution. Show each location’s latest reported status and update time; keep reports available across shifts without claiming real-time sensor verification.


## Team Details


**Campus:** CHR
**Squad:** 62
**Team:** 03
**Team Members:** Refer to CONTRIBUTORS.md
## Tech Stack


React, JavaScript, Vite
Tailwind CSS
React Router, Axios, Lucide React
Python, FastAPI, Pydantic
SQLAlchemy, PostgreSQL
JWT Authentication and Password Hashing
Docker, Docker Compose
GitHub Actions
## Setup / Run / Test Instructions


### Prerequisites
Git
Docker Desktop or Docker Engine with Docker Compose
### Clone Repository


    git clone <REPOSITORY_URL>
    cd <REPOSITORY_DIRECTORY>


### Environment Setup


Create a .env file using .env.example as a reference.


### Run Application


    docker compose up --build


Expected local URLs (confirm ports in docker-compose.yml):


Frontend: http://localhost:5173
Backend: http://localhost:8000
API Documentation: http://localhost:8000/docs
### Stop Application


    docker compose down


### Test


Manually verify:
1. Students can view water points and submit unavailable reports.
2. Duplicate active reports are handled.
3. Staff can log in and view unresolved reports.
4. Only authorized staff can confirm resolution.
5. Status and timestamps update correctly.
6. Reports remain available after an application restart when the database volume is retained.


## Environment Variables


DATABASE_URL
JWT_SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
VITE_API_BASE_URL
Refer to .env.example for the actual configuration.


## Demo Link


<Add working project demo link>


## Project Board Link


<Add team project board link>
