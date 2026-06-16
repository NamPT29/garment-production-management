import { Assignment, Group, Home, Inventory2, Menu, Notifications, Person } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const navigationItems = [
  { label: 'Tong quan', icon: <Home />, path: '/' },
  { label: 'Khach hang', icon: <Group />, path: '/customers' },
  { label: 'San pham', icon: <Inventory2 />, path: '/products' },
  { label: 'Don hang', icon: <Assignment />, path: '/orders' },
];

export function AppShell() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ borderBottom: '1px solid #d9e1dd', bgcolor: '#ffffff', color: '#1d2b27' }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="Mo menu" sx={{ mr: 2 }}>
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Quan ly san xuat xuong may
          </Typography>
          <IconButton color="inherit" aria-label="Thong bao">
            <Notifications />
          </IconButton>
          <IconButton color="inherit" aria-label="Nguoi dung">
            <Person />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #d9e1dd',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Phase 2
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Khach hang, san pham va don hang
          </Typography>
        </Box>
        <Divider />
        <List>
          {navigationItems.map((item) => {
            const selected = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

            return (
            <ListItemButton key={item.label} component={Link} to={item.path} selected={selected}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
