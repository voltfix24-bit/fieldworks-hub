import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ProjectsPage from "@/pages/modules/ProjectsPage";
import ClientsPage from "@/pages/modules/ClientsPage";
import TechniciansPage from "@/pages/modules/TechniciansPage";
import EquipmentPage from "@/pages/modules/EquipmentPage";
import ReportsPage from "@/pages/modules/ReportsPage";
import SettingsIndex from "@/pages/settings/SettingsIndex";
import BrandingSettings from "@/pages/settings/BrandingSettings";
import UserProfile from "@/pages/settings/UserProfile";
import TenantOverview from "@/pages/settings/TenantOverview";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/technicians" element={<TechniciansPage />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsIndex />} />
                <Route path="/settings/branding" element={<BrandingSettings />} />
                <Route path="/settings/profile" element={<UserProfile />} />
                <Route path="/settings/tenant" element={<TenantOverview />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
