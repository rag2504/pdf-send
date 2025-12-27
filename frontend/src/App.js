import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// User Pages
import HomePage from "@/pages/HomePage";
import SubjectsPage from "@/pages/SubjectsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentStatusPage from "@/pages/PaymentStatusPage";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSubjects from "@/pages/admin/AdminSubjects";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminOrders from "@/pages/admin/AdminOrders";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:subjectId" element={<ProjectsPage />} />
          <Route path="/checkout/:projectId" element={<CheckoutPage />} />
          <Route path="/payment-status" element={<PaymentStatusPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
