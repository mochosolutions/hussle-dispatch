# DocuSeal Template Setup — DispatchAgreement

> **Purpose:** Set up the DispatchAgreement template in DocuSeal so the dispatch-api can request signed agreements from carriers.
>
> **Audience:** Engineers / ops staff bringing up a new environment (dev / staging / prod).
>
> **Time:** ~15 minutes per environment, one-time per environment.

---

## Why this exists

DocuSeal Open Source has **no programmatic template upload** — the `/api/templates/{html,pdf,docx}` endpoints are paywalled (Pro Edition). All template creation goes through the admin UI.

This means each environment that runs DocuSeal needs a one-time manual template setup. Once created, the template is referenced by ID via the `DOCUSEAL_DISPATCH_TEMPLATE_ID` env var.

The dispatch-api passes carrier-specific data (legal name, MC#, DOT#, dispatcher org name, effective date) into the template via `submitters[].values`. **Field names in the DocuSeal template must match exactly** — see the field reference table below. Drift between the template and the code constants causes silent pre-fill misses (DocuSeal accepts unknown keys without erroring).

---

## Prerequisites

1. DocuSeal instance running and reachable (e.g. `http://localhost:3030` for local dev, `https://docuseal-staging.fleetcommand.app` for staging).
2. Admin login credentials for that DocuSeal instance.
3. The designed dispatch agreement PDF — get from legal/ops. The PDF should have placeholder text where carrier-specific fields go (e.g. "Carrier: ___________"); we'll drag DocuSeal field markers onto those positions.
4. A DocuSeal API key generated in **Settings → API**.
5. (Optional, recommended) A webhook configured in **Settings → Webhooks** pointing to `<api-base-url>/webhooks/docuseal` with all 4 events enabled (`form.completed`, `form.declined`, `form.expired`, `form.viewed`). Note the HMAC signing secret DocuSeal generates.

---

## Setup steps

### 1. Create the template in DocuSeal admin

1. Log into the DocuSeal admin UI.
2. **Templates → New → Upload PDF.**
3. Upload the dispatch agreement PDF.
4. The DocuSeal field editor opens.

### 2. Add the role

5. In the right sidebar: under "Roles", add a single role named **`Carrier`** (case-sensitive — must match the literal `'Carrier'` string in `docusealProvider.createSubmission`).

### 3. Add the data fields

For each row in the field reference table below:

6. From the left palette, drag a **Text** field onto the PDF where that data should appear.
7. With the field selected, in the right sidebar set **Name** to the exact value from the "Field name" column.
8. Set **Required** = no (the dispatch-api fills these via API; the carrier shouldn't edit them).
9. Set **Read-only** = yes (so the carrier sees the pre-filled value as immutable).

**Field reference table** — must match `src/agreements/templates/dispatchAgreementFields.ts` constants verbatim:

| Constant in code | Field name in DocuSeal | Description |
|---|---|---|
| `DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME` | `carrier_legal_name` | The carrier's legal entity name (e.g. "Acme Trucking LLC") |
| `DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER` | `mc_number` | MC docket number (e.g. "MC123456") |
| `DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER` | `dot_number` | DOT number (may be blank if carrier has no DOT) |
| `DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME` | `dispatcher_org_name` | The dispatching org's name (your tenant name) |
| `DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE` | `effective_date` | Agreement effective date (ISO YYYY-MM-DD) |

### 4. Add the carrier signature block

10. From the left palette, drag a **Signature** field onto the carrier signature line. Required = yes. Role = `Carrier`.
11. Drag a **Date** field onto the date line. Required = yes. Role = `Carrier`. (DocuSeal auto-fills with the signing timestamp.)

### 5. Save and capture the template ID

12. Click **Save** in the top-right.
13. The browser URL becomes `<docuseal-host>/templates/{N}` — copy that `N`.

### 6. Wire into dispatch-api

14. Set environment variables in the dispatch-api `.env` (or your secret store):

    ```
    SIGNATURE_PROVIDER=docuseal
    DOCUSEAL_BASE_URL=<docuseal host, e.g. http://hussle-app-docuseal:3000 for docker-network>
    DOCUSEAL_API_KEY=<from Settings → API>
    DOCUSEAL_WEBHOOK_SECRET=<from Settings → Webhooks>
    DOCUSEAL_DISPATCH_TEMPLATE_ID=<the N from step 13>
    ```

15. Restart the dispatch-api.

### 7. Smoke test

16. Authenticate as a dispatcher and POST a test agreement:

    ```bash
    curl -X POST http://<api-host>/api/v1/agreements \
      -H "Content-Type: application/json" \
      -H "Cookie: accessToken=<your-jwt>" \
      -d '{
        "carrierId": "<a real carrier id in your org>",
        "templateKey": "DISPATCH_AGREEMENT",
        "signerName": "Test Signer",
        "signerEmail": "test@your-domain.example"
      }'
    ```

17. Expect HTTP 201 with a JSON body containing `embedUrl`. Open the URL in a browser. The 5 data fields should be pre-filled. The signature + date fields should be empty (waiting for the carrier).
18. Sign the document. Verify a webhook fires (check `/webhooks/docuseal` request log on the dispatch-api side; HMAC should validate to 200).

If anything fails, see Troubleshooting below.

---

## Updating the template

DocuSeal versions templates internally — when you save a change, in-flight submissions remain on the version they were created against. New submissions use the latest version.

To update the legal text or visual layout: edit in DocuSeal admin UI, save. No code change, no env change, no restart.

To add or rename a field: this is a **breaking change** that requires both the DocuSeal template change AND a code change in `src/agreements/templates/dispatchAgreementFields.ts` (and the runbook table above). Coordinate both deployments.

---

## Per-environment matrix

Track which template ID is in each env. Update this table as new envs are bootstrapped.

| Environment | DocuSeal URL | Template ID | Owner |
|---|---|---|---|
| local dev | `http://localhost:3030` | _set per developer_ | Each dev |
| staging | `https://docuseal-staging.fleetcommand.app` | _TBD — set when staging deployed_ | Eng |
| prod | `https://docuseal.fleetcommand.app` | _TBD — set when prod deployed_ | Eng |

---

## Troubleshooting

**`422 {"error":"template_id is required"}`**
→ `DOCUSEAL_DISPATCH_TEMPLATE_ID` is not set or is `0`. Check your `.env`. Restart the api after editing.

**Submission created but values are not pre-filled in the DocuSeal UI**
→ Field names in the DocuSeal template don't match the `DISPATCH_AGREEMENT_FIELDS` constants. Open the template in DocuSeal admin → click each field → check the **Name** matches the table above character-for-character (lowercase + underscore separator).

**`404 Not Found` on `POST /api/submissions`**
→ The `DOCUSEAL_DISPATCH_TEMPLATE_ID` references a template that doesn't exist on this DocuSeal instance. Templates don't sync between environments — each env needs its own. Verify by visiting `<docuseal-host>/templates/{N}` in the browser.

**`401 Unauthorized` from DocuSeal**
→ `DOCUSEAL_API_KEY` is missing or wrong. Regenerate in **Settings → API**.

**Signing completes but no webhook arrives**
→ The DocuSeal webhook URL is unreachable from the DocuSeal container, OR the webhook secret doesn't match. From DocuSeal's container, can it reach `<api-host>/webhooks/docuseal`? Use docker network hostnames where applicable (e.g. `http://hussle-app-dispatch-api:3001/webhooks/docuseal` for the local docker stack).

**Webhook arrives but dispatch-api returns `401 invalid signature`**
→ `DOCUSEAL_WEBHOOK_SECRET` doesn't match what DocuSeal is signing with. Regenerate in **Settings → Webhooks**, copy into `.env`, restart the api.

**Webhook returns `404 unknown submission_id`**
→ The submission was created directly against DocuSeal (e.g., from the admin UI or a probe curl), not via `POST /api/v1/agreements`. The dispatch-api has no `Agreement` row for this `providerSubmissionId`. Expected behavior; not a bug.

---

## References

- Field constants: [`src/agreements/templates/dispatchAgreementFields.ts`](../../hussle-app-dispatch-api/src/agreements/templates/dispatchAgreementFields.ts) — single source of truth in code
- Provider HTTP impl: [`src/shared/signatures/docusealProvider.ts`](../../hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts) — what the request body looks like
- Feature PRD: [`.planning/document-signing/PRD.md`](../../.planning/document-signing/PRD.md)
- Verification report: [`.planning/document-signing/verification.md`](../../.planning/document-signing/verification.md)
- Staging infra stub: [`hussle-app-dispatch-infra/dokploy/docuseal-staging.md`](../../hussle-app-dispatch-infra/dokploy/docuseal-staging.md) — deploy notes for staging
