export const obfuscateEmail = (email: string): string => {
  console.log('email', email);
  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) {
    return '';
  }
  const obfuscatedLocalPart = localPart[0] + '*'.repeat(localPart.length - 1);
  return `${obfuscatedLocalPart}@${domainPart}`;
};
