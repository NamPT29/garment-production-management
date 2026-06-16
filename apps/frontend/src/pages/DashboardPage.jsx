import { Alert, Box, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { orderService } from '../services/orderService.js';
import { inventoryService } from '../services/inventoryService.js';

const statusLabels = {
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  PLANNED: 'Đã lập KH',
  IN_PRODUCTION: 'Đang SX',
  QUALITY_CHECK: 'Kiểm hàng',
  COMPLETED: 'Hoàn tất',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const txTypeLabels = {
  RECEIPT: 'Nhập kho',
  ISSUE: 'Xuất kho',
  ADJUSTMENT_IN: 'Đ/C tăng',
  ADJUSTMENT_OUT: 'Đ/C giảm',
};

const COLORS = ['#176b5b', '#d32f2f', '#f5a623', '#4a90e2'];

export function DashboardPage() {
  const [orderSummary, setOrderSummary] = useState(null);
  const [invSummary, setInvSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersData, invData] = await Promise.all([
          orderService.summary(),
          inventoryService.getDashboardSummary(),
        ]);
        setOrderSummary(ordersData);
        setInvSummary(invData.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message ?? 'Không tải được dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const orderCards = [
    { label: 'Tổng đơn hàng', value: orderSummary?.totalOrders ?? 0, helper: 'Tất cả đơn hàng' },
    { label: 'Đang sản xuất', value: orderSummary?.inProduction ?? 0, helper: 'Trang thái Đang SX' },
    { label: 'Sắp đến hạn', value: orderSummary?.dueSoon ?? 0, helper: 'Giao trong 7 ngày' },
    { label: 'Đã giao', value: orderSummary?.delivered ?? 0, helper: 'Đơn hàng hoàn tất' },
  ];

  const invCards = [
    { label: 'Tổng số nguyên phụ liệu', value: invSummary?.totalMaterials ?? 0, helper: 'Nguyên phụ liệu hoạt động' },
    { label: 'NPL dưới mức tối thiểu', value: invSummary?.lowStockMaterials ?? 0, helper: 'Cần nhập hàng gấp', isAlert: (invSummary?.lowStockMaterials ?? 0) > 0 },
    { label: 'Tổng số kho hàng', value: invSummary?.totalWarehouses ?? 0, helper: 'Kho lưu trữ hiện tại' },
    { label: 'Phiếu nhập trong tháng', value: invSummary?.receiptsThisMonth ?? 0, helper: 'Đã ghi sổ' },
    { label: 'Phiếu xuất trong tháng', value: invSummary?.issuesThisMonth ?? 0, helper: 'Đã ghi sổ' },
  ];

  const orderChartData = (orderSummary?.byStatus ?? []).map((item) => ({
    name: statusLabels[item.status] ?? item.status,
    value: item.total,
  }));

  const invChartData = (invSummary?.txByType ?? []).map((item) => ({
    name: txTypeLabels[item.name] ?? item.name,
    value: item.value,
  }));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Dashboard Tổng quan
        </Typography>
        <Typography color="text.secondary">
          Hệ thống theo dõi tiến độ đơn hàng và cân đối tồn kho xưởng may mặc.
        </Typography>
      </Box>

      {loading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Thống kê Đơn hàng (Phase 2)
      </Typography>
      <Grid container spacing={2}>
        {orderCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ my: 1, fontWeight: 800, color: '#176b5b' }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.helper}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 700, mt: 3 }}>
        Thống kê Tồn kho & Vật tư (Phase 3)
      </Typography>
      <Grid container spacing={2}>
        {invCards.map((card) => (
          <Grid item xs={12} sm={6} lg={2.4} key={card.label}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%', 
                bgcolor: card.isAlert ? '#fff5f5' : 'inherit',
                borderColor: card.isAlert ? '#ffcdd2' : 'inherit'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  my: 1, 
                  fontWeight: 800, 
                  color: card.isAlert ? '#d32f2f' : '#333333' 
                }}
              >
                {card.value}
              </Typography>
              <Typography variant="caption" color={card.isAlert ? 'error.main' : 'text.secondary'}>
                {card.helper}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Đơn hàng theo trạng thái
            </Typography>
            {orderChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#176b5b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '85%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                Chưa có dữ liệu đơn hàng
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Giao dịch kho theo loại (Đã ghi sổ)
            </Typography>
            {invChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={invChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {invChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '85%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                Chưa có dữ liệu giao dịch kho
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
