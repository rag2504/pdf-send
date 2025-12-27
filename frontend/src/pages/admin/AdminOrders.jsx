import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, LayoutDashboard, BookOpen, FileText, ShoppingCart, 
  LogOut, Menu, X, Loader2, Eye 
} from "lucide-react";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminOrders() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    try {
      await api.get('/admin/verify');
      await fetchOrders();
    } catch (error) {
      navigate('/admin/login');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Projects', path: '/admin/projects', icon: FileText },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  ];

  const paidOrders = orders.filter(o => o.payment_status === 'PAID');
  const pendingOrders = orders.filter(o => o.payment_status === 'PENDING');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

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
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-[#E2E8F0] h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Orders</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-sm text-[#64748B]">Total Orders</p>
              <p className="text-2xl font-bold text-[#0F172A]">{orders.length}</p>
            </div>
            <div className="bg-[#F0FDF4] rounded-xl p-4 border border-[#BBF7D0]">
              <p className="text-sm text-[#166534]">Paid Orders</p>
              <p className="text-2xl font-bold text-[#16A34A]">{paidOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-sm text-[#64748B]">Total Revenue</p>
              <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(totalRevenue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-4">Order ID</th>
                  <th className="text-left px-6 py-4">Customer</th>
                  <th className="text-left px-6 py-4">Project</th>
                  <th className="text-left px-6 py-4">Subject</th>
                  <th className="text-left px-6 py-4">Amount</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#64748B]">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-[#0F172A]">{order.order_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#0F172A]">{order.customer_name}</p>
                          <p className="text-sm text-[#64748B]">{order.customer_email}</p>
                          <p className="text-sm text-[#64748B]">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#0F172A]">{order.project_title}</td>
                      <td className="px-6 py-4 text-[#64748B]">{order.subject_name}</td>
                      <td className="px-6 py-4 font-mono font-medium text-[#0F172A]">{formatPrice(order.amount)}</td>
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
        </main>
      </div>
    </div>
  );
}
