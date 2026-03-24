import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Stack,
  TextField,
  Box,
  Button,
  Grid,
  Select,
  MenuItem,
  OutlinedInput,
  InputLabel,
  Chip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { MainCard, NewDataGrid, PageWrapper } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { KpiCell } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import type { Contact } from '../../types';
import { fetchContactsRequest } from '../../store/reducers/contactPageSlice';
import {
  selectContactListLoading,
  selectAllContacts,
} from '../../store/selectors/contactSelectors';
import { ContactInfoDrawer } from '../../components/ContactInfoDrawer';

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0) ?? '';
  const last = lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
};

const capitalize = (s: string | null): string => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ContactNameCellRenderer = (params: { data?: Contact }) => {
  const c = params.data;
  if (!c) return null;
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ');
  const initials = getInitials(c.firstName, c.lastName);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {fullName}
        </Typography>
      </Box>
    </Box>
  );
};

const RoleCellRenderer = (params: { value?: string | null }) => {
  if (!params.value) return null;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'grey.100',
        color: 'text.secondary',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'capitalize',
      }}
    >
      {params.value}
    </Box>
  );
};

interface ContactWithCustomer extends Contact {
  customer?: { companyName?: string } | null;
}

const PhoneCellRenderer = (params: { value?: string | null }) => {
  const theme = useTheme();
  if (!params.value) return null;
  return (
    <a
      href={`tel:${params.value}`}
      style={{
        color: theme.palette.primary.main,
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {params.value}
    </a>
  );
};

const EmailCellRenderer = (params: { value?: string | null }) => {
  const theme = useTheme();
  if (!params.value) return null;
  return (
    <a
      href={`mailto:${params.value}`}
      style={{
        color: theme.palette.primary.main,
        textDecoration: 'none',
      }}
    >
      {params.value}
    </a>
  );
};

const CustomerCellRenderer = (params: { data?: ContactWithCustomer }) => {
  const contact = params.data;
  if (!contact) return null;

  const companyName = contact.customer?.companyName;

  if (companyName) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {companyName}
      </Typography>
    );
  }

  return (
    <Chip
      label="Independent"
      size="small"
      sx={{
        bgcolor: 'grey.200',
        color: 'text.secondary',
        fontSize: '0.7rem',
        fontWeight: 600,
        height: 22,
      }}
    />
  );
};

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'billing', label: 'Billing' },
  { value: 'warehouse manager', label: 'Warehouse Manager' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'accounting', label: 'Accounting' },
];

const ContactListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector(selectContactListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          }),
        );
      }, 300);
    },
    [dispatch],
  );

  const handleRoleChange = useCallback((event: SelectChangeEvent) => {
    setRoleFilter(event.target.value);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingContact(undefined);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setDrawerOpen(true);
  }, []);

  const handleRowClicked = useCallback(
    (params: { data?: Contact }) => {
      if (params.data) {
        navigate(`/contacts/${params.data.id}`);
      }
    },
    [navigate],
  );

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setEditingContact(undefined);
  }, []);

  const contacts = useSelector(selectAllContacts);

  const filteredContacts = useMemo(() => {
    if (roleFilter === 'all') return contacts;
    return contacts.filter((c) => c.role === roleFilter);
  }, [contacts, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      const role = c.role ?? 'unassigned';
      counts[role] = (counts[role] ?? 0) + 1;
    });
    return counts;
  }, [contacts]);

  const kpiItems = useMemo(
    () => [
      {
        label: 'Total Contacts',
        value: String(contacts.length),
        subtitle: `${Object.keys(roleCounts).length} roles`,
      },
      ...Object.entries(roleCounts)
        .slice(0, 3)
        .map(([role, count]) => ({
          label: capitalize(role),
          value: String(count),
          subtitle: `${role} contacts`,
        })),
    ],
    [contacts.length, roleCounts],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        minWidth: 200,
        flex: 1.5,
        valueGetter: (params: { data?: Contact }) =>
          [params.data?.firstName, params.data?.lastName].filter(Boolean).join(' ') || '',
        cellRenderer: ContactNameCellRenderer,
      },
      {
        headerName: 'Role',
        field: 'role' as const,
        minWidth: 160,
        flex: 1,
        cellRenderer: RoleCellRenderer,
      },
      {
        headerName: 'Phone',
        field: 'phone' as const,
        minWidth: 140,
        cellRenderer: PhoneCellRenderer,
      },
      {
        headerName: 'Email',
        field: 'email' as const,
        minWidth: 200,
        flex: 1,
        cellRenderer: EmailCellRenderer,
      },
      {
        headerName: 'Customer',
        minWidth: 160,
        flex: 1,
        cellRenderer: CustomerCellRenderer,
      },
      {
        headerName: '',
        field: 'actions' as const,
        minWidth: 80,
        maxWidth: 80,
        sortable: false,
        cellRenderer: (params: { data?: Contact }) => {
          if (!params.data) return null;
          return (
            <Button
              size="small"
              variant="text"
              onClick={(e) => {
                e.stopPropagation();
                if (params.data) {
                  handleOpenEdit(params.data);
                }
              }}
              sx={{ minWidth: 'auto', fontWeight: 600, fontSize: '0.75rem' }}
            >
              Edit
            </Button>
          );
        },
      },
    ],
    [handleOpenEdit],
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
      <ListLayout
        title="Contacts"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Contact
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={2} sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }}>
          {kpiItems.map((kpiItem) => (
            <Grid key={kpiItem.label} item xs={12} md={6} xl={3}>
              <MainCard sx={{ height: '100%' }}>
                <KpiCell label={kpiItem.label} value={kpiItem.value} sub={kpiItem.subtitle} />
              </MainCard>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 3,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <MainCard
            content={false}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'stretch', md: 'center' }}
              spacing={2}
              sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
            >
              <Box>
                <InputLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={handleRoleChange}
                  input={<OutlinedInput size="small" />}
                  sx={{ minWidth: 160 }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                      {opt.value === 'all' ? ` (${contacts.length})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <InputLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Search</InputLabel>
                <TextField
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email..."
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
                    onRowClicked: handleRowClicked,
                  }}
                  loading={isLoading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>

      {drawerOpen && (
        <ContactInfoDrawer contact={editingContact} onClose={handleDrawerClose} />
      )}
    </PageWrapper>
  );
};

export default ContactListPage;
