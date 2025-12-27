import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Setup admin first (creates default admin if not exists)
      await api.post('/admin/setup');
      
      // Then login
      const response = await api.post('/admin/login', credentials);
      localStorage.setItem('admin_token', response.data.token);
      toast.success('Login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Sign in to manage your store</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username" className="text-[#0F172A]">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="mt-1"
                data-testid="input-username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#0F172A]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="mt-1"
                data-testid="input-password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-full py-6"
              disabled={loading}
              data-testid="login-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-[#F8FAFC] rounded-lg">
            <p className="text-sm text-[#64748B] text-center">
              <strong>Default credentials:</strong><br />
              Username: <code className="bg-gray-200 px-1 rounded">admin</code><br />
              Password: <code className="bg-gray-200 px-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
