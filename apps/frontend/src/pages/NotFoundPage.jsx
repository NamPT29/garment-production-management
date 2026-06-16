import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Paper variant="outlined" sx={{ p: 4 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Khong tim thay trang</Typography>
        <Typography color="text.secondary">Duong dan nay chua co trong he thong.</Typography>
        <Button component={Link} to="/" variant="contained">Ve dashboard</Button>
      </Stack>
    </Paper>
  );
}
