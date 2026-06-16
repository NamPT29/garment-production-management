import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
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
} from '@mui/material';
import { ArrowBack, Delete, Add, Save } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bomService } from '../services/bomService.js';
import { productService } from '../services/productService.js';
import { materialService } from '../services/materialService.js';

export function BomFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form Header State
  const [productId, setProductId] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Form Items State
  const [items, setItems] = useState([
    { materialId: '', quantityPerUnit: '', wasteRatePercent: 0, notes: '' },
  ]);

  const [formErrors, setFormErrors] = useState({});

  const loadInitialData = async () => {
    setLoadingInit(true);
    setError('');
    try {
      const prodRes = await productService.list({ page: 1, limit: 100, isActive: 'true' });
      setProducts(prodRes.data.items);

      const matRes = await materialService.list({ page: 1, limit: 100, isActive: 'true' });
      setMaterials(matRes.data.items);

      if (mode === 'edit') {
        const bomRes = await bomService.getById(id);
        const bom = bomRes.data;
        if (bom.status !== 'DRAFT') {
          throw new Error('Chỉ có thể sửa đổi bảng định mức ở trạng thái Nháp (DRAFT).');
        }
        setProductId(bom.productId);
        setVersion(bom.version);
        setEffectiveDate(bom.effectiveDate);
        setNotes(bom.notes ?? '');
        setItems(
          bom.items.map((it) => ({
            materialId: it.materialId,
            quantityPerUnit: String(it.quantityPerUnit),
            wasteRatePercent: it.wasteRatePercent,
            notes: it.notes ?? '',
          })),
        );
      }
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Không tải được dữ liệu khởi tạo');
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id, mode]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { materialId: '', quantityPerUnit: '', wasteRatePercent: 0, notes: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showSnackbar('Bảng định mức phải có ít nhất một nguyên phụ liệu', 'error');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!productId) {
      errors.productId = 'Vui lòng chọn sản phẩm';
    }
    if (!version.trim()) {
      errors.version = 'Phiên bản định mức là bắt buộc';
    }
    if (!effectiveDate) {
      errors.effectiveDate = 'Vui lòng chọn ngày hiệu lực';
    }

    const itemErrors = [];
    let hasItemError = false;
    const selectedMaterialIds = new Set();

    items.forEach((item, index) => {
      const errs = {};
      if (!item.materialId) {
        errs.materialId = 'Vui lòng chọn vật tư';
        hasItemError = true;
      } else {
        if (selectedMaterialIds.has(item.materialId)) {
          errs.materialId = 'Vật tư đã bị trùng lặp trong BOM';
          hasItemError = true;
        }
        selectedMaterialIds.add(item.materialId);
      }

      const qty = Number(item.quantityPerUnit);
      if (isNaN(qty) || qty <= 0) {
        errs.quantityPerUnit = 'Định mức phải > 0';
        hasItemError = true;
      }

      const waste = Number(item.wasteRatePercent);
      if (isNaN(waste) || waste < 0 || waste > 100) {
        errs.wasteRatePercent = 'Hao hụt từ 0 - 100';
        hasItemError = true;
      }

      itemErrors[index] = errs;
    });

    setFormErrors({ ...errors, items: itemErrors });
    return Object.keys(errors).length === 0 && !hasItemError;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        productId: Number(productId),
        version: version.trim(),
        effectiveDate,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          materialId: Number(it.materialId),
          quantityPerUnit: Number(it.quantityPerUnit),
          wasteRatePercent: Number(it.wasteRatePercent),
          notes: it.notes.trim() || null,
        })),
      };

      if (mode === 'create') {
        const response = await bomService.create(payload);
        showSnackbar('Tạo định mức BOM thành công', 'success');
        navigate(`/boms/${response.data.id}`);
      } else {
        await bomService.update(id, payload);
        showSnackbar('Cập nhật định mức BOM thành công', 'success');
        navigate(`/boms/${id}`);
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Đã có lỗi xảy ra', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loadingInit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/boms" sx={{ alignSelf: 'flex-start' }}>
          Quay lại danh sách BOM
        </Button>
        <Alert severity="error">{error}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBack />} component={Link} to="/boms" sx={{ mb: 2 }}>
            Hủy và quay lại
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {mode === 'create' ? 'Thiết kế định mức mới (BOM)' : 'Chỉnh sửa định mức (BOM)'}
          </Typography>
          <Typography color="text.secondary">
            Thiết lập danh mục vật tư cần dùng kèm tỷ lệ hao hụt khi may.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={submitLoading}
          sx={{ borderRadius: '8px' }}
        >
          {submitLoading ? 'Đang lưu...' : 'Lưu bảng định mức'}
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Thông tin chung định mức
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Sản phẩm định mức"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              error={!!formErrors.productId}
              helperText={formErrors.productId}
              disabled={mode === 'edit'}
              fullWidth
              size="small"
              required
            >
              <MenuItem value="">-- Chọn sản phẩm --</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.productName} ({p.productCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Phiên bản định mức"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              error={!!formErrors.version}
              helperText={formErrors.version}
              placeholder="Ví dụ: V1.0, V2.0"
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ngày bắt đầu hiệu lực"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              error={!!formErrors.effectiveDate}
              helperText={formErrors.effectiveDate}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              label="Ghi chú bảng định mức"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Danh sách vật tư kỹ thuật
        </Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem} sx={{ borderRadius: '8px' }}>
          Thêm nguyên phụ liệu
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f7f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: '30%' }}>Chọn nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '15%' }}>Số lượng định mức</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '10%' }}>ĐVT</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '15%' }}>Hao hụt (%)</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '25%' }}>Ghi chú dòng</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: '5%' }}>Xóa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const selectedMaterial = materials.find((m) => Number(m.id) === Number(item.materialId));
              const unit = selectedMaterial ? selectedMaterial.unit : '-';
              const rowErrors = formErrors.items?.[index] ?? {};

              return (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.materialId}
                      onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                      error={!!rowErrors.materialId}
                      helperText={rowErrors.materialId}
                    >
                      <MenuItem value="">-- Chọn nguyên phụ liệu --</MenuItem>
                      {materials.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.materialName} ({m.materialCode})
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.0"
                      value={item.quantityPerUnit}
                      onChange={(e) => handleItemChange(index, 'quantityPerUnit', e.target.value)}
                      error={!!rowErrors.quantityPerUnit}
                      helperText={rowErrors.quantityPerUnit}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" color="text.secondary">
                      {unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.wasteRatePercent}
                      onChange={(e) => handleItemChange(index, 'wasteRatePercent', e.target.value)}
                      error={!!rowErrors.wasteRatePercent}
                      helperText={rowErrors.wasteRatePercent}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Nhập ghi chú chi tiết..."
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleRemoveItem(index)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

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
