// Contact constants — simplified after schema refactor (no more ContactType enum)

export const CONTACT_DETAIL_TABS: readonly { value: string; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'loads', label: 'Loads' },
  { value: 'notes', label: 'Notes' },
];
