/**
 * Standalone probe: verify DocuSeal field prefill works against a given env
 * WITHOUT touching the template.
 *
 * Strategy:
 *   1. GET /api/templates/{id} to discover the field names that already exist
 *      in the template (we don't care what they are — we just use them as-is).
 *   2. Construct PROBE values keyed by those discovered field names.
 *   3. POST /api/submissions with those values.
 *   4. Print the embed URL. Open it in a browser. If the PROBE values appear
 *      in the document at the field positions, prefill MECHANICALLY WORKS in
 *      this DocuSeal instance — independent of whether the field names match
 *      our `dispatchAgreementFields.ts` constants.
 *
 * This isolates "does DocuSeal OSS support `submitters[].values` prefill?"
 * (the question) from "are the names in dispatchAgreementFields.ts the same
 * as the names in my template?" (the eventual setup task).
 *
 * Usage:
 *   cd hussle-app-dispatch-api
 *   npm run probe:docuseal-prefill
 *
 * Required env:
 *   DOCUSEAL_BASE_URL
 *   DOCUSEAL_API_KEY
 *   DOCUSEAL_DISPATCH_TEMPLATE_ID
 *
 * Optional:
 *   DOCUSEAL_SUBMITTER_ROLE
 */

import { env } from '@/config/env';

interface DocuSealField {
  uuid: string;
  submitter_uuid?: string;
  name: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  areas?: { x: number; y: number; w: number; h: number; page: number }[];
}

interface DocuSealSubmitterRoleDef {
  uuid: string;
  name: string;
}

interface DocuSealTemplateResponse {
  id: number;
  name: string;
  fields: DocuSealField[];
  submitters: DocuSealSubmitterRoleDef[];
}

interface DocuSealCreateSubmitterResponse {
  submission_id: number;
  slug: string;
  uuid: string;
  email: string;
  status: string;
  embed_src?: string;
}

// DocuSeal field types that accept a string value via `submitters[].values`.
// Signature, initials, image, file, stamp cannot be prefilled.
const PREFILLABLE_TYPES = new Set([
  'text',
  'number',
  'date',
  'checkbox',
  'select',
  'radio',
  'cells',
  'phone',
]);

const assertEnv = (key: string, value: string | number | undefined): string => {
  if (value === undefined || value === '' || value === 0) {
    throw new Error(
      `Missing required env var: ${key}. Set it in hussle-app-dispatch-api/.env and re-run.`,
    );
  }
  return String(value);
};

// Known field names get realistic, polished sample data so the rendered
// document looks like what a real carrier would see. Anything unknown falls
// back to a heuristic guess from the field name, then to a clean generic.
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const KNOWN_TEXT_VALUES: Record<string, string> = {
  // dispatch agreement fields (from dispatchAgreementFields.ts)
  carrier_legal_name: 'Acme Trucking LLC',
  mc_number: 'MC-1234567',
  dot_number: 'DOT-9876543',
  dispatcher_org_name: 'FleetCommand, Inc.',
  effective_date: TODAY_ISO,
};

const polishedTextValue = (fieldName: string): string => {
  const known = KNOWN_TEXT_VALUES[fieldName];
  if (known !== undefined) {
    return known;
  }
  const name = fieldName.toLowerCase();
  if (name.includes('email')) return 'carrier@example.com';
  if (name.includes('phone')) return '(555) 123-4567';
  if (name.includes('address')) return '123 Main St, Anytown, ST 12345';
  if (name.includes('city')) return 'Anytown';
  if (name.includes('state')) return 'ST';
  if (name.includes('zip') || name.includes('postal')) return '12345';
  if (name.includes('date')) return TODAY_ISO;
  if (name.includes('signature') || name.includes('signer')) return 'Jane Doe';
  if (name.includes('name')) return 'Jane Doe';
  if (name.includes('amount') || name.includes('rate') || name.includes('price')) {
    return '$1,250.00';
  }
  return 'Sample text';
};

