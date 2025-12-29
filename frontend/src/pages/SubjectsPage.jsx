import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, ArrowRight, Loader2, Search } from "lucide-react";
import api from "@/lib/api";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = allProjects.filter(project => 
        project.title.toLowerCase().includes(query) || 
        project.description.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setFilteredProjects([]);
    }
  }, [searchQuery, allProjects]);

  const fetchSubjects = async () => {
    try {
      // Seed data first, then fetch subjects
      await api.post('/seed');
      const response = await api.get('/subjects');
      setSubjects(response.data);
      
      // Fetch all projects for search functionality
      const projectsRes = await api.get('/projects');
      setAllProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
              <span className="font-heading text-xl font-bold text-[#0F172A]">Parul Creation</span>
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">Browse Subjects & Projects</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white text-[#0F172A] placeholder-gray-400 rounded-lg border-none"
            />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
            </div>
          ) : showSearchResults ? (
            // Search Results
            <>
              <h2 className="font-heading text-2xl font-bold text-[#0F172A] mb-8">
                Search Results ({filteredProjects.length})
              </h2>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
                  <p className="text-[#64748B] text-lg">No projects found matching your search.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden card-hover"
                      data-testid={`search-project-${project.id}`}
                    >
                      <div className="p-6">
                        <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-2 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-[#64748B] text-sm mb-4 line-clamp-3">
                          {project.description}
                        </p>
                        <div className="text-xs text-[#64748B] mb-4">
                          <span className="badge-accent px-2 py-1 rounded-full text-xs font-medium">
                            {project.subject_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                          <span className="price-tag text-2xl text-[#0F172A]">
                            ₹{project.price}
                          </span>
                          <Link to={`/checkout/${project.id}`}>
                            <Button className="btn-success rounded-full text-sm">
                              Buy Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : subjects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#64748B] text-lg">No subjects available yet.</p>
            </div>
          ) : (
            // Browse Subjects
            <>
              <h2 className="font-heading text-2xl font-bold text-[#0F172A] mb-8">Browse Subjects</h2>
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
