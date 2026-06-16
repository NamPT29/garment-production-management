import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { productionOrderService } from '../services/productionOrderService.js';
import { orderService } from '../services/orderService.js';

const poStatuses = [
  { value: 'DRAFT', label: 'Bản thảo (DRAFT)' },
  { value: 'PLANNED', label: 'Đã lên kế hoạch (PLANNED)' },
  { value: 'RELEASED', label: 'Đã giải phóng (RELEASED)' },
  { value: 'IN_PROGRESS', label: 'Đang sản xuất (IN_PROGRESS)' },
  { value: 'PAUSED', label: 'Tạm dừng (PAUSED)' },
  { value: 'COMPLETED', label: 'Đã hoàn thành (COMPLETED)' },
  { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
];

const priorities = [
  { value: 'LOW', label: 'Thấp (LOW)' },
  { value: 'NORMAL', label: 'Thường (NORMAL)' },
  { value: 'HIGH', label: 'Cao (HIGH)' },
  { value: 'URGENT', label: 'Khẩn cấp (URGENT)' },
];

export function ProductionOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [formValues, setFormValues] = useState({
    productionOrderCode: '',
    orderId: '',
    productId: '',
    plannedQuantity: '',
    plannedStartDate: new Date().toISOString().slice(0, 10),
    plannedEndDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: 'NORMAL',
    status: 'DRAFT',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load initial lists for creation
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const ordersRes = await orderService.list({ limit: 100 });
      setOrders(ordersRes.data.items || []);

      if (isEditMode) {
        const poRes = await productionOrderService.getById(id);
        const po = poRes.data;
        setFormValues({
          productionOrderCode: po.productionOrderCode,
          orderId: po.orderId,
          productId: po.productId,
          plannedQuantity: po.plannedQuantity,
          plannedStartDate: po.plannedStartDate,
          plannedEndDate: po.plannedEndDate,
          priority: po.priority,
          status: po.status,
          notes: po.notes || '',
        });

        // Load the order details to display product context
        const orderRes = await orderService.getById(po.orderId);
        setSelectedOrder(orderRes.data);
        setOrderItems(orderRes.data.items || []);
      }
    } catch {
      setSnackbar({ open: true, message: 'Lỗi khi tải thông tin khởi tạo', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const handleOrderChange = async (e) => {
    const orderIdVal = e.target.value;
    setFormValues({ ...formValues, orderId: orderIdVal, productId: '' });
    setOrderItems([]);
    setSelectedOrder(null);
    if (!orderIdVal) return;

    try {
      const res = await orderService.getById(orderIdVal);
      setSelectedOrder(res.data);
      setOrderItems(res.data.items || []);
    } catch {
      setSnackbar({ open: true, message: 'Lỗi khi tải thông tin chi tiết đơn hàng', severity: 'error' });
    }
  };

  const getSelectedProductContext = () => {
    if (!formValues.productId || orderItems.length === 0) return null;
    return orderItems.find((item) => item.productId === Number(formValues.productId));
  };

  const validate = () => {
    const errors = {};
    if (!formValues.productionOrderCode.trim()) errors.productionOrderCode = 'Mã lệnh sản xuất là bắt buộc';
    if (!formValues.orderId) errors.orderId = 'Đơn đặt hàng là bắt buộc';
    if (!formValues.productId) errors.productId = 'Sản phẩm sản xuất là bắt buộc';
    if (!formValues.plannedQuantity || Number(formValues.plannedQuantity) <= 0) {
      errors.plannedQuantity = 'Số lượng kế hoạch phải lớn hơn 0';
    }
    if (!formValues.plannedStartDate) errors.plannedStartDate = 'Ngày bắt đầu là bắt buộc';
    if (!formValues.plannedEndDate) errors.plannedEndDate = 'Ngày kết thúc là bắt buộc';
    if (new Date(formValues.plannedEndDate) < new Date(formValues.plannedStartDate)) {
      errors.plannedEndDate = 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu';
    }

    // Client-side check for ordered quantity
    const selectedProd = getSelectedProductContext();
    if (selectedProd && Number(formValues.plannedQuantity) > selectedProd.quantity) {
      // Just a warning or strict check. Let's make it a strict validation match
      errors.plannedQuantity = `Số lượng kế hoạch vượt quá số lượng đặt hàng (${selectedProd.quantity})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        ...formValues,
        plannedQuantity: Number(formValues.plannedQuantity),
      };

      if (isEditMode) {
        await productionOrderService.update(id, payload);
        // If status changed, update it as well
        const originalPoRes = await productionOrderService.getById(id);
        if (originalPoRes.data.status !== formValues.status) {
          await productionOrderService.updateStatus(id, formValues.status);
        }
        setSnackbar({ open: true, message: 'Cập nhật lệnh sản xuất thành công', severity: 'success' });
      } else {
        await productionOrderService.create(payload);
        setSnackbar({ open: true, message: 'Tạo lệnh sản xuất thành công', severity: 'success' });
      }
      window.setTimeout(() => navigate('/production-orders'), 1000);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi khi gửi dữ liệu';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedProd = getSelectedProductContext();

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/production-orders')}>
          Quay lại
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {isEditMode ? 'Chỉnh sửa lệnh sản xuất' : 'Tạo lệnh sản xuất mới'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mã lệnh sản xuất"
                    disabled={isEditMode}
                    value={formValues.productionOrderCode}
                    onChange={(e) => setFormValues({ ...formValues, productionOrderCode: e.target.value })}
                    error={!!formErrors.productionOrderCode}
                    helperText={formErrors.productionOrderCode}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Đơn đặt hàng liên kết"
                    disabled={isEditMode}
                    value={formValues.orderId}
                    onChange={handleOrderChange}
                    error={!!formErrors.orderId}
                    helperText={formErrors.orderId}
                  >
                    <MenuItem value="">-- Chọn đơn hàng --</MenuItem>
                    {orders.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.orderCode} ({o.customerName})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Sản phẩm sản xuất"
                    disabled={isEditMode || !formValues.orderId}
                    value={formValues.productId}
                    onChange={(e) => setFormValues({ ...formValues, productId: e.target.value })}
                    error={!!formErrors.productId}
                    helperText={formErrors.productId || (!formValues.orderId ? 'Vui lòng chọn đơn hàng trước' : '')}
                  >
                    <MenuItem value="">-- Chọn sản phẩm --</MenuItem>
                    {orderItems.map((item) => (
                      <MenuItem key={item.productId} value={item.productId}>
                        {item.productName} ({item.productCode})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Số lượng kế hoạch sản xuất"
                    value={formValues.plannedQuantity}
                    onChange={(e) => setFormValues({ ...formValues, plannedQuantity: e.target.value })}
                    error={!!formErrors.plannedQuantity}
                    helperText={formErrors.plannedQuantity}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Độ ưu tiên"
                    value={formValues.priority}
                    onChange={(e) => setFormValues({ ...formValues, priority: e.target.value })}
                  >
                    {priorities.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày bắt đầu kế hoạch"
                    InputLabelProps={{ shrink: true }}
                    value={formValues.plannedStartDate}
                    onChange={(e) => setFormValues({ ...formValues, plannedStartDate: e.target.value })}
                    error={!!formErrors.plannedStartDate}
                    helperText={formErrors.plannedStartDate}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày kết thúc kế hoạch"
                    InputLabelProps={{ shrink: true }}
                    value={formValues.plannedEndDate}
                    onChange={(e) => setFormValues({ ...formValues, plannedEndDate: e.target.value })}
                    error={!!formErrors.plannedEndDate}
                    helperText={formErrors.plannedEndDate}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Trạng thái thực hiện"
                    value={formValues.status}
                    onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                  >
                    {poStatuses.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Ghi chú lệnh sản xuất"
                    value={formValues.notes}
                    onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  size="large"
                  onClick={handleSave}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Đang lưu...' : 'Lưu lệnh sản xuất'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right context information */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {selectedOrder && (
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Thông tin đơn đặt hàng
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Khách hàng</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedOrder.customerName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mã đơn hàng</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedOrder.orderCode}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ngày giao dự kiến</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedOrder.expectedDeliveryDate ? selectedOrder.expectedDeliveryDate.slice(0, 10) : '-'}</Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            {selectedProd && (
              <Card variant="outlined" sx={{ p: 3, borderLeft: '5px solid #1976d2' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Thông tin sản phẩm đặt hàng
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tên sản phẩm</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedProd.productName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mã sản phẩm</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedProd.productCode}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Màu sắc / Kích thước</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedProd.color || '-'} / {selectedProd.size || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Số lượng khách đặt</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {selectedProd.quantity} {selectedProd.unit || 'cái'}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
