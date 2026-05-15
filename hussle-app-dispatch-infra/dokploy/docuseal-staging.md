# DocuSeal — Staging Deploy Stub

> **Status: declared, not yet applied.** This file documents the staging deployment of DocuSeal for the agreement-signing flow. Apply via the Dokploy UI on the staging server when the dispatch-api branch consuming DocuSeal lands on staging.

## Service definition

```yaml
# Equivalent docker-compose stanza for the Dokploy "Compose" project.
# Create as a new compose application in Dokploy named: docuseal-staging
services:
  docuseal:
    image: docuseal/docuseal:latest
    restart: unless-stopped
    environment:
      FORCE_SSL: "true"
      HOST: docuseal-staging.fleetcommand.app
      DATABASE_URL: ${DOCUSEAL_DATABASE_URL}      # Postgres connection string (provision via Dokploy DB module)
      SECRET_KEY_BASE: ${DOCUSEAL_SECRET_KEY_BASE} # 64-char hex; generate via `openssl rand -hex 32`
    volumes:
      - docuseal_data:/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.docuseal-staging.rule=Host(`docuseal-staging.fleetcommand.app`)"
      - "traefik.http.routers.docuseal-staging.entrypoints=websecure"
      - "traefik.http.routers.docuseal-staging.tls.certresolver=letsencrypt"
      - "traefik.http.services.docuseal-staging.loadbalancer.server.port=3000"

volumes:
  docuseal_data:
```

## Required secrets (Dokploy → Secrets, env-scope: `staging`)

| Key | How to obtain |
|---|---|
| `DOCUSEAL_DATABASE_URL` | Dokploy DB module, Postgres 15 |
| `DOCUSEAL_SECRET_KEY_BASE` | `openssl rand -hex 32` |
| `DOCUSEAL_API_KEY` | Generated in DocuSeal admin UI after first boot — propagate to `hussle-app-dispatch-api`'s staging env |
| `DOCUSEAL_WEBHOOK_SECRET` | Generated in DocuSeal admin UI under Webhooks → propagate to dispatch-api staging env |

## DNS

Add Cloudflare A-record `docuseal-staging.fleetcommand.app` → staging Hetzner VPS IP. See `terraform/application/cloudflare_dns.tf` for the pattern (manual addition, not auto-managed by Terraform yet).

## Deploy steps (manual — once dispatch-api is ready)

1. In Dokploy UI: **Applications → New → Compose**. Name: `docuseal-staging`. Paste the YAML above.
2. Provision Postgres via Dokploy DB module; copy the connection string into `DOCUSEAL_DATABASE_URL`.
3. Set the other secrets (above).
4. Deploy.
5. Open `https://docuseal-staging.fleetcommand.app/setup`, create the admin account.
6. Generate API key (Settings → API) and webhook secret (Settings → Webhooks → endpoint = `https://api-staging.fleetcommand.app/webhooks/docuseal`).
7. Add both to dispatch-api staging env:
   - `SIGNATURE_PROVIDER=docuseal`
   - `DOCUSEAL_BASE_URL=https://docuseal-staging.fleetcommand.app`
   - `DOCUSEAL_API_KEY=<from step 6>`
   - `DOCUSEAL_WEBHOOK_SECRET=<from step 6>`
8. Redeploy dispatch-api.

## Rollback

`docker compose down` on the docuseal-staging app + flip `SIGNATURE_PROVIDER=mock` in dispatch-api staging env. The mock provider is deterministic and lets the rest of the agreement flow continue.
