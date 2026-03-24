import { useSelector } from 'store';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { CustomerInfoDrawer } from '../CustomerInfoDrawer';

interface CustomerCompanyInfoDrawerProps {
  customerId: string;
  onClose: () => void;
}

export const CustomerCompanyInfoDrawer: React.FC<CustomerCompanyInfoDrawerProps> = ({
  customerId,
  onClose,
}) => {
  const customer = useSelector(selectCustomerById(customerId));

  if (!customer) {
    return null;
  }

  return <CustomerInfoDrawer customer={customer} onClose={onClose} />;
};
