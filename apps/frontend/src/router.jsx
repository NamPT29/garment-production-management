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

// Phase 3 Pages
import { SuppliersPage } from './pages/SuppliersPage.jsx';
import { MaterialsPage } from './pages/MaterialsPage.jsx';
import { WarehousesPage } from './pages/WarehousesPage.jsx';
import { WarehouseDetailPage } from './pages/WarehouseDetailPage.jsx';
import { BomsPage } from './pages/BomsPage.jsx';
import { BomFormPage } from './pages/BomFormPage.jsx';
import { BomDetailPage } from './pages/BomDetailPage.jsx';
import { InventoryPage } from './pages/InventoryPage.jsx';
import { InventoryTransactionsPage } from './pages/InventoryTransactionsPage.jsx';
import { InventoryTransactionDetailPage } from './pages/InventoryTransactionDetailPage.jsx';
import { ReceiptFormPage } from './pages/ReceiptFormPage.jsx';
import { IssueFormPage } from './pages/IssueFormPage.jsx';
import { AdjustmentFormPage } from './pages/AdjustmentFormPage.jsx';
import { MaterialRequirementPage } from './pages/MaterialRequirementPage.jsx';

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
        path: 'orders/:id/material-requirements',
        element: <MaterialRequirementPage />,
      },
      // Phase 3 Paths
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'materials',
        element: <MaterialsPage />,
      },
      {
        path: 'warehouses',
        element: <WarehousesPage />,
      },
      {
        path: 'warehouses/:id',
        element: <WarehouseDetailPage />,
      },
      {
        path: 'boms',
        element: <BomsPage />,
      },
      {
        path: 'boms/new',
        element: <BomFormPage mode="create" />,
      },
      {
        path: 'boms/:id',
        element: <BomDetailPage />,
      },
      {
        path: 'boms/:id/edit',
        element: <BomFormPage mode="edit" />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'inventory/transactions',
        element: <InventoryTransactionsPage />,
      },
      {
        path: 'inventory/transactions/:id',
        element: <InventoryTransactionDetailPage />,
      },
      {
        path: 'inventory/receipts/new',
        element: <ReceiptFormPage />,
      },
      {
        path: 'inventory/issues/new',
        element: <IssueFormPage />,
      },
      {
        path: 'inventory/adjustments/new',
        element: <AdjustmentFormPage />,
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
