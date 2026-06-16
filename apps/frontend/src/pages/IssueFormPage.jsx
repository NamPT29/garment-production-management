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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService.js';
import { warehouseService } from '../services/warehouseService.js';
import { orderService } from '../services/orderService.js';
import { materialService } from '../services/materialService.js';

export function IssueFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedOrderId = searchParams.get('orderId') || '';

  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // Warehouse balances cache for frontend stock validation
  const [whStockMap, setWhStockMap] = useState({}); // materialId -> quantityOnHand

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Header State
  const [transactionCode, setTransactionCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderId, setOrderId] = useState(preSelectedOrderId);
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

      const ordRes = await orderService.list({ page: 1, limit: 100 });
      setOrders(ordRes.data.items);

      const matRes = await materialService.list({ page: 1, limit: 100, isActive: 'true' });
      setMaterials(matRes.data.items);

      setTransactionCode(`ISS-${Date.now().toString().slice(-8)}`);
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
      showSnackbar('Phiếu xuất kho phải có ít nhất một nguyên phụ liệu', 'error');
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
      errors.transactionCode = 'Mã phiếu xuất là bắt buộc';
    }
    if (!warehouseId) {
      errors.warehouseId = 'Vui lòng chọn kho xuất';
    }
    if (!transactionDate) {
      errors.transactionDate = 'Vui lòng chọn ngày xuất';
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
      } else if (item.materialId) {
        const stock = whStockMap[item.materialId] ?? 0;
        if (qty > stock) {
          errs.quantity = `Chỉ còn ${stock.toLocaleString()} trong kho`;
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
        warehouseId: Number(warehouseId),
        orderId: orderId ? Number(orderId) : null,
        transactionDate,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          materialId: Number(it.materialId),
          quantity: Number(it.quantity),
          notes: it.notes.trim() || null,
        })),
      };

      const response = await inventoryService.createIssue(payload);
      showSnackbar('Tạo phiếu xuất kho thành công', 'success');
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
            Lập phiếu xuất kho
          </Typography>
          <Typography color="text.secondary">
            Ghi nhận xuất kho nguyên phụ liệu phục vụ sản xuất đơn hàng.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={submitLoading}
          sx={{ borderRadius: '8px' }}
        >
          {submitLoading ? 'Đang lưu...' : 'Xuất kho & Ghi sổ'}
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Thông tin chung phiếu xuất
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Mã phiếu xuất"
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
              label="Kho xuất hàng"
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
              label="Đơn hàng yêu cầu"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">-- Chọn đơn hàng liên kết (nếu có) --</MenuItem>
              {orders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.orderCode} - {o.customer?.customerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ngày xuất kho"
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
          Chi tiết danh sách nguyên phụ liệu xuất
        </Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem} sx={{ borderRadius: '8px' }} disabled={!warehouseId}>
          Thêm nguyên phụ liệu
        </Button>
      </Box>

      {!warehouseId ? (
        <Alert severity="info">Vui lòng chọn Kho xuất hàng trước khi thêm nguyên phụ liệu chi tiết.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '40%' }}>Chọn nguyên phụ liệu</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>Tồn kho thực tế</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>Số lượng xuất</TableCell>
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
                <TableCell sx={{ fontWeight: 700 }} colSpan={2}>Tổng cộng số lượng xuất</TableCell>
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
