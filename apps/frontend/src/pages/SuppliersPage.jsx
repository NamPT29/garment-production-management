import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Block, Search, FilterList } from '@mui/icons-material';
import { supplierService } from '../services/supplierService.js';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formValues, setFormValues] = useState({
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter,
      };
      const response = await supplierService.list(params);
      setSuppliers(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [page, isActiveFilter]);

  const handleSearchClick = () => {
    setPage(1);
    loadSuppliers();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedSupplier(null);
    setFormValues({
      supplierCode: '',
      supplierName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      notes: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (supplier) => {
    setDialogMode('edit');
    setSelectedSupplier(supplier);
    setFormValues({
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      taxCode: supplier.taxCode ?? '',
      notes: supplier.notes ?? '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.supplierCode.trim()) {
      errors.supplierCode = 'Mã nhà cung cấp là bắt buộc';
    }
    if (!formValues.supplierName.trim()) {
      errors.supplierName = 'Tên nhà cung cấp là bắt buộc';
    }
    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      errors.email = 'Email không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        ...formValues,
        contactPerson: formValues.contactPerson.trim() || null,
        phone: formValues.phone.trim() || null,
        email: formValues.email.trim() || null,
        address: formValues.address.trim() || null,
        taxCode: formValues.taxCode.trim() || null,
        notes: formValues.notes.trim() || null,
      };

      if (dialogMode === 'create') {
        await supplierService.create(payload);
        showSnackbar('Tạo nhà cung cấp thành công', 'success');
      } else {
        await supplierService.update(selectedSupplier.id, payload);
        showSnackbar('Cập nhật nhà cung cấp thành công', 'success');
      }
      setOpenDialog(false);
      loadSuppliers();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã có lỗi xảy ra';
      showSnackbar(msg, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn ngừng hoạt động nhà cung cấp này?')) {
      try {
        const response = await supplierService.deactivate(id);
        if (response.data?.warning) {
          showSnackbar(`Ngừng hoạt động thành công. Cảnh báo: ${response.data.warning}`, 'warning');
        } else {
          showSnackbar('Ngừng hoạt động nhà cung cấp thành công', 'success');
        }
        loadSuppliers();
      } catch (err) {
        showSnackbar(err.response?.data?.message ?? 'Không thể ngừng hoạt động', 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Quản lý nhà cung cấp
          </Typography>
          <Typography color="text.secondary">
            Danh mục nhà cung cấp nguyên phụ liệu và vật tư dệt may.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ borderRadius: '8px' }}>
          Thêm nhà cung cấp
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo mã, tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trạng thái"
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="true">Đang hoạt động</MenuItem>
              <MenuItem value="false">Ngừng hoạt động</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="outlined" fullWidth onClick={handleSearchClick} startIcon={<FilterList />}>
              Tìm kiếm
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : suppliers.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không tìm thấy nhà cung cấp phù hợp.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên nhà cung cấp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người liên hệ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã số thuế</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{supplier.supplierCode}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{supplier.supplierName}</TableCell>
                  <TableCell>{supplier.contactPerson || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.taxCode || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      color={supplier.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenEdit(supplier)} title="Sửa">
                      <Edit />
                    </IconButton>
                    {supplier.isActive ? (
                      <IconButton color="error" onClick={() => handleDeactivate(supplier.id)} title="Ngừng hoạt động">
                        <Block />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        </TableContainer>
      )}

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Thêm nhà cung cấp mới' : 'Cập nhật nhà cung cấp'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã nhà cung cấp"
              name="supplierCode"
              size="small"
              value={formValues.supplierCode}
              onChange={handleInputChange}
              error={!!formErrors.supplierCode}
              helperText={formErrors.supplierCode}
              disabled={dialogMode === 'edit'}
              fullWidth
              required
            />
            <TextField
              label="Tên nhà cung cấp"
              name="supplierName"
              size="small"
              value={formValues.supplierName}
              onChange={handleInputChange}
              error={!!formErrors.supplierName}
              helperText={formErrors.supplierName}
              fullWidth
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Người liên hệ"
                  name="contactPerson"
                  size="small"
                  value={formValues.contactPerson}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Số điện thoại"
                  name="phone"
                  size="small"
                  value={formValues.phone}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Email"
                  name="email"
                  size="small"
                  type="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Mã số thuế"
                  name="taxCode"
                  size="small"
                  value={formValues.taxCode}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Địa chỉ"
              name="address"
              size="small"
              value={formValues.address}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Ghi chú"
              name="notes"
              size="small"
              value={formValues.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitLoading}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
