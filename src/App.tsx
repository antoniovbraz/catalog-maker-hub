import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Dashboard />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
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
              path="/estrategia" 
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
              path="/categorias" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Categories />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Products />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/frete" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Shipping />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comissoes" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Commissions />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/taxas-fixas" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <FixedFees />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendas" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Sales />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/precificacao" 
              element={
                <ProtectedRoute>
                  <SharedLayout>
                    <Pricing />
                  </SharedLayout>
                </ProtectedRoute>
              } 
            />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
