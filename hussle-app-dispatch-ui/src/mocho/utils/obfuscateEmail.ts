export const obfuscateEmail = (email: string): string => {
  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) {
    return '';
  }
  const obfuscatedLocalPart = localPart[0] + '*'.repeat(localPart.length - 1);
  return `${obfuscatedLocalPart}@${domainPart}`;
};
