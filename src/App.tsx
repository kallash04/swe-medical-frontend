import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// User pages
import Doctors from "./pages/user/Doctors";
import Record from "./pages/user/Record";
import History from "./pages/user/History";
import ChangePassword from "./pages/user/ChangePassword";

// Doctor pages
import Patients from "./pages/doctor/Patients";
import Appointments from "./pages/doctor/Appointments";

// Admin pages
import Users from "./pages/admin/Users";
import AdminDoctors from "./pages/admin/Doctors";
import Unassigned from "./pages/admin/Unassigned";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* User routes */}
            <Route 
              path="/doctors" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Doctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/record" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Record />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />

            {/* Doctor routes */}
            <Route 
              path="/patients" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Patients />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Appointments />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/doctors" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDoctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/unassigned" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Unassigned />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
