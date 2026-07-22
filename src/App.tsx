/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { MainLayout } from "./Layout";
import { Home } from "./pages/Home";
import { WeeklyMenu } from "./pages/WeeklyMenu";
import { Plans } from "./pages/Plans";
import { About } from "./pages/About";
import { Gallery } from "./pages/Gallery";
import { Specials } from "./pages/Specials";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { ResetPassword } from "./pages/ResetPassword";
import { Profile } from "./pages/Profile";
import { AddChild } from "./pages/AddChild";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminParents } from "./pages/admin/AdminParents";
import { AdminTeachers } from "./pages/admin/AdminTeachers";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AdminMenu } from "./pages/admin/AdminMenu";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminOffers } from "./pages/admin/AdminOffers";
import { AdminSales } from "./pages/admin/AdminSales";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-center" containerStyle={{ zIndex: 999999 }} toastOptions={{
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                fontSize: '11px',
                padding: '8px 12px',
                borderRadius: '10px',
                maxWidth: 'calc(100vw - 32px)',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } }
            }} />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="menu" element={<Navigate to="/weekly-menu" replace />} />
                <Route path="weekly-menu" element={<WeeklyMenu />} />
                <Route path="plans" element={<Plans />} />
                <Route path="about" element={<About />} />
                <Route path="specials" element={<Specials />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="login" element={<Login />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="profile" element={<Profile />} />
                <Route path="add-child" element={<AddChild />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="menu" element={<AdminMenu />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="teachers" element={<AdminTeachers />} />
                  <Route path="parents" element={<AdminParents />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="orders" element={<AdminOrders />} />
                  </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

