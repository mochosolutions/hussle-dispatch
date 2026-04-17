import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, NewDataGrid, MainCard } from '@mocho/ui/components';
import { EmptyState } from 'mocho/components/EmptyState';
import { ActionsCell } from 'mocho/components/DataGrid/ActionsCell';
import { ListLayout } from 'components/ListLayout';
import ListKpiBar from 'components/ListKpiBar';
import type { KpiItem } from 'components/ListKpiBar';
import FilterBar from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import { useDispatch, useSelector } from 'store';
import type { Contact } from '../../types';
import { fetchContactsRequest } from '../../store/reducers/contactPageSlice';
import {
  selectContactListLoading,
  selectAllContacts,
} from '../../store/selectors/contactSelectors';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import {
  ContactNameCellRenderer,
  RoleCellRenderer,
  PhoneCellRenderer,
  EmailCellRenderer,
  CustomerCellRenderer,
} from '../../components/ContactListPage/ContactCellRenderers';

const capitalize = (s: string | null): string => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  const [roleFilter, setRoleFilter] = useState('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useDrawerActions();

  const isLoading = useSelector(selectContactListLoading);
  const contacts = useSelector(selectAllContacts);

  useEffect(() => {
    dispatch(fetchContactsRequest({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(
        fetchContactsRequest({
          page: 1,
          limit: 25,
          search: String(value),
        }),
      );
    },
    [dispatch],
  );

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
  }, []);

  const handleOpenCreate = useCallback(() => {
    openDrawer('contactCreate', { onClose: () => undefined });
  }, [openDrawer]);

  const handleRowClicked = useCallback(
    (params: { data?: Contact }) => {
      if (params.data) {
        navigate(`/contacts/${params.data.id}`);
      }
    },
    [navigate],
  );

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

  const kpiItems = useMemo<KpiItem[]>(
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

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: ROLE_OPTIONS,
        value: roleFilter,
        onChange: handleRoleChange,
      },
    ],
    [roleFilter, handleRoleChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by name, email...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
  );

  const actionsCellConfig = useMemo(
    () => ({
      getViewRoute: (data: Contact) => `/contacts/${data.id}`,
      showView: true,
      showEdit: false,
      showDelete: false,
    }),
    [],
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
        cellRenderer: ActionsCell,
        cellRendererParams: { config: actionsCellConfig },
      },
    ],
    [actionsCellConfig],
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
        <ListKpiBar items={kpiItems} sx={{ px: { xs: 2, sm: 3 }, pt: 2 }} />

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
            <FilterBar filters={filters} search={searchConfig} />

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredContacts}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredContacts.length}
                  rowCountLabel="contacts"
                  noDataComponent={<EmptyState variant="no-data" entityName="Contacts" />}
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 56,
                    onRowClicked: handleRowClicked,
                  }}
                  loading={isLoading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>
    </PageWrapper>
  );
};

export default ContactListPage;
