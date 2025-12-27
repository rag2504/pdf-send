import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  GraduationCap, LayoutDashboard, BookOpen, FileText, ShoppingCart, 
  LogOut, Menu, X, Plus, Pencil, Trash2, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AdminSubjects() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '📚' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    try {
      await api.get('/admin/verify');
      await fetchSubjects();
    } catch (error) {
      navigate('/admin/login');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, formData);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', formData);
        toast.success('Subject created successfully');
      }
      setDialogOpen(false);
      setEditingSubject(null);
      setFormData({ name: '', description: '', icon: '📚' });
      await fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description, icon: subject.icon });
    setDialogOpen(true);
  };

  const handleDelete = async (subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    try {
      await api.delete(`/subjects/${subject.id}`);
      toast.success('Subject deleted successfully');
      await fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete subject');
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

  const icons = ['📚', '📊', '📒', '💼', '🏃', '💻', '🔬', '📐', '🎨', '🌍', '📖', '🧮'];

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
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Subjects</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#64748B]">{subjects.length} subjects</p>
            <Button 
              onClick={() => { setEditingSubject(null); setFormData({ name: '', description: '', icon: '📚' }); setDialogOpen(true); }}
              className="bg-[#0F172A] hover:bg-[#1E293B]"
              data-testid="add-subject-btn"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Subject
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-4">Subject</th>
                  <th className="text-left px-6 py-4">Description</th>
                  <th className="text-left px-6 py-4">Projects</th>
                  <th className="text-left px-6 py-4">Created</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                      No subjects yet. Add your first subject.
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{subject.icon}</span>
                          <span className="font-medium text-[#0F172A]">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#64748B] max-w-xs truncate">{subject.description}</td>
                      <td className="px-6 py-4 text-[#0F172A]">{subject.project_count}</td>
                      <td className="px-6 py-4 text-[#64748B]">{formatDate(subject.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)} data-testid={`edit-${subject.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(subject)} data-testid={`delete-${subject.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-colors ${
                      formData.icon === icon ? 'border-[#0F172A] bg-[#F8FAFC]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science"
                className="mt-1"
                required
                data-testid="input-subject-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the subject"
                className="mt-1"
                rows={3}
                data-testid="input-subject-desc"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#0F172A]" data-testid="save-subject-btn">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingSubject ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
