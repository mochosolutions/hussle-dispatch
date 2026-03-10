import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Stack,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  MenuItem,
} from '@mui/material';
import type { ICellRendererParams } from 'ag-grid-community';
import { MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { Contact, ContactType } from '../../types';
import { fetchContactsRequest } from '../../store/reducers/contactPageSlice';
import {
  selectAllContacts,
  selectContactListLoading,
} from '../../store/selectors/contactSelectors';
import { CONTACT_TYPE_LABELS, CONTACT_TYPE_COLORS } from '../../constants';
import { ContactInfoDrawer } from '../../components/ContactInfoDrawer';

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'SHIPPER', label: 'Shipper' },
  { value: 'CONSIGNEE', label: 'Consignee' },
  { value: 'FACTORING', label: 'Factoring' },
];

type ContactTab = 'all' | 'BROKER' | 'SHIPPER' | 'CONSIGNEE' | 'FACTORING';

const ContactTypeBadge = (params: ICellRendererParams<Contact>) => {
  const contactType = params.value as ContactType | undefined;
  if (!contactType) {
    return null;
  }
  return (
    <Chip
      label={CONTACT_TYPE_LABELS[contactType]}
      color={CONTACT_TYPE_COLORS[contactType] as 'primary' | 'success' | 'warning' | 'info'}
      size="small"
      variant="outlined"
    />
  );
};

const ContactLocationRenderer = (params: ICellRendererParams<Contact>) => {
  const { city, state } = params.data ?? {};
  if (!city && !state) {
    return '';
  }
  return [city, state].filter(Boolean).join(', ');
};

const ContactListPage = () => {
  const [activeTab, setActiveTab] = useState<ContactTab>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const dispatch = useDispatch();

  const contacts = useSelector(selectAllContacts);
  const isLoading = useSelector(selectContactListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchContactsRequest({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        dispatch(
          fetchContactsRequest({
            page: 1,
            limit: 25,
            search: query,
            type: typeFilter === 'all' ? undefined : typeFilter,
          }),
        );
      }, 300);
    },
    [dispatch, typeFilter],
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, value: ContactTab) => {
      setActiveTab(value);
      const type = value === 'all' ? undefined : value;
      setTypeFilter(value);
      dispatch(
        fetchContactsRequest({
          page: 1,
          limit: 25,
          search: searchQuery,
          type,
        }),
      );
    },
    [dispatch, searchQuery],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingContact(undefined);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setEditingContact(undefined);
  }, []);

  const filteredContacts = useMemo(() => {
    if (activeTab === 'all') {
      return contacts;
    }
    return contacts.filter((c) => c.type === activeTab);
  }, [contacts, activeTab]);

  const tabOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: contacts.length },
      {
        key: 'BROKER' as const,
        label: 'Brokers',
        count: contacts.filter((c) => c.type === 'BROKER').length,
      },
      {
        key: 'SHIPPER' as const,
        label: 'Shippers',
        count: contacts.filter((c) => c.type === 'SHIPPER').length,
      },
      {
        key: 'CONSIGNEE' as const,
        label: 'Consignees',
        count: contacts.filter((c) => c.type === 'CONSIGNEE').length,
      },
      {
        key: 'FACTORING' as const,
        label: 'Factoring',
        count: contacts.filter((c) => c.type === 'FACTORING').length,
      },
    ],
    [contacts],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Company',
        field: 'companyName' as const,
        minWidth: 180,
        flex: 1.5,
      },
      {
        headerName: 'Type',
        field: 'type' as const,
        minWidth: 120,
        cellRenderer: ContactTypeBadge,
      },
      {
        headerName: 'Contact',
        field: 'contactName' as const,
        minWidth: 140,
        flex: 1,
      },
      {
        headerName: 'Phone',
        field: 'phone' as const,
        minWidth: 130,
      },
      {
        headerName: 'Email',
        field: 'email' as const,
        minWidth: 180,
        flex: 1,
      },
      {
        headerName: 'Payment Terms',
        field: 'paymentTerms' as const,
        minWidth: 130,
      },
      {
        headerName: 'Location',
        field: 'city' as const,
        minWidth: 140,
        cellRenderer: ContactLocationRenderer,
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  return (
    <PageWrapper isLoading={false} errorContext="ContactListPage" sx={{ gap: 2 }}>
      <PageHeader
        title="Contacts"
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Contact
            </Button>
          </Stack>
        }
      />

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ minHeight: 40 }}
          >
            {tabOptions.map((tabOption) => (
              <Tab
                key={tabOption.key}
                value={tabOption.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2">{tabOption.label}</Typography>
                    <Chip label={tabOption.count} size="small" />
                  </Stack>
                }
                sx={{ minHeight: 40 }}
              />
            ))}
          </Tabs>
          <Box>
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by company, contact name..."
              size="small"
              sx={{ width: { xs: '100%', lg: 320 } }}
            />
          </Box>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Box
            sx={{
              minHeight: { xs: 300, md: 420 },
              flex: 1,
            }}
          >
            <NewDataGrid
              columnDefs={columnDefs}
              rowData={filteredContacts}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={filteredContacts.length}
              rowCountLabel="contacts"
              noDataMessage="No contacts found"
              gridOptions={{
                domLayout: 'normal',
                pagination: false,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 52,
                onRowClicked: (event) => {
                  if (event.data) {
                    handleOpenEdit(event.data as Contact);
                  }
                },
              }}
              loading={isLoading}
            />
          </Box>
        </Box>
      </MainCard>

      {drawerOpen && (
        <ContactInfoDrawer contact={editingContact} onClose={handleDrawerClose} />
      )}
    </PageWrapper>
  );
};

export default ContactListPage;
