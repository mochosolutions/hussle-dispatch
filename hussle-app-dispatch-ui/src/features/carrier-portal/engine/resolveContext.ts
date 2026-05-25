import type { Session } from './types';

// Resolves a dot-path against the session's named context sources.
//
// Supported roots: 'answers', 'fmcsa', 'invitation', 'agreements', 'session',
// 'company'. Unknown root → undefined. Missing intermediate key → undefined.
// Never throws.
//
//   resolveContext(session, 'answers.company.legalName')
//   resolveContext(session, 'fmcsa.legalName')
//   resolveContext(session, 'invitation.organizationName')
//   resolveContext(session, 'agreements.DISPATCH_AGREEMENT.status')
//   resolveContext(session, 'company.legalName')

const CONTEXT_ROOTS = [
  'answers',
  'fmcsa',
  'invitation',
  'agreements',
  'session',
  'company',
  'vehicles',
  'drivers',
  'costAnalysis',
  'lanePreferences',
] as const;
type ContextRoot = (typeof CONTEXT_ROOTS)[number];

const isContextRoot = (value: string): value is ContextRoot =>
  (CONTEXT_ROOTS as readonly string[]).includes(value);

const pickRoot = (session: Session, root: ContextRoot): unknown => {
  switch (root) {
    case 'answers':
      return session.answers;
    case 'fmcsa':
      return session.fmcsaSnapshot ?? {};
    case 'invitation':
      return session.invitation;
    case 'agreements':
      return session.agreements ?? {};
    case 'session':
      return session;
    case 'company':
      return session.company ?? {};
    case 'vehicles':
      return session.vehicles ?? [];
    case 'drivers':
      return session.drivers ?? [];
    case 'costAnalysis':
      return session.costAnalysis ?? {};
    case 'lanePreferences':
      return session.lanePreferences ?? {};
    default: {
      // Exhaustiveness — `root` is narrowed to never if we covered every case.
      const exhaust: never = root;
      throw new Error(`Unhandled context root: ${String(exhaust)}`);
    }
  }
};

const isIndexable = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const resolveContext = (session: Session, dotPath: string): unknown => {
  if (typeof dotPath !== 'string' || dotPath.length === 0) {
    return undefined;
  }
  const segments = dotPath.split('.');
  const [root, ...rest] = segments;
  if (root === undefined || !isContextRoot(root)) {
    return undefined;
  }
  let current: unknown = pickRoot(session, root);
  for (const key of rest) {
    if (!isIndexable(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};
