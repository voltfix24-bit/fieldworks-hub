import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ProjectsPage from "@/pages/modules/ProjectsPage";
import ProjectForm from "@/pages/modules/ProjectForm";
import ProjectDetail from "@/pages/modules/ProjectDetail";
import MeasurementWorkspace from "@/pages/modules/MeasurementWorkspace";
import ProjectReport from "@/pages/modules/ProjectReport";
import ClientsPage from "@/pages/modules/ClientsPage";
import ClientForm from "@/pages/modules/ClientForm";
import ClientDetail from "@/pages/modules/ClientDetail";
import TechniciansPage from "@/pages/modules/TechniciansPage";
import TechnicianForm from "@/pages/modules/TechnicianForm";
import TechnicianDetail from "@/pages/modules/TechnicianDetail";
import EquipmentPage from "@/pages/modules/EquipmentPage";
import EquipmentForm from "@/pages/modules/EquipmentForm";
import EquipmentDetail from "@/pages/modules/EquipmentDetail";
import ReportsPage from "@/pages/modules/ReportsPage";
import SettingsIndex from "@/pages/settings/SettingsIndex";
import BrandingSettings from "@/pages/settings/BrandingSettings";
import UserProfile from "@/pages/settings/UserProfile";
import TenantOverview from "@/pages/settings/TenantOverview";
import PlanningPage from "@/pages/modules/PlanningPage";
import MeerPage from "@/pages/modules/MeerPage";
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
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<ProjectForm />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/:id/edit" element={<ProjectForm />} />
                <Route path="/projects/:id/measurements" element={<MeasurementWorkspace />} />
                <Route path="/projects/:id/report" element={<ProjectReport />} />

                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/new" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/clients/:id/edit" element={<ClientForm />} />

                <Route path="/technicians" element={<TechniciansPage />} />
                <Route path="/technicians/new" element={<TechnicianForm />} />
                <Route path="/technicians/:id" element={<TechnicianDetail />} />
                <Route path="/technicians/:id/edit" element={<TechnicianForm />} />

                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/equipment/new" element={<EquipmentForm />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/equipment/:id/edit" element={<EquipmentForm />} />

                <Route path="/reports" element={<ReportsPage />} />

                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/meer" element={<MeerPage />} />

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
