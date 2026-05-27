import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2,
  AlertCircle, Lock, ChevronDown, ChevronUp, PenTool,
  Package, Sparkles, Loader2, Info, Settings2, RotateCcw,
  FileText, UploadCloud, Activity, User, RefreshCw, Zap
} from 'lucide-react';

// ============================================================
// 1. SAMPLE SCHEMA — the declarative definition the engine traverses
// ============================================================
const SCHEMA = {
  version: 1,
  metadata: { name: 'Carrier Onboarding v1', estimatedMinutes: 12 },
  phases: [
    {
      id: 'welcome',
      label: 'Welcome',
      steps: [
        {
          id: 'segmentation',
          type: 'segmentation',
          title: "Let's get you dispatched",
          subtitle: 'Two quick questions to set things up for your operation.',
          questions: [
            {
              id: 'carrier_type',
              label: 'How do you operate?',
              fieldType: 'cards',
              options: [
                { value: 'owner_operator', label: 'Owner-operator', sub: '1 truck, I drive it' },
                { value: 'small_fleet', label: 'Small fleet', sub: '2–10 trucks' },
                { value: 'dispatcher_carrier', label: 'Dispatcher-carrier', sub: 'I run trucks and dispatch others' },
              ],
            },
            {
              id: 'service_tier',
              label: 'How do you want us to work together?',
              fieldType: 'cards',
              options: [
                { value: 'subscription', label: 'Software only', sub: '$99–499/mo, you dispatch' },
                { value: 'managed', label: 'Managed dispatch', sub: "7–10% of gross, we find loads" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'business',
      label: 'Business Profile',
      checkpoint: {
        title: "Let's set up your business profile",
        body: "We'll pull most of this from FMCSA — you just confirm. Takes about 3 minutes.",
        upcoming: ['Verify your authority', 'Confirm business details', 'Pick your signatory', 'Sign the dispatch agreement'],
      },
      steps: [
        {
          id: 'mc_entry',
          type: 'input',
          title: "What's your MC number?",
          subtitle: "We'll look up your authority so you don't have to retype anything.",
          questions: [
            {
              id: 'mc_number',
              label: 'MC Number',
              fieldType: 'mc',
              placeholder: 'MC-1234567',
              helpText: 'Find this on your MC certificate or any authority letter from FMCSA.',
            },
          ],
          sideEffects: [{ type: 'fmcsa_lookup', input: { mcField: 'mc_number' } }],
        },
        {
          id: 'fmcsa_verification',
          type: 'verification',
          waitingFor: 'fmcsa.completed',
          title: 'Looking up your authority...',
          subtitle: "This usually takes a few seconds. We're checking FMCSA's records.",
        },
        {
          id: 'business_confirm',
          type: 'input',
          title: 'Confirm your business details',
          subtitle: "We pulled this from FMCSA. Edit anything that's wrong.",
          questions: [
            { id: 'legal_name', label: 'Legal business name', fieldType: 'text', prefillFrom: 'fmcsa.legalName' },
            { id: 'dba', label: 'DBA (if different)', fieldType: 'text', prefillFrom: 'fmcsa.dba', optional: true },
            { id: 'address', label: 'Business address', fieldType: 'text', prefillFrom: 'fmcsa.address' },
            {
              id: 'interstate',
              label: 'Do you run interstate?',
              fieldType: 'select',
              options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No, intrastate only' }],
            },
          ],
        },
        {
          id: 'irp_question',
          type: 'input',
          title: 'IRP plates',
          subtitle: 'A quick interstate-specific question.',
          visibility: { op: 'eq', field: 'answers.business_confirm.interstate', value: 'yes' },
          questions: [
            {
              id: 'irp_plate',
              label: 'Do you have IRP (apportioned) plates?',
              fieldType: 'select',
              options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }],
            },
          ],
        },
        {
          id: 'signatory',
          type: 'input',
          title: 'Who will sign the dispatch agreement?',
          subtitle: 'This person needs authority to bind the business.',
          questions: [
            { id: 'name', label: 'Full legal name', fieldType: 'text', prefillFrom: 'fmcsa.officerName' },
            { id: 'title', label: 'Title', fieldType: 'text', placeholder: 'Owner, Director, Member, etc.' },
            { id: 'email', label: 'Email for the signature link', fieldType: 'text' },
          ],
        },
        {
          id: 'business_review',
          type: 'review',
          title: 'Quick review',
          subtitle: 'Make sure this is right before we generate your agreement.',
          summary: [
            { label: 'Business', from: ['business_confirm.legal_name', 'business_confirm.address'] },
            { label: 'Authority', from: ['mc_entry.mc_number'] },
            { label: 'Signatory', from: ['signatory.name', 'signatory.title'] },
          ],
        },
        {
          id: 'sign_agreement',
          type: 'signing',
          title: 'Sign your dispatch agreement',
          subtitle: "We've prefilled everything from what you've told us. Read through and sign below.",
          template: 'dispatch_v1',
          lockOnceCompleted: true,
          locksFields: ['business_confirm.legal_name', 'business_confirm.address', 'signatory.name', 'signatory.title', 'mc_entry.mc_number'],
        },
      ],
    },
    {
      id: 'operational',
      label: 'Operational Setup',
      checkpoint: {
        title: "You're cleared to roll.",
        body: 'Now let\'s set up how you get paid and what loads you want.',
        upcoming: ['Equipment & lanes', 'Banking', 'Insurance & W-9'],
      },
      steps: [
        {
          id: 'equipment',
          type: 'input',
          title: 'What are you running?',
          subtitle: "We'll use this to match you to loads worth your time.",
          questions: [
            { id: 'truck_count', label: 'How many power units?', fieldType: 'number', placeholder: '1' },
            {
              id: 'trailer_type',
              label: 'Primary trailer type',
              fieldType: 'select',
              options: [
                { value: 'dry_van', label: 'Dry van' },
                { value: 'reefer', label: 'Reefer' },
                { value: 'flatbed', label: 'Flatbed' },
                { value: 'step_deck', label: 'Step deck' },
                { value: 'tanker', label: 'Tanker' },
              ],
            },
          ],
          sideEffects: [{ type: 'eligibility_recalc' }],
        },
        {
          id: 'lane',
          type: 'input',
          title: 'Where do you run?',
          subtitle: 'Your home base helps us find loads that bring you back.',
          questions: [
            { id: 'home_lane_from', label: 'Home origin (city, state)', fieldType: 'text', placeholder: 'Queens, NY' },
            { id: 'home_lane_to', label: 'Primary destination region', fieldType: 'text', placeholder: 'Mid-Atlantic, Southeast, etc.' },
          ],
          sideEffects: [{ type: 'eligibility_recalc' }],
        },
        {
          id: 'banking',
          type: 'input',
          title: 'How should we pay you?',
          subtitle: "We use Stripe to handle ACH so your money is secure and fast.",
          questions: [
            { id: 'bank_name', label: 'Bank name', fieldType: 'text' },
            { id: 'account_holder', label: 'Account holder (must match legal business name)', fieldType: 'text' },
          ],
        },
        {
          id: 'documents',
          type: 'upload',
          title: 'Last step — your documents',
          subtitle: "Upload these and Isaiah will call you within 2 hours to walk through your first load.",
          documents: [
            { id: 'w9', label: 'W-9', helpText: 'For tax reporting on payouts.' },
            { id: 'coi', label: 'Certificate of Insurance', helpText: 'We need to verify your auto liability and cargo coverage.' },
          ],
        },
      ],
    },
    {
      id: 'complete',
      label: 'All Done',
      steps: [{ id: 'finish', type: 'complete' }],
    },
  ],
};

// ============================================================
// 2. ENGINE — pure functions over (session, command) -> result
// ============================================================
function resolveContext(session, dotPath) {
  // Resolves "answers.business_confirm.legal_name" against session context
  const [root, ...rest] = dotPath.split('.');
  const sources = {
    answers: session.answers,
    fmcsa: session.fmcsaSnapshot || {},
    invitation: session.invitation || {},
  };
  let cur = sources[root];
  for (const k of rest) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function evaluatePredicate(predicate, session) {
  if (!predicate) return true;
  const { op } = predicate;
  if (op === 'eq') return resolveContext(session, predicate.field) === predicate.value;
  if (op === 'in') return predicate.values.includes(resolveContext(session, predicate.field));
  if (op === 'and') return predicate.clauses.every(c => evaluatePredicate(c, session));
  if (op === 'or') return predicate.clauses.some(c => evaluatePredicate(c, session));
  if (op === 'not') return !evaluatePredicate(predicate.clause, session);
  return true;
}

function getOrderedSteps(schema) {
  return schema.phases.flatMap(p => p.steps.map(s => ({ ...s, phaseId: p.id, phaseLabel: p.label })));
}

function getVisibleSteps(schema, session) {
  return getOrderedSteps(schema).filter(s =>
    evaluatePredicate(schema.phases.find(p => p.id === s.phaseId).visibility, session)
    && evaluatePredicate(s.visibility, session)
  );
}

function getStep(schema, stepId) {
  return getOrderedSteps(schema).find(s => s.id === stepId);
}

function getPhase(schema, phaseId) {
  return schema.phases.find(p => p.id === phaseId);
}

function getNextStepId(schema, session, currentStepId) {
  const visible = getVisibleSteps(schema, session);
  const idx = visible.findIndex(s => s.id === currentStepId);
  if (idx < 0 || idx === visible.length - 1) return null;
  return visible[idx + 1].id;
}

function getPrevStepId(schema, session, currentStepId) {
  const visible = getVisibleSteps(schema, session);
  const idx = visible.findIndex(s => s.id === currentStepId);
  if (idx <= 0) return null;
  return visible[idx - 1].id;
}

function getProgress(session, visibleSteps) {
  if (visibleSteps.length === 0) return 0;
  return Math.round((session.completedSteps.length / visibleSteps.length) * 100);
}

// Compute which completed steps become invalid if `changedStepId` answers change
function computeInvalidations(schema, session, changedStepId, newAnswers) {
  const trialSession = {
    ...session,
    answers: { ...session.answers, [changedStepId]: { ...session.answers[changedStepId], ...newAnswers } },
  };
  const visibleNow = new Set(getVisibleSteps(schema, trialSession).map(s => s.id));
  const invalidated = [];
  for (const completedId of session.completedSteps) {
    if (completedId === changedStepId) continue;
    // Step disappears because predicate flipped
    if (!visibleNow.has(completedId)) invalidated.push(completedId);
  }
  // Special: if mc_entry changed, anything that prefilled from fmcsa is stale
  if (changedStepId === 'mc_entry' && session.fmcsaSnapshot) {
    if (session.completedSteps.includes('business_confirm') && !invalidated.includes('business_confirm')) {
      invalidated.push('business_confirm');
    }
  }
  return invalidated;
}

// Mock FMCSA response for the demo
const MOCK_FMCSA = {
  legalName: 'HUSTLE TRANSPORTATION INC',
  dba: 'Hustle Trans',
  address: '123 Northern Blvd, Queens, NY 11354',
  dotNumber: '3456789',
  fleetSize: 4,
  safetyRating: 'Satisfactory',
  authorityStatus: 'Active',
  officerName: 'Omar Rivera',
};

// Eligibility recalc based on equipment + lane
function computeEligibility(answers) {
  if (!answers.equipment?.trailer_type) return null;
  const base = { dry_van: 38, reefer: 52, flatbed: 41, step_deck: 24, tanker: 18 }[answers.equipment.trailer_type] || 0;
  const hasLane = !!(answers.lane?.home_lane_from && answers.lane?.home_lane_to);
  const trucks = parseInt(answers.equipment.truck_count) || 1;
  const loadCount = hasLane ? Math.round(base * (1 + 0.15 * Math.min(trucks, 5))) : Math.round(base * 0.4);
  const ratePerLoad = { dry_van: 1650, reefer: 2100, flatbed: 2300, step_deck: 2800, tanker: 3200 }[answers.equipment.trailer_type] || 1500;
  const weekly = { min: ratePerLoad * 2 * trucks, max: ratePerLoad * 4 * trucks };
  return { loadCount, weekly, hasLane };
}

// ============================================================
// 3. INITIAL STATE & SCENARIOS
// ============================================================
function makeInitialSession() {
  return {
    currentStepId: 'segmentation',
    completedSteps: [],
    answers: {},
    agreement: { status: 'NotStarted' }, // NotStarted | Generating | ReadyToSign | Signing | Signed
    fmcsaSnapshot: null,
    eligibility: null,
    invalidatedSteps: [],
    eventLog: [{ at: Date.now(), type: 'session.started', payload: {} }],
    invitation: { invitedEmail: 'driver@example.com', invitedBy: 'isaiah@fleetcommand.io' },
  };
}

// ============================================================
// 4. UI: STEP RENDERERS
// ============================================================

function StepShell({ phaseLabel, title, subtitle, children, locked }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-8 pt-8 pb-6 border-b border-slate-100">
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">{phaseLabel}</div>
        <h2 className="text-2xl font-semibold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-2 text-[15px] leading-relaxed">{subtitle}</p>}
        {locked && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
            <Lock className="w-4 h-4" />
            <span>This step is locked because your agreement is signed.</span>
          </div>
        )}
      </div>
      <div className="px-8 py-7">{children}</div>
    </div>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
    />
  );
}

function SelectInput({ value, onChange, options, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-3 rounded-lg border text-left text-sm font-medium transition ${
            value === opt.value
              ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CardSelect({ value, onChange, options }) {
  return (
    <div className="space-y-2.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full p-4 rounded-lg border-2 text-left transition ${
            value === opt.value
              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="font-semibold text-slate-900 text-[15px]">{opt.label}</div>
          {opt.sub && <div className="text-slate-500 text-sm mt-0.5">{opt.sub}</div>}
        </button>
      ))}
    </div>
  );
}

function InputStepRenderer({ step, session, onSubmit, lockedFields }) {
  // Lazy init from existing answers; component remounts on step change via `key` in parent
  const [draft, setDraft] = useState(() => session.answers[step.id] || {});

  // Apply prefill from context (e.g., when FMCSA snapshot arrives) for empty fields
  useEffect(() => {
    setDraft(d => {
      const next = { ...d };
      let changed = false;
      for (const q of step.questions || []) {
        if (q.prefillFrom && (next[q.id] == null || next[q.id] === '')) {
          const val = resolveContext(session, q.prefillFrom);
          if (val != null) { next[q.id] = val; changed = true; }
        }
      }
      return changed ? next : d;
    });
    // eslint-disable-next-line
  }, [session.fmcsaSnapshot]);

  const visibleQuestions = (step.questions || []).filter(q => evaluatePredicate(q.visibility, session));
  const update = (qid, v) => setDraft(d => ({ ...d, [qid]: v }));
  const canSubmit = visibleQuestions.every(q => q.optional || (draft[q.id] != null && draft[q.id] !== ''));
  const stepHasLockedFields = visibleQuestions.some(q => lockedFields?.has(`${step.id}.${q.id}`));

  return (
    <StepShell phaseLabel={step.phaseLabel} title={step.title} subtitle={step.subtitle} locked={stepHasLockedFields}>
      <div className="space-y-6">
        {visibleQuestions.map(q => {
          const fieldKey = `${step.id}.${q.id}`;
          const isLocked = lockedFields?.has(fieldKey);
          return (
            <div key={q.id}>
              <FieldLabel optional={q.optional}>{q.label}</FieldLabel>
              {q.fieldType === 'cards' && <CardSelect value={draft[q.id]} onChange={v => update(q.id, v)} options={q.options} />}
              {q.fieldType === 'select' && <SelectInput value={draft[q.id]} onChange={v => update(q.id, v)} options={q.options} disabled={isLocked} />}
              {(q.fieldType === 'text' || q.fieldType === 'mc' || q.fieldType === 'number') && (
                <TextInput value={draft[q.id]} onChange={v => update(q.id, v)} placeholder={q.placeholder} disabled={isLocked} />
              )}
              {q.helpText && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{q.helpText}</span>
                </div>
              )}
              {isLocked && <div className="mt-1 text-xs text-amber-700">Locked — contact dispatcher to change.</div>}
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onSubmit(draft)}
          disabled={!canSubmit}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 transition flex items-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepShell>
  );
}

function SegmentationStepRenderer({ step, session, onSubmit }) {
  // Reuse InputStepRenderer for simplicity
  return <InputStepRenderer step={step} session={session} onSubmit={onSubmit} />;
}

function VerificationStepRenderer({ step }) {
  return (
    <StepShell phaseLabel={step.phaseLabel} title={step.title} subtitle={step.subtitle}>
      <div className="flex items-center gap-4 py-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <div>
          <div className="font-medium text-slate-900">Checking FMCSA records...</div>
          <div className="text-sm text-slate-500 mt-0.5">Use the dev panel to simulate the response.</div>
        </div>
      </div>
    </StepShell>
  );
}

function ReviewStepRenderer({ step, session, onSubmit }) {
  const summary = step.summary || [];
  return (
    <StepShell phaseLabel={step.phaseLabel} title={step.title} subtitle={step.subtitle}>
      <div className="space-y-4">
        {summary.map(s => (
          <div key={s.label} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{s.label}</div>
            {s.from.map(path => {
              const [stepId, qId] = path.split('.');
              const val = session.answers[stepId]?.[qId];
              return val ? <div key={path} className="text-slate-900 text-[15px]">{val}</div> : null;
            })}
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onSubmit({})}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          Looks good — generate agreement <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepShell>
  );
}

function SigningStepRenderer({ step, session, onSubmit, onStartSigning, onCompleteSigning }) {
  const { status } = session.agreement;
  return (
    <StepShell phaseLabel={step.phaseLabel} title={step.title} subtitle={step.subtitle}>
      {status === 'NotStarted' && (
        <div className="flex items-center gap-4 py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <div className="font-medium text-slate-900">Preparing your agreement...</div>
            <div className="text-sm text-slate-500 mt-0.5">Generating PDF from your business details.</div>
          </div>
        </div>
      )}
      {status === 'Generating' && (
        <div className="flex items-center gap-4 py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <div className="font-medium text-slate-900">Uploading to signing service...</div>
            <div className="text-sm text-slate-500 mt-0.5">Use the dev panel to simulate the embedUrl arriving.</div>
          </div>
        </div>
      )}
      {status === 'ReadyToSign' && (
        <div>
          <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">FleetCommand Dispatch Agreement</span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">DocuSeal Embedded</span>
              </div>
              <span className="text-xs text-slate-400">v1.dispatch_v1</span>
            </div>
            <div className="p-6 text-sm text-slate-700 space-y-3 max-h-72 overflow-y-auto">
              <div className="font-semibold text-base text-slate-900">DISPATCH SERVICES AGREEMENT</div>
              <p>This Agreement is entered into between <span className="font-semibold">FleetCommand LLC</span> ("Dispatcher") and <span className="font-semibold">{session.answers.business_confirm?.legal_name || '[CARRIER NAME]'}</span> ("Carrier"), holder of MC# <span className="font-semibold">{session.answers.mc_entry?.mc_number || '[MC#]'}</span>.</p>
              <p>Dispatcher will provide load-finding, rate negotiation, and dispatching services. Carrier agrees to a service fee of <span className="font-semibold">7%</span> of gross revenue per dispatched load.</p>
              <p>Signed by <span className="font-semibold">{session.answers.signatory?.name || '[SIGNATORY]'}</span>, {session.answers.signatory?.title || '[TITLE]'}, on behalf of the Carrier.</p>
              <p className="text-slate-500 italic">[...remainder of agreement omitted in prototype...]</p>
            </div>
            <div className="bg-white border-t border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">Click below to provide your signature.</div>
              <button
                onClick={onStartSigning}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" /> Sign now
              </button>
            </div>
          </div>
        </div>
      )}
      {status === 'Signing' && (
        <div className="flex items-center gap-4 py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <div className="font-medium text-slate-900">Finalizing your agreement...</div>
            <div className="text-sm text-slate-500 mt-0.5">Waiting for the signing webhook from DocuSeal.</div>
          </div>
        </div>
      )}
      {status === 'Signed' && (
        <div>
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="font-medium text-emerald-900">Agreement signed</div>
              <div className="text-sm text-emerald-700">Saved to S3 with the audit certificate. Steps that fed the agreement are now locked.</div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onSubmit({})}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </StepShell>
  );
}

function UploadStepRenderer({ step, session, onSubmit }) {
  const [uploaded, setUploaded] = useState(session.answers[step.id] || {});
  const allDone = step.documents.every(d => uploaded[d.id]);

  return (
    <StepShell phaseLabel={step.phaseLabel} title={step.title} subtitle={step.subtitle}>
      <div className="space-y-3">
        {step.documents.map(d => (
          <div key={d.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <div className="font-medium text-slate-900">{d.label}</div>
              <div className="text-sm text-slate-500 mt-0.5">{d.helpText}</div>
            </div>
            {uploaded[d.id] ? (
              <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Uploaded
              </span>
            ) : (
              <button
                onClick={() => setUploaded(u => ({ ...u, [d.id]: { filename: 'doc.pdf', uploadedAt: Date.now() } }))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onSubmit(uploaded)}
          disabled={!allDone}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 transition flex items-center gap-2"
        >
          Finish onboarding <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepShell>
  );
}

function CheckpointStepRenderer({ phase, onAck }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 mb-5">
        <Sparkles className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{phase.checkpoint.title}</h2>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">{phase.checkpoint.body}</p>
      {phase.checkpoint.upcoming && (
        <div className="max-w-sm mx-auto text-left bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Here's what's coming up</div>
          <ul className="space-y-1.5">
            {phase.checkpoint.upcoming.map((u, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {u}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={onAck}
        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
      >
        Let's go <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function CompleteStepRenderer({ session }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-5">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">You're cleared to roll.</h2>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        Isaiah will call you within the next 2 hours to walk through your first load. In the meantime, you can already see what's available in your home lane.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm font-medium">
        <Zap className="w-4 h-4" /> {session.eligibility?.loadCount || 0} loads matching your profile right now
      </div>
    </div>
  );
}

// ============================================================
// 5. ELIGIBILITY SIDEBAR (the "tax refund" component)
// ============================================================
function EligibilitySidebar({ session, visibleSteps }) {
  const progress = getProgress(session, visibleSteps);
  const elig = session.eligibility;

  return (
    <aside className="w-80 flex-shrink-0 space-y-4">
      {/* Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your progress</div>
          <div className="text-sm font-semibold text-slate-900">{progress}%</div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 text-xs text-slate-500">{session.completedSteps.length} of {visibleSteps.length} steps complete</div>
      </div>

      {/* Eligibility */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-600" />
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your match potential</div>
        </div>
        {!elig ? (
          <div className="py-4 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm text-slate-500">Tell us about your equipment to see live load matches.</div>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{elig.loadCount}</div>
            <div className="text-sm text-slate-600 mb-4">{elig.hasLane ? 'loads in your home lane' : 'loads nationally for your equipment'}</div>
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Estimated weekly revenue</div>
              <div className="text-lg font-semibold text-emerald-700">
                ${elig.weekly.min.toLocaleString()}–${elig.weekly.max.toLocaleString()}
              </div>
            </div>
            {!elig.hasLane && (
              <div className="mt-3 px-2.5 py-2 bg-blue-50 rounded text-xs text-blue-900">
                <strong>Tip:</strong> add your home lane to unlock 2–3× more matches.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <User className="w-4 h-4 text-slate-600" />
          <div className="text-sm font-semibold text-slate-900">Need a hand?</div>
        </div>
        <div className="text-sm text-slate-600">Text Isaiah at (718) 555-0142 — he'll walk you through anything.</div>
      </div>
    </aside>
  );
}

// ============================================================
// 6. DEV PANEL — simulate external events, change scenarios
// ============================================================
function DevPanel({ session, schema, onAction, expanded, setExpanded }) {
  const currentStep = getStep(schema, session.currentStepId);
  const visibleSteps = getVisibleSteps(schema, session);
  const currentIdx = visibleSteps.findIndex(s => s.id === session.currentStepId);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-100 border-t border-slate-700 shadow-2xl z-40">
      <div className="px-6 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Settings2 className="w-4 h-4 text-amber-400" />
          <div className="text-sm font-semibold">Dev Panel</div>
          <div className="text-xs text-slate-400">
            Step <span className="text-slate-200">{currentStep?.id}</span> · {currentIdx + 1}/{visibleSteps.length} ·
            Agreement: <span className="text-slate-200">{session.agreement.status}</span>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </div>
      {expanded && (
        <div className="px-6 pb-5 grid grid-cols-3 gap-6 border-t border-slate-800 pt-4">
          {/* Simulate external events */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Simulate external events</div>
            <div className="space-y-1.5">
              <DevButton
                disabled={currentStep?.type !== 'verification'}
                onClick={() => onAction({ type: 'external', event: 'fmcsa.completed', payload: MOCK_FMCSA })}
                label="FMCSA returned"
                icon={ShieldCheck}
              />
              <DevButton
                disabled={session.agreement.status !== 'Generating'}
                onClick={() => onAction({ type: 'external', event: 'agreement.generated', payload: { embedUrl: 'https://docuseal.com/d/MOCK123' } })}
                label="Agreement generated (embedUrl ready)"
                icon={FileText}
              />
              <DevButton
                disabled={session.agreement.status !== 'Signing'}
                onClick={() => onAction({ type: 'external', event: 'agreement.signed', payload: { signedPdfS3Key: 'orgs/.../agreements/123.pdf' } })}
                label="DocuSeal webhook: signed"
                icon={CheckCircle2}
              />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Test edge cases</div>
            <div className="space-y-1.5">
              <DevButton
                disabled={!session.completedSteps.includes('mc_entry')}
                onClick={() => onAction({ type: 'goto', stepId: 'mc_entry' })}
                label="Back to MC entry (test invalidation)"
                icon={ArrowLeft}
              />
              <DevButton
                disabled={session.agreement.status !== 'Signed' || !session.completedSteps.includes('business_confirm')}
                onClick={() => onAction({ type: 'goto', stepId: 'business_confirm' })}
                label="Back to business info (test lock)"
                icon={Lock}
              />
              <DevButton
                onClick={() => onAction({ type: 'reset' })}
                label="Reset session"
                icon={RotateCcw}
              />
            </div>
          </div>

          {/* Event log */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Event log</div>
            <div className="bg-slate-950 rounded p-2 max-h-32 overflow-y-auto text-xs font-mono space-y-0.5">
              {session.eventLog.slice(-10).reverse().map((e, i) => (
                <div key={i} className="text-slate-400">
                  <span className="text-emerald-400">{e.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DevButton({ onClick, label, icon: Icon, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-left flex items-center gap-2 transition"
    >
      <Icon className="w-3.5 h-3.5 text-amber-400" />
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// 7. INVALIDATION WARNING MODAL
// ============================================================
function InvalidationModal({ invalidatedSteps, onConfirm, onCancel, isLockViolation }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLockViolation ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            {isLockViolation ? <Lock className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              {isLockViolation ? "Can't change this" : 'Heads up'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {isLockViolation ? (
                <>This information was used to generate your signed agreement and can't be edited. To change it, contact your dispatcher to void the current agreement.</>
              ) : (
                <>Changing this will reset answers for these steps you've already completed:</>
              )}
            </p>
            {!isLockViolation && (
              <ul className="mt-3 space-y-1">
                {invalidatedSteps.map(s => (
                  <li key={s} className="text-sm text-slate-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">
            {isLockViolation ? 'Got it' : 'Cancel'}
          </button>
          {!isLockViolation && (
            <button onClick={onConfirm} className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700">
              Reset and continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 8. MAIN APP
// ============================================================
export default function CarrierOnboardingPrototype() {
  const [session, setSession] = useState(makeInitialSession);
  const [devExpanded, setDevExpanded] = useState(true);
  const [pendingInvalidation, setPendingInvalidation] = useState(null);
  const [acknowledgedCheckpoints, setAcknowledgedCheckpoints] = useState(new Set());

  const visibleSteps = useMemo(() => getVisibleSteps(SCHEMA, session), [session]);
  const currentStep = useMemo(() => getStep(SCHEMA, session.currentStepId), [session.currentStepId]);
  const currentPhase = useMemo(() => currentStep && getPhase(SCHEMA, currentStep.phaseId), [currentStep]);

  // Are we entering a new phase? Show checkpoint first.
  const showCheckpoint = currentPhase?.checkpoint
    && !acknowledgedCheckpoints.has(currentPhase.id)
    && currentPhase.steps[0]?.id === currentStep.id;

  // Lock awareness — fields locked once the agreement is signed
  const lockedFields = useMemo(() => {
    if (session.agreement.status !== 'Signed') return new Set();
    const signStep = getStep(SCHEMA, 'sign_agreement');
    return new Set(signStep?.locksFields || []);
  }, [session.agreement.status]);

  // Recompute eligibility whenever equipment/lane changes
  useEffect(() => {
    const elig = computeEligibility(session.answers);
    if (JSON.stringify(elig) !== JSON.stringify(session.eligibility)) {
      setSession(s => ({ ...s, eligibility: elig }));
    }
    // eslint-disable-next-line
  }, [session.answers.equipment, session.answers.lane]);

  // Side effect: when entering signing step, kick off generation
  useEffect(() => {
    if (currentStep?.type === 'signing' && session.agreement.status === 'NotStarted') {
      setSession(s => ({
        ...s,
        agreement: { status: 'Generating' },
        eventLog: [...s.eventLog, { at: Date.now(), type: 'agreement.generation_requested' }],
      }));
    }
  }, [currentStep, session.agreement.status]);

  function submitStep(stepId, answers) {
    setSession(s => {
      const invalidated = computeInvalidations(SCHEMA, s, stepId, answers);

      let nextAnswers = { ...s.answers, [stepId]: { ...s.answers[stepId], ...answers } };
      let nextCompleted = s.completedSteps.includes(stepId)
        ? s.completedSteps.filter(id => !invalidated.includes(id))
        : [...s.completedSteps.filter(id => !invalidated.includes(id)), stepId];

      // Reset answers for invalidated steps
      const cleanedAnswers = { ...nextAnswers };
      for (const inv of invalidated) delete cleanedAnswers[inv];

      // Determine next step (recompute visibility against new answers)
      const trialSession = { ...s, answers: cleanedAnswers, completedSteps: nextCompleted };
      const nextId = getNextStepId(SCHEMA, trialSession, stepId);

      const events = [
        ...s.eventLog,
        { at: Date.now(), type: 'step.completed', payload: { stepId } },
      ];

      // Fire side effects
      const step = getStep(SCHEMA, stepId);
      for (const se of step?.sideEffects || []) {
        events.push({ at: Date.now(), type: `sideEffect.${se.type}` });
      }

      return {
        ...s,
        answers: cleanedAnswers,
        completedSteps: nextCompleted,
        currentStepId: nextId || s.currentStepId,
        eventLog: events,
      };
    });
  }

  function handleAction(action) {
    if (action.type === 'external') {
      if (action.event === 'fmcsa.completed') {
        setSession(s => ({
          ...s,
          fmcsaSnapshot: action.payload,
          completedSteps: [...new Set([...s.completedSteps, 'fmcsa_verification'])],
          currentStepId: getNextStepId(SCHEMA, s, 'fmcsa_verification') || s.currentStepId,
          eventLog: [...s.eventLog, { at: Date.now(), type: 'fmcsa.completed' }],
        }));
      } else if (action.event === 'agreement.generated') {
        setSession(s => ({
          ...s,
          agreement: { status: 'ReadyToSign', embedUrl: action.payload.embedUrl },
          eventLog: [...s.eventLog, { at: Date.now(), type: 'agreement.generated' }],
        }));
      } else if (action.event === 'agreement.signed') {
        setSession(s => ({
          ...s,
          agreement: { ...s.agreement, status: 'Signed', signedPdfS3Key: action.payload.signedPdfS3Key },
          completedSteps: [...new Set([...s.completedSteps, 'sign_agreement'])],
          eventLog: [...s.eventLog, { at: Date.now(), type: 'agreement.signed' }],
        }));
      }
    } else if (action.type === 'goto') {
      const targetStep = getStep(SCHEMA, action.stepId);
      const signStep = getStep(SCHEMA, 'sign_agreement');
      const locks = new Set(signStep?.locksFields || []);

      // If every visible question in the target step is locked, navigation is allowed
      // but no edits will be possible — skip the invalidation modal since changes can't happen.
      const visibleQs = (targetStep?.questions || []).filter(q => evaluatePredicate(q.visibility, session));
      const allLocked = session.agreement.status === 'Signed'
        && visibleQs.length > 0
        && visibleQs.every(q => locks.has(`${action.stepId}.${q.id}`));

      if (allLocked) {
        setSession(s => ({
          ...s,
          currentStepId: action.stepId,
          eventLog: [...s.eventLog, { at: Date.now(), type: 'navigation.locked_step_viewed', payload: { stepId: action.stepId } }],
        }));
        return;
      }

      // Compute what would be invalidated if user changes anything in this step
      const idx = visibleSteps.findIndex(s => s.id === action.stepId);
      const downstreamCompleted = session.completedSteps.filter(cid => {
        const cidx = visibleSteps.findIndex(s => s.id === cid);
        return cidx > idx;
      });

      if (downstreamCompleted.length > 0) {
        setPendingInvalidation({ stepId: action.stepId, invalidatedSteps: downstreamCompleted });
      } else {
        setSession(s => ({ ...s, currentStepId: action.stepId }));
      }
    } else if (action.type === 'reset') {
      setSession(makeInitialSession());
      setAcknowledgedCheckpoints(new Set());
    }
  }

  function confirmInvalidation() {
    const { stepId, invalidatedSteps } = pendingInvalidation;
    setSession(s => {
      const cleaned = { ...s.answers };
      for (const inv of invalidatedSteps) delete cleaned[inv];
      return {
        ...s,
        answers: cleaned,
        completedSteps: s.completedSteps.filter(id => !invalidatedSteps.includes(id) && id !== stepId),
        currentStepId: stepId,
        eventLog: [...s.eventLog, { at: Date.now(), type: 'steps.invalidated', payload: { invalidatedSteps } }],
      };
    });
    setPendingInvalidation(null);
  }

  function startSigning() {
    setSession(s => ({
      ...s,
      agreement: { ...s.agreement, status: 'Signing' },
      eventLog: [...s.eventLog, { at: Date.now(), type: 'agreement.signing_started' }],
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-[15px] leading-tight">FleetCommand</div>
              <div className="text-xs text-slate-500 leading-tight">Carrier onboarding</div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Invited by <span className="text-slate-700 font-medium">isaiah@fleetcommand.io</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        <div className="flex-1 min-w-0" key={currentStep?.id}>
          {showCheckpoint ? (
            <CheckpointStepRenderer
              phase={currentPhase}
              onAck={() => setAcknowledgedCheckpoints(s => new Set([...s, currentPhase.id]))}
            />
          ) : currentStep?.type === 'segmentation' ? (
            <SegmentationStepRenderer step={currentStep} session={session} onSubmit={a => submitStep(currentStep.id, a)} />
          ) : currentStep?.type === 'input' ? (
            <InputStepRenderer
              step={currentStep}
              session={session}
              onSubmit={a => submitStep(currentStep.id, a)}
              lockedFields={lockedFields}
            />
          ) : currentStep?.type === 'verification' ? (
            <VerificationStepRenderer step={currentStep} />
          ) : currentStep?.type === 'review' ? (
            <ReviewStepRenderer step={currentStep} session={session} onSubmit={a => submitStep(currentStep.id, a)} />
          ) : currentStep?.type === 'signing' ? (
            <SigningStepRenderer
              step={currentStep}
              session={session}
              onSubmit={a => submitStep(currentStep.id, a)}
              onStartSigning={startSigning}
            />
          ) : currentStep?.type === 'upload' ? (
            <UploadStepRenderer step={currentStep} session={session} onSubmit={a => submitStep(currentStep.id, a)} />
          ) : currentStep?.type === 'complete' ? (
            <CompleteStepRenderer session={session} />
          ) : null}
        </div>

        <EligibilitySidebar session={session} visibleSteps={visibleSteps} />
      </main>

      {/* Dev Panel */}
      <DevPanel
        session={session}
        schema={SCHEMA}
        onAction={handleAction}
        expanded={devExpanded}
        setExpanded={setDevExpanded}
      />

      {pendingInvalidation && (
        <InvalidationModal
          invalidatedSteps={pendingInvalidation.invalidatedSteps || []}
          isLockViolation={pendingInvalidation.isLockViolation}
          onConfirm={confirmInvalidation}
          onCancel={() => setPendingInvalidation(null)}
        />
      )}
    </div>
  );
}
