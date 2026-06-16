import {
  Assignment,
  Business,
  CallMade,
  CallReceived,
  Category,
  Equalizer,
  Group,
  History,
  Home,
  Inventory2,
  Menu,
  Notifications,
  Person,
  SettingsSuggest,
  Warehouse,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const navigationGroups = [
  {
    title: 'Danh mục',
    items: [
      { label: 'Khách hàng', icon: <Group />, path: '/customers' },
      { label: 'Sản phẩm', icon: <Inventory2 />, path: '/products' },
      { label: 'Nhà cung cấp', icon: <Business />, path: '/suppliers' },
      { label: 'Nguyên phụ liệu', icon: <Category />, path: '/materials' },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { label: 'Đơn hàng', icon: <Assignment />, path: '/orders' },
    ],
  },
  {
    title: 'Kho và BOM',
    items: [
      { label: 'BOM sản phẩm', icon: <SettingsSuggest />, path: '/boms' },
      { label: 'Tồn kho', icon: <Equalizer />, path: '/inventory' },
      { label: 'Nhập kho', icon: <CallReceived />, path: '/inventory/receipts/new' },
      { label: 'Xuất kho', icon: <CallMade />, path: '/inventory/issues/new' },
      { label: 'Lịch sử kho', icon: <History />, path: '/inventory/transactions' },
      { label: 'Kho hàng', icon: <Warehouse />, path: '/warehouses' },
    ],
  },
];

export function AppShell() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fbfdfc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ 
          borderBottom: '1px solid #d9e1dd', 
          bgcolor: '#ffffff', 
          color: '#1d2b27', 
          zIndex: (theme) => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="Mo menu" sx={{ mr: 2 }}>
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Quản lý sản xuất xưởng may
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
            bgcolor: '#ffffff',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, pb: 1 }}>
          <ListItemButton
            component={Link}
            to="/"
            selected={location.pathname === '/'}
            sx={{
              borderRadius: '8px',
              mb: 1,
              bgcolor: location.pathname === '/' ? 'rgba(23, 107, 91, 0.08)' : 'transparent',
              color: location.pathname === '/' ? '#176b5b' : 'inherit',
              '&.Mui-selected': {
                bgcolor: 'rgba(23, 107, 91, 0.12)',
                color: '#176b5b',
                '&:hover': {
                  bgcolor: 'rgba(23, 107, 91, 0.16)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/' ? '#176b5b' : 'inherit' }}>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Tổng quan" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </Box>
        
        {navigationGroups.map((group) => (
          <List
            key={group.title}
            subheader={
              <ListSubheader 
                component="div" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#176b5b', 
                  bgcolor: 'transparent',
                  lineHeight: '32px',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  mt: 1,
                  px: 3
                }}
              >
                {group.title}
              </ListSubheader>
            }
            sx={{ px: 2, py: 0 }}
          >
            {group.items.map((item) => {
              const selected = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <ListItemButton
                  key={item.label}
                  component={Link}
                  to={item.path}
                  selected={selected}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    bgcolor: selected ? 'rgba(23, 107, 91, 0.08)' : 'transparent',
                    color: selected ? '#176b5b' : '#3c4b43',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(23, 107, 91, 0.12)',
                      color: '#176b5b',
                      '&:hover': {
                        bgcolor: 'rgba(23, 107, 91, 0.16)',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: selected ? '#176b5b' : '#6b7a70' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontSize: '0.9rem', 
                      fontWeight: selected ? 600 : 500 
                    }} 
                  />
                </ListItemButton>
              );
            })}
          </List>
        ))}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f8faf9', minHeight: '100vh' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
