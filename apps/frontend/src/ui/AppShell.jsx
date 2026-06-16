import { Factory, Home, Menu, Notifications, Person, Settings } from '@mui/icons-material';
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
import { Outlet } from 'react-router-dom';

const drawerWidth = 280;

const navigationItems = [
  { label: 'Tong quan', icon: <Home /> },
  { label: 'San xuat', icon: <Factory /> },
  { label: 'Cau hinh', icon: <Settings /> },
];

export function AppShell() {
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
            Phase 1
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nen tang ung dung ReactJS
          </Typography>
        </Box>
        <Divider />
        <List>
          {navigationItems.map((item) => (
            <ListItemButton key={item.label} selected={item.label === 'Tong quan'}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
