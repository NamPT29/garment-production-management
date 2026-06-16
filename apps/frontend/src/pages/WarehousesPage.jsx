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
  MenuItem,
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
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Block, Search, FilterList, Visibility } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { warehouseService } from '../services/warehouseService.js';

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formValues, setFormValues] = useState({
    warehouseCode: '',
    warehouseName: '',
    location: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadWarehouses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter,
      };
      const response = await warehouseService.list(params);
      setWarehouses(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [page, isActiveFilter]);

  const handleSearchClick = () => {
    setPage(1);
    loadWarehouses();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedWarehouse(null);
    setFormValues({
      warehouseCode: '',
      warehouseName: '',
      location: '',
      description: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (wh) => {
    setDialogMode('edit');
    setSelectedWarehouse(wh);
    setFormValues({
      warehouseCode: wh.warehouseCode,
      warehouseName: wh.warehouseName,
      location: wh.location ?? '',
      description: wh.description ?? '',
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
    if (!formValues.warehouseCode.trim()) {
      errors.warehouseCode = 'Mã kho là bắt buộc';
    }
    if (!formValues.warehouseName.trim()) {
      errors.warehouseName = 'Tên kho là bắt buộc';
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
        location: formValues.location.trim() || null,
        description: formValues.description.trim() || null,
      };

      if (dialogMode === 'create') {
        await warehouseService.create(payload);
        showSnackbar('Tạo kho thành công', 'success');
      } else {
        await warehouseService.update(selectedWarehouse.id, payload);
        showSnackbar('Cập nhật kho thành công', 'success');
      }
      setOpenDialog(false);
      loadWarehouses();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Đã có lỗi xảy ra', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn ngừng hoạt động kho này?')) {
      try {
        await warehouseService.deactivate(id);
        showSnackbar('Ngừng hoạt động kho thành công', 'success');
        loadWarehouses();
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
            Quản lý kho hàng
          </Typography>
          <Typography color="text.secondary">
            Danh mục kho lưu trữ nguyên liệu, phụ liệu dệt may.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ borderRadius: '8px' }}>
          Thêm kho hàng
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo mã, tên, vị trí..."
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
      ) : warehouses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không tìm thấy kho hàng phù hợp.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã kho</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên kho</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Địa điểm/Vị trí</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow key={wh.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{wh.warehouseCode}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{wh.warehouseName}</TableCell>
                  <TableCell>{wh.location || '-'}</TableCell>
                  <TableCell>{wh.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={wh.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      color={wh.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="info" component={Link} to={`/warehouses/${wh.id}`} title="Xem tồn kho">
                      <Visibility />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleOpenEdit(wh)} title="Sửa">
                      <Edit />
                    </IconButton>
                    {wh.isActive ? (
                      <IconButton color="error" onClick={() => handleDeactivate(wh.id)} title="Ngừng hoạt động">
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
          {dialogMode === 'create' ? 'Thêm kho hàng mới' : 'Cập nhật kho hàng'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã kho"
              name="warehouseCode"
              size="small"
              value={formValues.warehouseCode}
              onChange={handleInputChange}
              error={!!formErrors.warehouseCode}
              helperText={formErrors.warehouseCode}
              disabled={dialogMode === 'edit'}
              fullWidth
              required
            />
            <TextField
              label="Tên kho"
              name="warehouseName"
              size="small"
              value={formValues.warehouseName}
              onChange={handleInputChange}
              error={!!formErrors.warehouseName}
              helperText={formErrors.warehouseName}
              fullWidth
              required
            />
            <TextField
              label="Vị trí/Địa điểm"
              name="location"
              size="small"
              value={formValues.location}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Mô tả"
              name="description"
              size="small"
              value={formValues.description}
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
