import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './ui/AppShell.jsx';
import { CustomersPage } from './pages/CustomersPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { OrderDetailPage } from './pages/OrderDetailPage.jsx';
import { OrderFormPage } from './pages/OrderFormPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'orders/new',
        element: <OrderFormPage mode="create" />,
      },
      {
        path: 'orders/:id',
        element: <OrderDetailPage />,
      },
      {
        path: 'orders/:id/edit',
        element: <OrderFormPage mode="edit" />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);
