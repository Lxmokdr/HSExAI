// React Router imports
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Third-party imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Local hook imports
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Local component imports
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Page imports
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import HardwareDashboard from "./pages/HardwareDashboard";
import SoftwareDashboard from "./pages/SoftwareDashboard";
import HardwareIncidents from "./pages/HardwareIncidents";
import SoftwareIncidents from "./pages/SoftwareIncidents";
import EditIncident from "./pages/EditIncident";
import AddReport from "./pages/AddReport";
import History from "./pages/History";
import HistoryHardware from "./pages/HistoryHardware";
import HistorySoftware from "./pages/HistorySoftware";
import Equipment from "./pages/Equipment";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute requirePermission="canAccessDashboards">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/hardware" 
          element={
            <ProtectedRoute requirePermission="canAccessDashboards">
              <HardwareDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/software" 
          element={
            <ProtectedRoute requirePermission="canAccessDashboards">
              <SoftwareDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hardware" 
          element={
            <ProtectedRoute requirePermission="canAccessHardwareIncidents">
              <HardwareIncidents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/software" 
          element={
            <ProtectedRoute requireAny={['canAccessSoftwareIncidents', 'canModifySoftwareIncidents']}>
              <SoftwareIncidents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/equipment" 
          element={
            <ProtectedRoute requirePermission="canAccessEquipment">
              <Equipment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/incident/edit/:id" 
          element={
            <ProtectedRoute requireAny={['canModifyHardwareIncidents', 'canModifySoftwareIncidents']}>
              <EditIncident />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/software/report/:id" 
          element={
            <ProtectedRoute requirePermission="canAccessReports">
              <AddReport />
            </ProtectedRoute>
          } 
        />
        <Route path="/history" element={<History />} />
        <Route 
          path="/history/hardware" 
          element={
            <ProtectedRoute requirePermission="canAccessHardwareIncidents">
              <HistoryHardware />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history/software" 
          element={
            <ProtectedRoute requirePermission="canAccessSoftwareIncidents">
              <HistorySoftware />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requirePermission="canAccessReports">
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requirePermission="isSuperadmin">
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
