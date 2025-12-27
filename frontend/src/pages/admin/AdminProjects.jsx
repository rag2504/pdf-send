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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GraduationCap, LayoutDashboard, BookOpen, FileText, ShoppingCart, 
  LogOut, Menu, X, Plus, Pencil, Trash2, Loader2, Upload 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminProjects() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', subject_id: '', price: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    try {
      await api.get('/admin/verify');
      await Promise.all([fetchProjects(), fetchSubjects()]);
    } catch (error) {
      navigate('/admin/login');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingProject && !file) {
      toast.error('Please upload a PDF file');
      return;
    }

    setSaving(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('subject_id', formData.subject_id);
      formDataObj.append('price', formData.price);
      if (file) {
        formDataObj.append('file', file);
      }

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Project created successfully');
      }
      
      setDialogOpen(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', subject_id: '', price: '' });
      setFile(null);
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({ 
      title: project.title, 
      description: project.description, 
      subject_id: project.subject_id, 
      price: project.price.toString() 
    });
    setFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return;

    try {
      await api.delete(`/projects/${project.id}`);
      toast.success('Project deleted successfully');
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
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
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Projects</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#64748B]">{projects.length} projects</p>
            <Button 
              onClick={() => { setEditingProject(null); setFormData({ title: '', description: '', subject_id: '', price: '' }); setFile(null); setDialogOpen(true); }}
              className="bg-[#0F172A] hover:bg-[#1E293B]"
              data-testid="add-project-btn"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Project
            </Button>
          </div>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
              <p className="text-[#64748B] mb-4">Please create a subject first before adding projects.</p>
              <Link to="/admin/subjects">
                <Button>Go to Subjects</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-4">Project</th>
                    <th className="text-left px-6 py-4">Subject</th>
                    <th className="text-left px-6 py-4">Price</th>
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
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                        No projects yet. Add your first project.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-[#16A34A]" />
                            <div>
                              <p className="font-medium text-[#0F172A]">{project.title}</p>
                              <p className="text-sm text-[#64748B] truncate max-w-xs">{project.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#0F172A]">{project.subject_name}</td>
                        <td className="px-6 py-4 font-mono font-medium text-[#0F172A]">{formatPrice(project.price)}</td>
                        <td className="px-6 py-4 text-[#64748B]">{formatDate(project.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(project)} data-testid={`edit-${project.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(project)} data-testid={`delete-${project.id}`}>
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
          )}
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Library Management System"
                className="mt-1"
                required
                data-testid="input-project-title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the project"
                className="mt-1"
                rows={3}
                required
                data-testid="input-project-desc"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                <SelectTrigger className="mt-1" data-testid="select-subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.icon} {subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 100"
                className="mt-1"
                required
                data-testid="input-project-price"
              />
            </div>
            <div>
              <Label>PDF File {editingProject && '(Leave empty to keep current)'}</Label>
              <div className="mt-1 border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center hover:border-[#CBD5E1] transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                  data-testid="input-file"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-[#64748B] mb-2" />
                  <p className="text-sm text-[#64748B]">
                    {file ? file.name : 'Click to upload PDF'}
                  </p>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#0F172A]" data-testid="save-project-btn">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingProject ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
