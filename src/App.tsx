import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ModalProvider } from "@/contexts/ModalContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { GlobalModalRenderer } from "@/components/modals";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SharedLayout } from "@/components/layout/SharedLayout";
import Dashboard from "./pages/Dashboard";
import Strategy from "./pages/Strategy";
import Marketplaces from "./pages/Marketplaces";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Shipping from "./pages/Shipping";
import Commissions from "./pages/Commissions";
import FixedFees from "./pages/FixedFees";
import Sales from "./pages/Sales";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/AdminDashboard";
import AssistantsManagement from "./pages/admin/AssistantsManagement";
import NotFound from "./pages/NotFound";
import AdGenerator from "./pages/AdGenerator";
import MLIntegration from "./pages/MLIntegration";
import MLCallback from "./pages/MLCallback";
import MLDashboard from "./pages/MLDashboard";
import { MLDashboardModern } from "./components/ml/MLDashboardModern";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // CRÍTICO: 15 minutos para evitar requests excessivos
      retry: false, // Completamente desabilitar retry automático
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Desabilitar polling automático
      enabled: true, // IMPORTANTE: Garantir que queries são habilitadas por padrão
      gcTime: 30 * 60 * 1000, // 30 minutos de cache para evitar re-requests
    },
    mutations: {
      retry: false, // Também desabilitar retry em mutations
      gcTime: 5 * 60 * 1000, // 5 minutos de cache para mutations
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <ModalProvider>
                <GlobalModalRenderer />
            <Routes>
            {/* Auth route - now inside AuthProvider context */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Price Pilot Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Dashboard />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/strategy" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Strategy />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplaces" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Marketplaces />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Categories />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Products />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shipping" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Shipping />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/commissions" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Commissions />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fixed-fees" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <FixedFees />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sales" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Sales />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Pricing />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ad-generator" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <AdGenerator />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/integrations/mercado-livre" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <MLIntegration />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/integrations/mercado-livre/callback" 
              element={
                <ProtectedRoute>
                  <MLCallback />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ml-dashboard" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <MLDashboardModern />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ml-dashboard-legacy" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <MLDashboard />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Account Routes */}
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Subscription />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SharedLayout>
                  <AdminDashboard />
                </SharedLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/assistentes-ia" 
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SharedLayout>
                  <AssistantsManagement />
                </SharedLayout>
              </ProtectedRoute>
            } 
          />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
              </ModalProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