const probeValueFor = (field: DocuSealField): string | number | boolean => {
  switch (field.type) {
    case 'number':
      return 4242;
    case 'date':
      return TODAY_ISO;
    case 'checkbox':
      return true;
    case 'phone':
      return '(555) 123-4567';
    default:
      // text, select, radio, cells — accept strings.
      return polishedTextValue(field.name);
  }
};

const main = async (): Promise<void> => {
  const baseUrl = assertEnv('DOCUSEAL_BASE_URL', env.DOCUSEAL_BASE_URL);
  const apiKey = assertEnv('DOCUSEAL_API_KEY', env.DOCUSEAL_API_KEY);
  const templateId = assertEnv(
    'DOCUSEAL_DISPATCH_TEMPLATE_ID',
    env.DOCUSEAL_DISPATCH_TEMPLATE_ID,
  );

  process.stdout.write('--- probe: DocuSeal field prefill (template-driven) ---\n');
  process.stdout.write(`base url:    ${baseUrl}\n`);
  process.stdout.write(`template id: ${templateId}\n\n`);

  // ---------- Step 1: discover the template's actual field names ----------

  process.stdout.write(`Step 1 — GET ${baseUrl}/api/templates/${templateId}\n`);

  const templateResponse = await fetch(`${baseUrl}/api/templates/${templateId}`, {
    method: 'GET',
    headers: { 'X-Auth-Token': apiKey },
  });

  if (!templateResponse.ok) {
    const text = await templateResponse.text();
    process.stderr.write(
      `\n  Template fetch failed: ${templateResponse.status} ${templateResponse.statusText}\n` +
        `  Body: ${text}\n\n` +
        'Common causes:\n' +
        '  401 → DOCUSEAL_API_KEY is wrong (regenerate in DocuSeal Settings → API)\n' +
        '  404 → DOCUSEAL_DISPATCH_TEMPLATE_ID points to a template that does not exist\n',
    );
    process.exit(1);
  }

  const template = (await templateResponse.json()) as DocuSealTemplateResponse;
  const allFields = template.fields ?? [];
  const prefillableFields = allFields.filter((f) => PREFILLABLE_TYPES.has(f.type));

  process.stdout.write(`  template name: ${template.name}\n`);
  process.stdout.write(`  total fields:  ${allFields.length}\n`);
  process.stdout.write(`  prefillable:   ${prefillableFields.length}\n\n`);

  if (allFields.length === 0) {
    process.stderr.write(
      'Template has zero fields. There is nothing to prefill — open\n' +
        `  ${baseUrl}/templates/${templateId}\n` +
        'and place at least one Text field on the document, then re-run.\n',
    );
    process.exit(1);
  }

  process.stdout.write('Discovered fields:\n');
  for (const f of allFields) {
    const prefillable = PREFILLABLE_TYPES.has(f.type);
    const marker = prefillable ? '✓' : '·';
    const note = prefillable ? '' : '  (cannot prefill — signature/initials/image/file/stamp)';
    process.stdout.write(`  ${marker} ${f.name}  [${f.type}]${note}\n`);
  }
  process.stdout.write('\n');

  if (prefillableFields.length === 0) {
    process.stderr.write(
      'Template has fields but none of a prefillable type. Add at least one\n' +
        'Text/Number/Date/Checkbox/Select field, then re-run.\n',
    );
    process.exit(1);
  }

  // ---------- Step 2: pick a submitter role ----------

  // Prefer the env-configured role if it matches one defined on the template;
  // otherwise fall back to the first role the template declares. This makes
  // the probe robust to the runbook-vs-default discrepancy ('Carrier' vs
  // 'First Party') — we don't fail on it, we just use whatever the template
  // accepts and report which one was used.
  const envRole = env.DOCUSEAL_SUBMITTER_ROLE;
  const templateRoleNames = (template.submitters ?? []).map((s) => s.name);
  const matchedRole = templateRoleNames.includes(envRole) ? envRole : templateRoleNames[0];

  if (matchedRole === undefined) {
    process.stderr.write('Template declares no submitter roles. Cannot continue.\n');
    process.exit(1);
  }

  if (matchedRole !== envRole) {
    process.stdout.write(
      `Note: DOCUSEAL_SUBMITTER_ROLE='${envRole}' does not match any role on this\n` +
        `template. Falling back to the first declared role: '${matchedRole}'.\n` +
        `Template roles: ${JSON.stringify(templateRoleNames)}\n\n`,
    );
  }

  // ---------- Step 3: build values from the discovered fields ----------

  const values: Record<string, string | number | boolean> = {};
  for (const f of prefillableFields) {
    values[f.name] = probeValueFor(f);
  }

  process.stdout.write('PROBE values (keyed by the field names the template actually has):\n');
  process.stdout.write(`${JSON.stringify(values, null, 2)}\n\n`);

  // ---------- Step 4: create the submission ----------

  process.stdout.write(`Step 2 — POST ${baseUrl}/api/submissions\n`);

  const submissionResponse = await fetch(`${baseUrl}/api/submissions`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: Number(templateId),
      send_email: false,
      submitters: [
        {
          name: 'PROBE Test Signer',
          email: 'probe@fleetcommand.test',
          role: matchedRole,
          values,
        },
      ],
    }),
  });

  if (!submissionResponse.ok) {
    const text = await submissionResponse.text();
    process.stderr.write(
      `\n  createSubmission failed: ${submissionResponse.status} ${submissionResponse.statusText}\n` +
        `  Body: ${text}\n`,
    );
    process.exit(1);
  }

  const parsed = (await submissionResponse.json()) as DocuSealCreateSubmitterResponse[];
  const submitter = parsed[0];

  if (!submitter || !submitter.embed_src) {
    process.stderr.write('DocuSeal returned a submitter without embed_src. Aborting.\n');
    process.exit(1);
  }

  process.stdout.write('--- success: submission created ---\n');
  process.stdout.write(`submission_id: ${submitter.submission_id}\n`);
  process.stdout.write(`embed_src:     ${submitter.embed_src}\n\n`);

  process.stdout.write('Next step — open the embed URL in a browser:\n\n');
  process.stdout.write(`  ${submitter.embed_src}\n\n`);

  process.stdout.write('Eyeball check:\n');
  process.stdout.write(
    '  ✓ If you see polished sample data (e.g. "Acme Trucking LLC", "MC-1234567",\n' +
      '    current date) rendered in the document → PREFILL MECHANICALLY WORKS\n' +
      '    in this DocuSeal instance. The fields, names, and role assignments are\n' +
      '    correct; you are clear to use this template for real signing flows.\n\n' +
      '  ✗ If the document opens but every value is blank → prefill is broken\n' +
      '    at the DocuSeal level (NOT a name-mismatch problem, since we used the\n' +
      '    template\'s own field names). Possible causes:\n' +
      `      • The fields are not assigned to the submitter role we used\n` +
      `        (we used role: '${matchedRole}'). Check the role chip on each\n` +
      `        field in the template editor.\n` +
      '      • DocuSeal version bug — try updating the docker image.\n' +
      '      • Mixed role assignment — fields on role A, submitter on role B.\n\n' +
      '  ⚠ If SOME fields prefill and others do not → the failing ones are likely\n' +
      '    assigned to a different submitter role than the one used here. Check\n' +
      '    each blank field\'s role chip in the template editor.\n',
  );

  process.stdout.write(
    `\nTo verify what DocuSeal received, fetch the submission directly:\n` +
      `  curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" ${baseUrl}/api/submissions/${submitter.submission_id}\n`,
  );
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`probe failed: ${message}\n`);
  process.exit(1);
});
