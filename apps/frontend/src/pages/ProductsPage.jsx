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
import { productService } from '../services/productService.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { hasPermission } from '../utils/auth.js';

const emptyForm = {
  productCode: '',
  productName: '',
  category: '',
  unit: '',
  description: '',
  standardTimeMinutes: '',
  imageUrl: '',
};

export function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
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
      const data = await productService.list({
        page,
        limit,
        search,
        category: category || undefined,
        isActive,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });
      setRows(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Khong tai duoc san pham' });
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
      productCode: row.productCode,
      productName: row.productName,
      category: row.category ?? '',
      unit: row.unit ?? '',
      description: row.description ?? '',
      standardTimeMinutes: row.standardTimeMinutes ?? '',
      imageUrl: row.imageUrl ?? '',
    });
    setFormOpen(true);
  };

  const payload = () => ({
    ...form,
    standardTimeMinutes: form.standardTimeMinutes ? Number(form.standardTimeMinutes) : null,
  });

  const submitForm = async () => {
    try {
      if (editing) {
        await productService.update(editing.id, payload());
        setMessage({ type: 'success', text: 'Da cap nhat san pham' });
      } else {
        await productService.create(payload());
        setMessage({ type: 'success', text: 'Da tao san pham' });
      }
      setFormOpen(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Luu san pham that bai' });
    }
  };

  const deactivate = async () => {
    try {
      await productService.deactivate(confirmTarget.id);
      setMessage({ type: 'success', text: 'Da ngung hoat dong san pham' });
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
            San pham
          </Typography>
          <Typography color="text.secondary">Quan ly danh muc san pham may mac.</Typography>
        </Box>
        {hasPermission('PRODUCT_CREATE') ? (
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            Them san pham
          </Button>
        ) : null}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Tim kiem" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
          <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Trang thai</InputLabel>
            <Select label="Trang thai" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
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
              <TableCell>Ten san pham</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Don vi</TableCell>
              <TableCell>Thoi gian chuan</TableCell>
              <TableCell>Trang thai</TableCell>
              <TableCell align="right">Thao tac</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.productCode}</TableCell>
                <TableCell>{row.productName}</TableCell>
                <TableCell>{row.category || '-'}</TableCell>
                <TableCell>{row.unit || '-'}</TableCell>
                <TableCell>{row.standardTimeMinutes || '-'} phut</TableCell>
                <TableCell>{row.isActive ? 'Dang hoat dong' : 'Ngung'}</TableCell>
                <TableCell align="right">
                  {hasPermission('PRODUCT_UPDATE') ? (
                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(row)}>
                      Sua
                    </Button>
                  ) : null}
                  {row.isActive && hasPermission('PRODUCT_DEACTIVATE') ? (
                    <Button color="error" size="small" startIcon={<Block />} onClick={() => setConfirmTarget(row)}>
                      Ngung
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Chua co san pham
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
        <DialogTitle>{editing ? 'Sua san pham' : 'Them san pham'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Ma san pham" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} disabled={Boolean(editing)} required />
            <TextField label="Ten san pham" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
            <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <TextField label="Don vi" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <TextField label="Thoi gian chuan phut" type="number" value={form.standardTimeMinutes} onChange={(e) => setForm({ ...form, standardTimeMinutes: e.target.value })} />
            <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <TextField label="Mo ta" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Huy</Button>
          <Button variant="contained" onClick={submitForm}>Luu</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Ngung hoat dong san pham"
        content={`Xac nhan ngung hoat dong ${confirmTarget?.productName ?? ''}?`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={deactivate}
      />

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)}>
        {message ? <Alert severity={message.type}>{message.text}</Alert> : null}
      </Snackbar>
    </Stack>
  );
}
