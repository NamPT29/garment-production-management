import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Block, Edit } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { customerService } from '../services/customerService.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { hasPermission } from '../utils/auth.js';

const emptyForm = {
  customerCode: '',
  customerName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  taxCode: '',
  notes: '',
};

export function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [message, setMessage] = useState(null);

  const loadData = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const data = await customerService.list({
        page,
        limit,
        search,
        isActive,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });
      setRows(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Khong tai duoc khach hang' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      customerCode: row.customerCode,
      customerName: row.customerName,
      contactPerson: row.contactPerson ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      taxCode: row.taxCode ?? '',
      notes: row.notes ?? '',
    });
    setFormOpen(true);
  };

  const submitForm = async () => {
    try {
      if (editing) {
        await customerService.update(editing.id, form);
        setMessage({ type: 'success', text: 'Da cap nhat khach hang' });
      } else {
        await customerService.create(form);
        setMessage({ type: 'success', text: 'Da tao khach hang' });
      }
      setFormOpen(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Luu khach hang that bai' });
    }
  };

  const deactivate = async () => {
    try {
      await customerService.deactivate(confirmTarget.id);
      setMessage({ type: 'success', text: 'Da ngung hoat dong khach hang' });
      setConfirmTarget(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Thao tac that bai' });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Khach hang
          </Typography>
          <Typography color="text.secondary">Quan ly thong tin khach hang cua xuong may.</Typography>
        </Box>
        {hasPermission('CUSTOMER_CREATE') ? (
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            Them khach hang
          </Button>
        ) : null}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Tim kiem"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && loadData(1)}
            fullWidth
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Trang thai</InputLabel>
            <Select label="Trang thai" value={isActive} onChange={(event) => setIsActive(event.target.value)}>
              <MenuItem value="true">Dang hoat dong</MenuItem>
              <MenuItem value="false">Ngung hoat dong</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => loadData(1)}>
            Loc
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ma</TableCell>
              <TableCell>Ten khach hang</TableCell>
              <TableCell>Lien he</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Trang thai</TableCell>
              <TableCell align="right">Thao tac</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.customerCode}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.phone || row.contactPerson || '-'}</TableCell>
                <TableCell>{row.email || '-'}</TableCell>
                <TableCell>{row.isActive ? 'Dang hoat dong' : 'Ngung'}</TableCell>
                <TableCell align="right">
                  {hasPermission('CUSTOMER_UPDATE') ? (
                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(row)}>
                      Sua
                    </Button>
                  ) : null}
                  {row.isActive && hasPermission('CUSTOMER_DEACTIVATE') ? (
                    <Button
                      color="error"
                      size="small"
                      startIcon={<Block />}
                      onClick={() => setConfirmTarget(row)}
                    >
                      Ngung
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chua co khach hang
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.limit}
          onPageChange={(_event, page) => loadData(page + 1, pagination.limit)}
          onRowsPerPageChange={(event) => loadData(1, Number(event.target.value))}
        />
      </Paper>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Sua khach hang' : 'Them khach hang'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Ma khach hang" value={form.customerCode} onChange={(e) => setForm({ ...form, customerCode: e.target.value })} disabled={Boolean(editing)} required />
            <TextField label="Ten khach hang" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            <TextField label="Nguoi lien he" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <TextField label="Dien thoai" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Dia chi" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <TextField label="Ma so thue" value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} />
            <TextField label="Ghi chu" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Huy</Button>
          <Button variant="contained" onClick={submitForm}>Luu</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Ngung hoat dong khach hang"
        content={`Xac nhan ngung hoat dong ${confirmTarget?.customerName ?? ''}?`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={deactivate}
      />

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)}>
        {message ? <Alert severity={message.type}>{message.text}</Alert> : null}
      </Snackbar>
    </Stack>
  );
}
