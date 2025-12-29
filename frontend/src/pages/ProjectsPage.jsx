import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, ShoppingCart, Loader2, FileText } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function ProjectsPage() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      const [subjectRes, projectsRes] = await Promise.all([
        api.get(`/subjects/${subjectId}`),
        api.get(`/projects?subject_id=${subjectId}`)
      ]);
      setSubject(subjectRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <GraduationCap className="h-8 w-8 text-[#0F172A]" />
              <span className="font-heading text-xl font-bold text-[#0F172A]">Parul Creation</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/subjects" className="text-[#64748B] hover:text-[#0F172A] font-medium transition-colors" data-testid="nav-subjects">
                Browse Projects
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb & Header */}
      <section className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/subjects" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors" data-testid="back-link">
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{subject?.icon}</span>
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold">{subject?.name}</h1>
              <p className="text-gray-300 mt-1">{subject?.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {projects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
              <FileText className="h-16 w-16 mx-auto text-[#CBD5E1] mb-4" />
              <p className="text-[#64748B] text-lg">No projects available in this subject yet.</p>
              <Link to="/subjects">
                <Button variant="outline" className="mt-4">
                  Browse Other Subjects
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
                  Available Projects ({projects.length})
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden card-hover"
                    data-testid={`project-card-${project.id}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="h-10 w-10 text-[#16A34A]" />
                        <span className="badge-accent px-3 py-1 rounded-full text-sm font-medium">
                          PDF
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-[#64748B] text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                        <span className="price-tag text-2xl text-[#0F172A]">
                          {formatPrice(project.price)}
                        </span>
                        <Link to={`/checkout/${project.id}`}>
                          <Button className="btn-success rounded-full" data-testid={`buy-${project.id}`}>
                            <ShoppingCart className="h-4 w-4 mr-2" /> Buy Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <span className="font-heading font-bold">Parul Creation</span>
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
