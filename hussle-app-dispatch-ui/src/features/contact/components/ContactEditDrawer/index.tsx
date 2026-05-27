import React from 'react';
import { useSelector } from 'store';
import { selectContactById } from '../../store/selectors/contactSelectors';
import { ContactInfoDrawer } from '../ContactInfoDrawer';

interface ContactEditDrawerProps {
  contactId: string;
  onClose: () => void;
}

/**
 * Drawer wrapper that reads contact data from Redux store by ID.
 * Registered as the 'contactInfo' drawer type.
 */
export const ContactEditDrawer: React.FC<ContactEditDrawerProps> = ({ contactId, onClose }) => {
  const contactSelector = React.useMemo(() => selectContactById(contactId), [contactId]);
  const contact = useSelector(contactSelector);

  return <ContactInfoDrawer contact={contact} onClose={onClose} />;
};
