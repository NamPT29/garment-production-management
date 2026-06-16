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
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Switch,
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
import { Add, Edit, Block, Search, Warning } from '@mui/icons-material';
import { materialService } from '../services/materialService.js';
import { supplierService } from '../services/supplierService.js';

const categories = [
  { value: 'FABRIC', label: 'Vải (FABRIC)' },
  { value: 'THREAD', label: 'Chỉ may (THREAD)' },
  { value: 'BUTTON', label: 'Cúc/Nút (BUTTON)' },
  { value: 'ZIPPER', label: 'Khóa kéo (ZIPPER)' },
  { value: 'LABEL', label: 'Nhãn mác (LABEL)' },
  { value: 'PACKAGING', label: 'Bao bì (PACKAGING)' },
  { value: 'ACCESSORY', label: 'Phụ kiện khác (ACCESSORY)' },
  { value: 'OTHER', label: 'Khác (OTHER)' },
];

export function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [activeSuppliers, setActiveSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isActiveFilter, setIsActiveFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formValues, setFormValues] = useState({
    materialCode: '',
    materialName: '',
    category: 'FABRIC',
    unit: '',
    color: '',
    specification: '',
    minimumStock: 0,
    defaultSupplierId: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        supplierId: supplierFilter === 'all' ? undefined : Number(supplierFilter),
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter,
        lowStock: lowStockFilter ? 'true' : undefined,
      };
      const response = await materialService.list(params);
      setMaterials(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách nguyên phụ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.list({ page: 1, limit: 100, isActive: 'true' });
      setActiveSuppliers(response.data.items);
    } catch (err) {
      console.error('Không tải được danh sách nhà cung cấp hoạt động', err);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [page, categoryFilter, supplierFilter, lowStockFilter, isActiveFilter]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSearchClick = () => {
    setPage(1);
    loadMaterials();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedMaterial(null);
    setFormValues({
      materialCode: '',
      materialName: '',
      category: 'FABRIC',
      unit: '',
      color: '',
      specification: '',
      minimumStock: 0,
      defaultSupplierId: '',
      notes: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (material) => {
    setDialogMode('edit');
    setSelectedMaterial(material);
    setFormValues({
      materialCode: material.materialCode,
      materialName: material.materialName,
      category: material.category,
      unit: material.unit,
      color: material.color ?? '',
      specification: material.specification ?? '',
      minimumStock: material.minimumStock,
      defaultSupplierId: material.defaultSupplierId ?? '',
      notes: material.notes ?? '',
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
    if (!formValues.materialCode.trim()) {
      errors.materialCode = 'Mã nguyên phụ liệu là bắt buộc';
    }
    if (!formValues.materialName.trim()) {
      errors.materialName = 'Tên nguyên phụ liệu là bắt buộc';
    }
    if (!formValues.unit.trim()) {
      errors.unit = 'Đơn vị tính là bắt buộc';
    }
    if (Number(formValues.minimumStock) < 0) {
      errors.minimumStock = 'Tồn tối thiểu không được âm';
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
        color: formValues.color.trim() || null,
        specification: formValues.specification.trim() || null,
        minimumStock: Number(formValues.minimumStock),
        defaultSupplierId: formValues.defaultSupplierId ? Number(formValues.defaultSupplierId) : null,
        notes: formValues.notes.trim() || null,
      };

      if (dialogMode === 'create') {
        await materialService.create(payload);
        showSnackbar('Tạo nguyên phụ liệu thành công', 'success');
      } else {
        await materialService.update(selectedMaterial.id, payload);
        showSnackbar('Cập nhật nguyên phụ liệu thành công', 'success');
      }
      setOpenDialog(false);
      loadMaterials();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Đã có lỗi xảy ra', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn ngừng hoạt động nguyên phụ liệu này?')) {
      try {
        await materialService.deactivate(id);
        showSnackbar('Ngừng hoạt động nguyên phụ liệu thành công', 'success');
        loadMaterials();
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
            Quản lý nguyên phụ liệu
          </Typography>
          <Typography color="text.secondary">
            Danh mục nguyên liệu, phụ liệu dệt may (Vải, chỉ, khóa kéo, cúc nút...).
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ borderRadius: '8px' }}>
          Thêm nguyên phụ liệu
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo mã, tên, màu, quy cách..."
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
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Loại vật tư"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả loại</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Nhà cung cấp"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả NCC</MenuItem>
              {activeSuppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.supplierName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
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
          <Grid item xs={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  color="warning"
                />
              }
              label="Thiếu hàng"
            />
          </Grid>
        </Grid>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : materials.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không tìm thấy nguyên phụ liệu phù hợp.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã vật tư</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ĐVT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đặc tính</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nhà cung cấp mặc định</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tồn kho</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tối thiểu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((material) => {
                const isLow = material.totalStock <= material.minimumStock;
                return (
                  <TableRow key={material.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{material.materialCode}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{material.materialName}</TableCell>
                    <TableCell>
                      <Chip label={material.category} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Màu: {material.color || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quy cách: {material.specification || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{material.defaultSupplier?.supplierName || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: isLow ? '#d32f2f' : 'inherit' }}>
                      {material.totalStock.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">{material.minimumStock.toLocaleString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {isLow ? (
                          <Chip
                            icon={<Warning style={{ fontSize: 16 }} />}
                            label="Thiếu hàng"
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip label="Đủ hàng" color="success" size="small" variant="outlined" />
                        )}
                        {!material.isActive ? (
                          <Chip label="Ngừng hoạt động" color="default" size="small" />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenEdit(material)} title="Sửa">
                        <Edit />
                      </IconButton>
                      {material.isActive ? (
                        <IconButton color="error" onClick={() => handleDeactivate(material.id)} title="Ngừng hoạt động">
                          <Block />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
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
          {dialogMode === 'create' ? 'Thêm nguyên phụ liệu mới' : 'Cập nhật nguyên phụ liệu'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã nguyên phụ liệu"
              name="materialCode"
              size="small"
              value={formValues.materialCode}
              onChange={handleInputChange}
              error={!!formErrors.materialCode}
              helperText={formErrors.materialCode}
              disabled={dialogMode === 'edit'}
              fullWidth
              required
            />
            <TextField
              label="Tên nguyên phụ liệu"
              name="materialName"
              size="small"
              value={formValues.materialName}
              onChange={handleInputChange}
              error={!!formErrors.materialName}
              helperText={formErrors.materialName}
              fullWidth
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Loại vật tư"
                  name="category"
                  size="small"
                  value={formValues.category}
                  onChange={handleInputChange}
                  fullWidth
                >
                  {categories.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Đơn vị tính (ĐVT)"
                  name="unit"
                  size="small"
                  value={formValues.unit}
                  onChange={handleInputChange}
                  error={!!formErrors.unit}
                  helperText={formErrors.unit}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Màu sắc"
                  name="color"
                  size="small"
                  value={formValues.color}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Quy cách/Đặc tính"
                  name="specification"
                  size="small"
                  value={formValues.specification}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Tồn kho tối thiểu"
                  name="minimumStock"
                  size="small"
                  type="number"
                  value={formValues.minimumStock}
                  onChange={handleInputChange}
                  error={!!formErrors.minimumStock}
                  helperText={formErrors.minimumStock}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Nhà cung cấp mặc định"
                  name="defaultSupplierId"
                  size="small"
                  value={formValues.defaultSupplierId}
                  onChange={handleInputChange}
                  fullWidth
                >
                  <MenuItem value="">-- Chọn nhà cung cấp --</MenuItem>
                  {activeSuppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.supplierName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
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
