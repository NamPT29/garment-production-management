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
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { PriorityChip, StatusChip } from '../ui/StatusChip.jsx';
import { hasPermission } from '../utils/auth.js';

const statusOptions = ['CONFIRMED', 'PLANNED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED', 'CANCELLED'];

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', changeNote: '' });
  const [message, setMessage] = useState(null);

  const loadOrder = async () => {
    try {
      setOrder(await orderService.getById(id));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Khong tai duoc don hang' });
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const quantity = order?.items?.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;
    const amount = order?.items?.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) ?? 0;
    return { quantity, amount };
  }, [order]);

  const updateStatus = async () => {
    try {
      await orderService.updateStatus(id, statusForm);
      setMessage({ type: 'success', text: 'Da cap nhat trang thai' });
      setStatusOpen(false);
      loadOrder();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Cap nhat trang thai that bai' });
    }
  };

  if (!order) {
    return <Typography>Dang tai don hang...</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {order.orderCode}
          </Typography>
          <Typography color="text.secondary">{order.customer.customerName}</Typography>
        </Box>
        {hasPermission('ORDER_UPDATE') && !['DELIVERED', 'CANCELLED'].includes(order.status) ? (
          <Button component={Link} to={`/orders/${id}/edit`} startIcon={<Edit />} variant="outlined">Sua</Button>
        ) : null}
        {hasPermission('ORDER_STATUS_UPDATE') ? (
          <Button variant="contained" onClick={() => setStatusOpen(true)}>Doi trang thai</Button>
        ) : null}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box>
            <Typography color="text.secondary">Ngay dat</Typography>
            <Typography>{String(order.orderDate).slice(0, 10)}</Typography>
          </Box>
          <Box>
            <Typography color="text.secondary">Ngay giao du kien</Typography>
            <Typography>{String(order.expectedDeliveryDate).slice(0, 10)}</Typography>
          </Box>
          <Box>
            <Typography color="text.secondary">Uu tien</Typography>
            <PriorityChip value={order.priority} />
          </Box>
          <Box>
            <Typography color="text.secondary">Trang thai</Typography>
            <StatusChip value={order.status} />
          </Box>
          <Box>
            <Typography color="text.secondary">Tong so luong</Typography>
            <Typography>{totals.quantity}</Typography>
          </Box>
          <Box>
            <Typography color="text.secondary">Tong gia tri</Typography>
            <Typography>{totals.amount.toLocaleString('vi-VN')}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ma san pham</TableCell>
              <TableCell>Ten san pham</TableCell>
              <TableCell>Mau</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>So luong</TableCell>
              <TableCell>Don gia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product.productCode}</TableCell>
                <TableCell>{item.product.productName}</TableCell>
                <TableCell>{item.color || '-'}</TableCell>
                <TableCell>{item.size || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{Number(item.unitPrice).toLocaleString('vi-VN')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Lich su trang thai</Typography>
        <Stack spacing={1}>
          {order.statusHistory.map((history) => (
            <Paper key={history.id} variant="outlined" sx={{ p: 1.5 }}>
              <Typography>
                {history.fromStatus || 'Khoi tao'} -&gt; {history.toStatus}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {history.changeNote || 'Khong co ghi chu'} - {String(history.createdAt).slice(0, 19).replace('T', ' ')}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Doi trang thai</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Trang thai moi</InputLabel>
              <Select label="Trang thai moi" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Ghi chu" value={statusForm.changeNote} onChange={(e) => setStatusForm({ ...statusForm, changeNote: e.target.value })} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusOpen(false)}>Huy</Button>
          <Button variant="contained" onClick={updateStatus}>Cap nhat</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)}>
        {message ? <Alert severity={message.type}>{message.text}</Alert> : null}
      </Snackbar>
    </Stack>
  );
}
