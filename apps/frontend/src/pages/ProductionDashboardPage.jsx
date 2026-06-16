import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { productionProgressService } from '../services/productionProgressService.js';

export function ProductionDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lineEfficiency, setLineEfficiency] = useState([]);
  const [workerProductivity, setWorkerProductivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const sumRes = await productionProgressService.getDashboardSummary();
      setSummary(sumRes.data);

      const lineRes = await productionProgressService.getLineEfficiency();
      setLineEfficiency(lineRes.data);

      const workerRes = await productionProgressService.getWorkerProductivity();
      setWorkerProductivity(workerRes.data);
    } catch (err) {
      console.error('Không tải được báo cáo dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const kpis = [
    { label: 'Lệnh sản xuất hoạt động', value: summary?.activeOrders ?? 0, color: '#1976d2' },
    { label: 'Lệnh hoàn thành (Tháng này)', value: summary?.completedOrdersThisMonth ?? 0, color: '#2e7d32' },
    { label: 'Sản lượng đạt (Hôm nay)', value: summary?.todayGood ?? 0, color: '#176b5b' },
    { label: 'Sản phẩm lỗi (Hôm nay)', value: summary?.todayDefect ?? 0, color: '#d32f2f' },
    { label: 'Tỷ lệ lỗi tổng thể', value: `${summary?.defectRatePercent ?? 0}%`, color: '#ed6c02' },
    { label: 'Số lệnh chậm trễ', value: summary?.overdueOrders ?? 0, color: '#d32f2f' },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Dashboard điều hành sản xuất
        </Typography>
        <Typography color="text.secondary">
          Báo cáo hiệu suất chuyền may, năng suất lao động cá nhân và tổng quan sản lượng toàn xưởng.
        </Typography>
      </Box>

      {/* KPI Grid */}
      <Grid container spacing={3}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card variant="outlined" sx={{ p: 3, borderLeft: `5px solid ${kpi.color}` }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {kpi.label}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: kpi.color }}>
                {kpi.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3}>
        {/* Line efficiency Chart */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              So sánh hiệu suất chuyền may (%)
            </Typography>
            {lineEfficiency.length === 0 ? (
              <Typography color="text.secondary">Chưa có dữ liệu hiệu suất chuyền.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={lineEfficiency} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lineCode" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar name="Hiệu suất chuyền" dataKey="efficiencyPercent" fill="#176b5b" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Worker Productivity Chart */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Top 10 nhân sự có năng suất may cao nhất (%)
            </Typography>
            {workerProductivity.length === 0 ? (
              <Typography color="text.secondary">Chưa có dữ liệu năng suất thợ may.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={workerProductivity.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="%" />
                    <YAxis type="category" dataKey="fullName" width={100} style={{ fontSize: '0.8rem' }} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar name="Tỷ lệ năng suất" dataKey="productivityPercent" fill="#1976d2" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
