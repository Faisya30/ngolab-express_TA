import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Header from '../admin/components/Header';
import Sidebar from '../admin/components/Sidebar';
import Auth from '../admin/components/Auth';
import ProductManagement from '../admin/components/ProductManagement';
import CategoryManagement from '../admin/components/CategoryManagement';
import TransactionList from '../admin/components/TransactionList';
import Reports from '../admin/components/Reports';
import { ViewType } from '../../types';
import { fetchFromSheet, API_ACTIONS } from '@ngolab/shared-lib';

const CVDashboard: React.FC = () => {
  const [currentView, setView] = useState<ViewType>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  // CV products should have product_type = 'cv'
  const adminProductType = 'cv';

  useEffect(() => {
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
      
      const categoryData = categoriesRes?.success ? categoriesRes.categories : categoriesRes;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      console.error('Failed to load CV dashboard data:', error);
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

  // Filter for CV products only
  const scopedProducts = products.filter((product: any) => 
    String(product?.product_type || '').toLowerCase() === 'cv'
  );

  const setCurrentView = (view: ViewType) => {
    setView(view);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={user} 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          onRefresh={handleRefresh}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 overflow-auto">
          {currentView === 'DASHBOARD' && (
            <Dashboard 
              orders={orders} 
              products={scopedProducts} 
              user={user}
            />
          )}
          {currentView === 'PRODUCTS' && (
            <ProductManagement 
              products={scopedProducts}
              categories={categories}
              onProductsChange={loadDashboardData}
              productType="cv"
            />
          )}
          {currentView === 'CATEGORIES' && (
            <CategoryManagement 
              categories={categories}
              onCategoriesChange={loadDashboardData}
            />
          )}
          {currentView === 'TRANSACTIONS' && (
            <TransactionList 
              orders={orders}
              orderDetails={orderDetails}
            />
          )}
          {currentView === 'REPORTS' && (
            <Reports 
              orders={orders}
              products={scopedProducts}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CVDashboard;
