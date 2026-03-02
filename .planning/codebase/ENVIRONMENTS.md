# Environment Files

## Detected Files
| File | Location | Notes |
|------|----------|-------|
| docker-compose.yml | root | 2 active services (dispatch-ui, storybook), backend services commented out |

## Docker Services (Active)
| Service | Port | Command |
|---------|------|---------|
| dispatch-ui | 5173 | npx vite --host 0.0.0.0 |
| storybook | 6006 | npx storybook dev -p 6006 --host 0.0.0.0 --no-open |

## Docker Services (Commented Out — Planned)
| Service | Port | Image/Context |
|---------|------|---------------|
| hussle-app-dispatch-api | 3001 | ./hussle-app-dispatch-api |
| hussle-app-postgres | 5432 | postgres:15-alpine |
| hussle-app-pgadmin | 5050 | dpage/pgadmin4:latest |
| hussle-app-redis | 6379 | redis:7-alpine |
| hussle-app-redis-insight | 5540 | redis/redisinsight:latest |

## Environment Variables
| Variable | Service | Source |
|----------|---------|--------|
| CHOKIDAR_USEPOLLING=true | dispatch-ui, storybook | docker-compose.yml |
