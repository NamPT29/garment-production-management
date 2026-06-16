import { Alert, Box, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { orderService } from '../services/orderService.js';

const statusLabels = {
  DRAFT: 'Nhap',
  CONFIRMED: 'Da xac nhan',
  PLANNED: 'Da lap KH',
  IN_PRODUCTION: 'Dang SX',
  QUALITY_CHECK: 'Kiem hang',
  COMPLETED: 'Hoan tat',
  DELIVERED: 'Da giao',
  CANCELLED: 'Da huy',
};

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await orderService.summary();
        setSummary(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message ?? 'Khong tai duoc du lieu dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const cards = [
    { label: 'Tong don hang', value: summary?.totalOrders ?? 0, helper: 'Tat ca don hang dang quan ly' },
    { label: 'Dang san xuat', value: summary?.inProduction ?? 0, helper: 'Trang thai IN_PRODUCTION' },
    { label: 'Sap den han', value: summary?.dueSoon ?? 0, helper: 'Ngay giao trong 7 ngay toi' },
    { label: 'Da giao', value: summary?.delivered ?? 0, helper: 'Don hang da ban giao' },
  ];

  const chartData = (summary?.byStatus ?? []).map((item) => ({
    name: statusLabels[item.status] ?? item.status,
    value: item.total,
  }));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Dashboard tong quan
        </Typography>
        <Typography color="text.secondary">
          Theo doi nhanh tinh hinh don hang san xuat trong xuong may.
        </Typography>
      </Box>

      {loading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ my: 1, fontWeight: 800 }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.helper}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, height: 360 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Don hang theo trang thai
        </Typography>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#176b5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ height: '85%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            Chua co du lieu don hang
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
