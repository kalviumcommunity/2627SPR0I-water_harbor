
# Local Runtime and Tool Setup

## Machine Setup

The following tools are installed and verified on macOS.

| Tool | Version |
|---|---|
| Container Runtime | Docker Engine 29.5.2 |
| Compose | Docker Compose v5.1.4 |
| Git | git version 2.39.5 (Apple Git-154) |
| PostgreSQL Client | psql (PostgreSQL) 18.6 |

## Verification Commands

Run the following commands to verify the environment:

```bash
docker version --format '{{.Server.Version}}'
docker compose version
git --version
psql --version
```

## Container Runtime Test

Command:

```bash
docker run --rm hello-world
```

Result: Successful.

Docker pulled the hello-world image, created and executed a container, and displayed:

`Hello from Docker!`

This confirms that the Docker client successfully communicated with the Docker daemon and ran a container.

## Faculty-Approved Host

Pending confirmation from the faculty.

The host will be updated to one of the approved options:
- Render free tier
- Oracle Cloud free tier
- Campus VM

## Payment

No payment card or paid plan was used for this local setup.
