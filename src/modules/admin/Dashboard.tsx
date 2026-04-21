import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import VoucherManagement from './components/VoucherManagement';
import TransactionList from './components/TransactionList';
import MemberPoints from './components/MemberPoints';
import Reports from './components/Reports';
import { ViewType } from '../../types';
import { fetchFromSheet } from '../../shared/services/api';
import { API_ACTIONS } from '../../shared/constants';

const AdminDashboard: React.FC = () => {
  const [currentView, setView] = useState<ViewType>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Data dummy - nanti ganti dengan API calls
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberLogs, setMemberLogs] = useState<any[]>([]);

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
      const [ordersRes, orderDetailsRes, productsRes, categoriesRes, vouchersRes, membersRes, memberLogsRes] = await Promise.all([
        fetchFromSheet(API_ACTIONS.GET_ORDERS),
        fetchFromSheet(API_ACTIONS.GET_ORDER_DETAILS),
        fetchFromSheet(API_ACTIONS.GET_PRODUCTS),
        fetchFromSheet(API_ACTIONS.GET_CATEGORIES),
        fetchFromSheet(API_ACTIONS.GET_VOUCHERS),
        fetchFromSheet(API_ACTIONS.GET_MEMBERS),
        fetchFromSheet(API_ACTIONS.GET_MEMBER_LOGS),
      ]);

      setOrders(normalizeRows(ordersRes));
      setOrderDetails(normalizeRows(orderDetailsRes));
      setProducts(normalizeRows(productsRes));
      setCategories(normalizeRows(categoriesRes));
      setVouchers(normalizeRows(vouchersRes));
      setMembers(normalizeRows(membersRes));
      setMemberLogs(normalizeRows(memberLogsRes));
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
              initialProducts={products}
              categories={categories}
              onUpdate={handleRefresh}
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
          
          {currentView === 'VOUCHERS' && (
            <VoucherManagement 
              initialVouchers={vouchers}
              onUpdate={handleRefresh}
            />
          )}
          
          {currentView === 'MEMBER_LOG' && (
            <MemberPoints 
              members={members}
              rawLogs={memberLogs}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
