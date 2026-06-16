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
import { Link, useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService.js';
import { warehouseService } from '../services/warehouseService.js';
import { supplierService } from '../services/supplierService.js';
import { materialService } from '../services/materialService.js';

export function ReceiptFormPage() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Header State
  const [transactionCode, setTransactionCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([
    { materialId: '', quantity: '', unitCost: '', notes: '' },
  ]);

  const [formErrors, setFormErrors] = useState({});

  const loadInitialData = async () => {
    setLoadingInit(true);
    try {
      const whRes = await warehouseService.list({ page: 1, limit: 100, isActive: 'true' });
      setWarehouses(whRes.data.items);

      const supRes = await supplierService.list({ page: 1, limit: 100, isActive: 'true' });
      setSuppliers(supRes.data.items);

      const matRes = await materialService.list({ page: 1, limit: 100, isActive: 'true' });
      setMaterials(matRes.data.items);

      // Auto-generate transaction code
      setTransactionCode(`RCV-${Date.now().toString().slice(-8)}`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được thông tin khởi tạo');
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { materialId: '', quantity: '', unitCost: '', notes: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showSnackbar('Phiếu nhập kho phải có ít nhất một nguyên phụ liệu', 'error');
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
    if (!transactionCode.trim()) {
      errors.transactionCode = 'Mã phiếu là bắt buộc';
    }
    if (!warehouseId) {
      errors.warehouseId = 'Vui lòng chọn kho nhập';
    }
    if (!transactionDate) {
      errors.transactionDate = 'Vui lòng chọn ngày nhập';
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
          errs.materialId = 'Vật tư bị lặp trong danh sách';
          hasItemError = true;
        }
        selectedMaterialIds.add(item.materialId);
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        errs.quantity = 'Số lượng phải > 0';
        hasItemError = true;
      }

      const cost = Number(item.unitCost);
      if (isNaN(cost) || cost < 0) {
        errs.unitCost = 'Đơn giá không được âm';
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
        transactionCode: transactionCode.trim(),
        warehouseId: Number(warehouseId),
        supplierId: supplierId ? Number(supplierId) : null,
        transactionDate,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          materialId: Number(it.materialId),
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
          notes: it.notes.trim() || null,
        })),
      };

      const response = await inventoryService.createReceipt(payload);
      showSnackbar('Tạo phiếu nhập kho thành công', 'success');
      navigate(`/inventory/transactions/${response.data.id}`);
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
        <Button startIcon={<ArrowBack />} component={Link} to="/inventory" sx={{ alignSelf: 'flex-start' }}>
          Quay lại tồn kho
        </Button>
        <Alert severity="error">{error}</Alert>
      </Stack>
    );
  }

  // Calculate totals
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalVal = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitCost) || 0)), 0);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBack />} component={Link} to="/inventory" sx={{ mb: 2 }}>
            Hủy và quay lại
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Lập phiếu nhập kho
          </Typography>
          <Typography color="text.secondary">
            Ghi nhận nguyên phụ liệu nhập kho từ nhà cung cấp ngoài hoặc gia công.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={submitLoading}
          sx={{ borderRadius: '8px' }}
        >
          {submitLoading ? 'Đang lưu...' : 'Nhập kho & Ghi sổ'}
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Thông tin chung phiếu nhập
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Mã phiếu nhập"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              error={!!formErrors.transactionCode}
              helperText={formErrors.transactionCode}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Kho nhận hàng"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              error={!!formErrors.warehouseId}
              helperText={formErrors.warehouseId}
              fullWidth
              size="small"
              required
            >
              <MenuItem value="">-- Chọn kho hàng --</MenuItem>
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.warehouseName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Nhà cung cấp"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">-- Chọn nhà cung cấp (nếu có) --</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.supplierName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ngày nhập kho"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              error={!!formErrors.transactionDate}
              helperText={formErrors.transactionDate}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Số chứng từ tham chiếu (Hóa đơn...)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <TextField
              label="Diễn giải / Ghi chú"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Chi tiết danh sách nguyên phụ liệu nhập
        </Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem} sx={{ borderRadius: '8px' }}>
          Thêm nguyên phụ liệu
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f7f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: '35%' }}>Chọn nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '15%' }}>Số lượng nhập</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '8%' }}>ĐVT</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '15%' }}>Đơn giá (VNĐ)</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '22%' }}>Ghi chú dòng</TableCell>
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
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      error={!!rowErrors.quantity}
                      helperText={rowErrors.quantity}
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
                      placeholder="0"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                      error={!!rowErrors.unitCost}
                      helperText={rowErrors.unitCost}
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
            
            {/* Totals Row */}
            <TableRow sx={{ bgcolor: '#fbfdfc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Tổng cộng</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{totalQty.toLocaleString()}</TableCell>
              <TableCell></TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#176b5b' }}>{totalVal.toLocaleString()} VNĐ</TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
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
