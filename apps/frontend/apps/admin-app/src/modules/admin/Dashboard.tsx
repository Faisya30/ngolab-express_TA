import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import TransactionList from './components/TransactionList';
import Reports from './components/Reports';
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
      const [ordersRes, orderDetailsRes, productsRes, categoriesRes] = await Promise.all([
        fetchFromSheet(API_ACTIONS.GET_ORDERS),
        fetchFromSheet(API_ACTIONS.GET_ORDER_DETAILS),
        fetchFromSheet(API_ACTIONS.GET_PRODUCTS),
        fetchFromSheet(API_ACTIONS.GET_CATEGORIES),
      ]);

      setOrders(normalizeRows(ordersRes));
      setOrderDetails(normalizeRows(orderDetailsRes));
      setProducts(normalizeRows(productsRes));
      setCategories(normalizeRows(categoriesRes));
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    }
  }, [normalizeRows]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
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
            />
          )}
          
          {currentView === 'CATEGORIES' && (
            <CategoryManagement 
              initialCategories={categories}
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
              initialTransactions={orders}
              allOrderDetails={orderDetails}
              onRefresh={handleRefresh}
            />
          )}
          
          {currentView === 'REPORTS' && (
            <Reports />
          )}
          
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
