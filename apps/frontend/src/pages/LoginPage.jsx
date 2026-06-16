import { LockOutlined } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

export function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ identifier, password });
      navigate('/');
    } catch (loginError) {
      setError(loginError.response?.data?.message ?? 'Dang nhap that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Stack spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <LockOutlined />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Dang nhap
            </Typography>
            <Typography color="text.secondary">Su dung tai khoan development da seed.</Typography>
          </Box>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Username hoac email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Mat khau"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
          />
          <Button variant="contained" size="large" type="submit" disabled={loading}>
            {loading ? 'Dang xu ly...' : 'Dang nhap'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
