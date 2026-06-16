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
import { materialService } from '../services/materialService.js';

export function AdjustmentFormPage() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [whStockMap, setWhStockMap] = useState({});

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Header State
  const [transactionCode, setTransactionCode] = useState('');
  const [transactionType, setTransactionType] = useState('ADJUSTMENT_IN');
  const [warehouseId, setWarehouseId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([
    { materialId: '', quantity: '', notes: '' },
  ]);

  const [formErrors, setFormErrors] = useState({});

  const loadInitialData = async () => {
    setLoadingInit(true);
    try {
      const whRes = await warehouseService.list({ page: 1, limit: 100, isActive: 'true' });
      setWarehouses(whRes.data.items);

      const matRes = await materialService.list({ page: 1, limit: 100, isActive: 'true' });
      setMaterials(matRes.data.items);

      setTransactionCode(`ADJ-${Date.now().toString().slice(-8)}`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được dữ liệu khởi tạo');
    } finally {
      setLoadingInit(false);
    }
  };

  const loadWarehouseBalances = async (whId) => {
    if (!whId) {
      setWhStockMap({});
      return;
    }
    setLoadingBalances(true);
    try {
      const response = await warehouseService.getBalances(whId, { page: 1, limit: 200 });
      const stock = {};
      response.data.items.forEach((item) => {
        stock[item.materialId] = item.quantityOnHand;
      });
      setWhStockMap(stock);
    } catch (err) {
      console.error('Không tải được số dư kho thực tế', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadWarehouseBalances(warehouseId);
  }, [warehouseId]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { materialId: '', quantity: '', notes: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showSnackbar('Phiếu điều chỉnh phải có ít nhất một nguyên phụ liệu', 'error');
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
      errors.transactionCode = 'Mã phiếu điều chỉnh là bắt buộc';
    }
    if (!warehouseId) {
      errors.warehouseId = 'Vui lòng chọn kho điều chỉnh';
    }
    if (!transactionDate) {
      errors.transactionDate = 'Vui lòng chọn ngày điều chỉnh';
    }
    if (!notes.trim()) {
      errors.notes = 'Lý do/Diễn giải điều chỉnh là bắt buộc';
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
      } else if (item.materialId && transactionType === 'ADJUSTMENT_OUT') {
        const stock = whStockMap[item.materialId] ?? 0;
        if (qty > stock) {
          errs.quantity = `Chỉ còn ${stock.toLocaleString()} trong kho để điều chỉnh giảm`;
          hasItemError = true;
        }
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
        transactionType,
        warehouseId: Number(warehouseId),
        transactionDate,
        notes: notes.trim(),
        items: items.map((it) => ({
          materialId: Number(it.materialId),
          quantity: Number(it.quantity),
          notes: it.notes.trim() || null,
        })),
      };

      const response = await inventoryService.createAdjustment(payload);
      showSnackbar('Tạo phiếu điều chỉnh tồn kho thành công', 'success');
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

  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBack />} component={Link} to="/inventory" sx={{ mb: 2 }}>
            Hủy và quay lại
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Phiếu điều chỉnh tồn kho
          </Typography>
          <Typography color="text.secondary">
            Cân đối lại số dư nguyên phụ liệu thực tế lệch với sổ sách kế toán.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={submitLoading}
          sx={{ borderRadius: '8px' }}
        >
          {submitLoading ? 'Đang lưu...' : 'Ghi sổ điều chỉnh'}
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Thông tin chung phiếu điều chỉnh
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Mã phiếu điều chỉnh"
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
              label="Hướng điều chỉnh"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              fullWidth
              size="small"
              required
            >
              <MenuItem value="ADJUSTMENT_IN">Điều chỉnh TĂNG (Tồn thực tế nhiều hơn)</MenuItem>
              <MenuItem value="ADJUSTMENT_OUT">Điều chỉnh GIẢM (Tồn thực tế ít hơn)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Kho hàng kiểm kê"
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
              label="Ngày lập điều chỉnh"
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
          <Grid item xs={12} md={12}>
            <TextField
              label="Lý do điều chỉnh (Bắt buộc)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              error={!!formErrors.notes}
              helperText={formErrors.notes}
              placeholder="VD: Kiểm kê định kỳ phát hiện thừa/thiếu so với hệ thống"
              fullWidth
              size="small"
              required
            />
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Chi tiết danh sách nguyên phụ liệu điều chỉnh
        </Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem} sx={{ borderRadius: '8px' }} disabled={!warehouseId}>
          Thêm nguyên phụ liệu
        </Button>
      </Box>

      {!warehouseId ? (
        <Alert severity="info">Vui lòng chọn Kho hàng kiểm kê trước khi thêm chi tiết nguyên phụ liệu.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '40%' }}>Chọn nguyên phụ liệu</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>Tồn kho sổ sách</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>Số lượng điều chỉnh</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '10%' }}>ĐVT</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '20%' }}>Ghi chú dòng</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '5%' }}>Xóa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const selectedMaterial = materials.find((m) => Number(m.id) === Number(item.materialId));
                const unit = selectedMaterial ? selectedMaterial.unit : '-';
                const stock = item.materialId ? (whStockMap[item.materialId] ?? 0) : 0;
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
                    <TableCell align="right" sx={{ fontWeight: 700, color: stock === 0 ? '#d32f2f' : 'inherit' }}>
                      {loadingBalances ? '...' : stock.toLocaleString()}
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
                <TableCell sx={{ fontWeight: 700 }} colSpan={2}>Tổng cộng số lượng</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#9a4d2f' }}>{totalQty.toLocaleString()}</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
