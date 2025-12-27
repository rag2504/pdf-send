import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, LayoutDashboard, BookOpen, FileText, ShoppingCart, 
  LogOut, Menu, X, TrendingUp, Package, Users, IndianRupee 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_subjects: 0,
    total_projects: 0,
    total_orders: 0,
    paid_orders: 0,
    total_revenue: 0,
    recent_orders: []
  });

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    try {
      await api.get('/admin/verify');
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Projects', path: '/admin/projects', icon: FileText },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className={`admin-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link to="/admin" className="flex items-center gap-2 text-white">
              <GraduationCap className="h-8 w-8" />
              <span className="font-heading font-bold">Admin Panel</span>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors ${
                  window.location.pathname === item.path ? 'bg-white/10 text-white' : ''
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#E2E8F0] h-16 flex items-center px-4 lg:px-8">
          <button 
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Dashboard</h1>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm" data-testid="stat-revenue">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-[#16A34A]" />
                </div>
                <TrendingUp className="h-5 w-5 text-[#16A34A]" />
              </div>
              <p className="text-sm text-[#64748B] mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(stats.total_revenue)}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm" data-testid="stat-orders">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-[#3B82F6]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.total_orders}</p>
              <p className="text-xs text-[#16A34A] mt-1">{stats.paid_orders} paid</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm" data-testid="stat-projects">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#F59E0B]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.total_projects}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm" data-testid="stat-subjects">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#F3E8FF] flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#9333EA]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] mb-1">Subjects</p>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.total_subjects}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <div className="p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-[#0F172A]">Recent Orders</h2>
                <Link to="/admin/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-4">Customer</th>
                    <th className="text-left px-6 py-4">Project</th>
                    <th className="text-left px-6 py-4">Amount</th>
                    <th className="text-left px-6 py-4">Status</th>
                    <th className="text-left px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    stats.recent_orders.map((order) => (
                      <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-[#0F172A]">{order.customer_name}</p>
                            <p className="text-sm text-[#64748B]">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#0F172A]">{order.project_title}</td>
                        <td className="px-6 py-4 font-mono font-medium">{formatPrice(order.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.payment_status === 'PAID' ? 'status-paid' : 
                            order.payment_status === 'FAILED' ? 'status-failed' : 'status-pending'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#64748B]">{formatDate(order.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
