import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      // Seed data first, then fetch subjects
      await api.post('/seed');
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <GraduationCap className="h-8 w-8 text-[#0F172A]" />
              <span className="font-heading text-xl font-bold text-[#0F172A]">Assign Your Assignment</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/subjects" className="text-[#0F172A] font-medium" data-testid="nav-subjects">
                Browse Projects
              </Link>
              <Link to="/admin/login" className="text-[#64748B] hover:text-[#0F172A] font-medium transition-colors" data-testid="nav-admin">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Browse Subjects</h1>
          <p className="text-gray-300">Choose a subject to explore available projects</p>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#64748B] text-lg">No subjects available yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/subjects/${subject.id}`}
                  className="subject-card bg-white rounded-xl p-8 border border-[#E2E8F0] shadow-sm card-hover group"
                  data-testid={`subject-card-${subject.id}`}
                >
                  <div className="text-5xl mb-6">{subject.icon}</div>
                  <h2 className="font-heading text-2xl font-bold text-[#0F172A] mb-2 group-hover:text-[#16A34A] transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-[#64748B] mb-4 line-clamp-2">
                    {subject.description || 'Explore projects in this subject'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#64748B]">
                      {subject.project_count} {subject.project_count === 1 ? 'project' : 'projects'}
                    </span>
                    <span className="text-[#16A34A] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      View <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <span className="font-heading font-bold">Assign Your Assignment</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
