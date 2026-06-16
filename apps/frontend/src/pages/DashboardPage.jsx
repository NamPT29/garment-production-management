import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const summaryCards = [
  { label: 'Don hang', value: '0', helper: 'Cho seed du lieu Phase 2' },
  { label: 'Ke hoach', value: '0', helper: 'Se ket noi API backend' },
  { label: 'Canh bao', value: '0', helper: 'Socket.IO o cac phase sau' },
  { label: 'AI baseline', value: '5', helper: 'Endpoint FastAPI da scaffold' },
];

const chartData = [
  { name: 'T2', output: 0 },
  { name: 'T3', output: 0 },
  { name: 'T4', output: 0 },
  { name: 'T5', output: 0 },
  { name: 'T6', output: 0 },
];

export function DashboardPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Dashboard tong quan
        </Typography>
        <Typography color="text.secondary">
          Khung giao dien ReactJS dau tien cho he thong quan ly san xuat xuong may.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {summaryCards.map((card) => (
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

      <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          San luong theo ngay
        </Typography>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="output" fill="#176b5b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Stack>
  );
}
