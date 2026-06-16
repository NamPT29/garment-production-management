import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './ui/AppShell.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);
