import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import TransactionList from './components/TransactionList';
import { ViewType } from '../../types';
import { fetchFromSheet, API_ACTIONS } from '@ngolab/shared-lib';
import { getProductTypeFromRole } from './utils/productScope';

const AdminDashboard: React.FC = () => {
  const [currentView, setView] = useState<ViewType>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Data dummy - nanti ganti dengan API calls
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const adminProductType = getProductTypeFromRole(user?.role);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('current_admin');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const normalizeRows = useCallback((payload: any) => {
    const rows = Array.isArray(payload)
      ? payload
      : payload?.data || payload?.rows || payload?.result || payload?.items || [];

    if (!Array.isArray(rows)) return [];

    return rows.map((row: any) => {
      if (!row || typeof row !== 'object') return row;
      const normalized: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[String(key).toLowerCase().trim()] = value;
      });
      return normalized;
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/kiosk/admin/dashboard?period=${period}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Gagal mengambil dashboard data');
      }

      setOrders(normalizeRows(data.orders || []));
      setOrderDetails(normalizeRows(data.orderDetails || []));
      setProducts(normalizeRows(data.products || []));

      const categoriesRes = await fetchFromSheet(API_ACTIONS.GET_CATEGORIES);
      const categoryData = categoriesRes?.success ? categoriesRes.categories : categoriesRes;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    }
  }, [normalizeRows, period]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadDashboardData]);
  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('current_admin');
    setCurrentView('DASHBOARD');
  };

  const handleRefresh = async () => {
    console.log('[SYNC BUTTON DIKLIK]');
    await loadDashboardData();
  };

  const scopedProducts = adminProductType
    ? products.filter((product: any) => String(product?.product_type || '').toLowerCase() === adminProductType)
    : products;

  const setCurrentView = (view: ViewType) => {
    setView(view);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="ml-64 min-w-0 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <Header currentView={currentView} user={user} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {currentView === 'DASHBOARD' && (
            <Dashboard
              orders={orders}
              orderDetails={orderDetails}
              products={products}
              onRefresh={handleRefresh}
              period={period}
              setPeriod={setPeriod}
            />
          )}

          {currentView === 'CATEGORIES' && (
            <CategoryManagement
              initialCategories={categories}
              products={products}
              onUpdate={handleRefresh}
            />
          )}

          {currentView === 'PRODUCTS' && (
            <ProductManagement
              initialProducts={scopedProducts}
              categories={categories}
              onUpdate={handleRefresh}
              adminProductType={adminProductType}
            />
          )}

          {currentView === 'TRANSACTIONS' && (
            <TransactionList
              orders={orders}
              orderDetails={orderDetails}
              onRefresh={handleRefresh}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
