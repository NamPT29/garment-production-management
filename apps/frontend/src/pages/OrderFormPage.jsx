import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services/customerService.js';
import { orderService } from '../services/orderService.js';
import { productService } from '../services/productService.js';

const blankItem = { productId: '', quantity: 1, unitPrice: 0, color: '', size: '', notes: '' };

const today = () => new Date().toISOString().slice(0, 10);

export function OrderFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    orderCode: '',
    customerId: '',
    orderDate: today(),
    expectedDeliveryDate: today(),
    priority: 'NORMAL',
    notes: '',
    items: [{ ...blankItem }],
  });

  const totalQuantity = useMemo(
    () => form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [form.items],
  );

  useEffect(() => {
    const load = async () => {
      const [customerData, productData] = await Promise.all([
        customerService.list({ limit: 100, isActive: true }),
        productService.list({ limit: 100, isActive: true }),
      ]);
      setCustomers(customerData.items);
      setProducts(productData.items);

      if (mode === 'edit') {
        const order = await orderService.getById(id);
        setForm({
          orderCode: order.orderCode,
          customerId: order.customerId,
          orderDate: String(order.orderDate).slice(0, 10),
          expectedDeliveryDate: String(order.expectedDeliveryDate).slice(0, 10),
          priority: order.priority,
          notes: order.notes ?? '',
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            color: item.color ?? '',
            size: item.size ?? '',
            notes: item.notes ?? '',
          })),
        });
      }
    };
    load().catch((error) => {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Khong tai duoc du lieu' });
    });
  }, [id, mode]);

  const updateItem = (index, patch) => {
    setForm({
      ...form,
      items: form.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    });
  };

  const submit = async () => {
    if (!form.items.length) {
      setMessage({ type: 'error', text: 'Don hang phai co it nhat mot san pham' });
      return;
    }

    const payload = {
      ...form,
      customerId: Number(form.customerId),
      items: form.items.map((item) => ({
        ...item,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice || 0),
      })),
    };

    try {
      const order = mode === 'edit' ? await orderService.update(id, payload) : await orderService.create(payload);
      navigate(`/orders/${order.id}`);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Luu don hang that bai' });
    }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {mode === 'edit' ? 'Sua don hang' : 'Tao don hang'}
        </Typography>
        <Typography color="text.secondary">Nhap thong tin don hang va danh sach san pham.</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Ma don hang" value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} disabled={mode === 'edit'} required />
            <FormControl sx={{ minWidth: 260 }}>
              <InputLabel>Khach hang</InputLabel>
              <Select label="Khach hang" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.customerName}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Ngay dat" type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Ngay giao du kien" type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Uu tien</InputLabel>
              <Select label="Uu tien" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Ghi chu" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>San pham trong don</Typography>
            <Button startIcon={<Add />} onClick={() => setForm({ ...form, items: [...form.items, { ...blankItem }] })}>Them dong</Button>
          </Stack>
          {form.items.map((item, index) => (
            <Stack key={index} direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems={{ lg: 'center' }}>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel>San pham</InputLabel>
                <Select label="San pham" value={item.productId} onChange={(e) => updateItem(index, { productId: e.target.value })}>
                  {products.map((product) => <MenuItem key={product.id} value={product.id}>{product.productCode} - {product.productName}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="So luong" type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} />
              <TextField label="Don gia" type="number" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: e.target.value })} />
              <TextField label="Mau" value={item.color} onChange={(e) => updateItem(index, { color: e.target.value })} />
              <TextField label="Size" value={item.size} onChange={(e) => updateItem(index, { size: e.target.value })} />
              <IconButton color="error" onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) })}>
                <Delete />
              </IconButton>
            </Stack>
          ))}
          <Typography color="text.secondary">Tong so luong: {totalQuantity}</Typography>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button startIcon={<Save />} variant="contained" onClick={submit}>Luu don hang</Button>
        <Button onClick={() => navigate('/orders')}>Quay lai</Button>
      </Stack>

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)}>
        {message ? <Alert severity={message.type}>{message.text}</Alert> : null}
      </Snackbar>
    </Stack>
  );
}
