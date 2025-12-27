import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Shield, Zap, BookOpen, GraduationCap, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HomePage() {
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
              <Link to="/subjects" className="text-[#64748B] hover:text-[#0F172A] font-medium transition-colors" data-testid="nav-subjects">
                Browse Projects
              </Link>
              <Link to="/admin/login" className="text-[#64748B] hover:text-[#0F172A] font-medium transition-colors" data-testid="nav-admin">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Get Your Academic Project
                <span className="block text-[#FACC15] mt-2">in Seconds</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-xl">
                Ready-made project PDFs for college students. Download instantly after payment. 
                No waiting, no hassle - just pure academic excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/subjects">
                  <Button 
                    size="lg" 
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    data-testid="hero-cta"
                  >
                    Browse Projects <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1682203533347-10b924b3c253?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" 
                alt="Student studying" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start" data-testid="trust-verified">
              <div className="trust-icon">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">100% Verified</h3>
                <p className="text-sm text-[#64748B]">Quality checked projects</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center" data-testid="trust-instant">
              <div className="trust-icon">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Instant Delivery</h3>
                <p className="text-sm text-[#64748B]">Download immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-end" data-testid="trust-secure">
              <div className="trust-icon">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Secure Payment</h3>
                <p className="text-sm text-[#64748B]">Safe & encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              How It Works
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto">
              Get your project in 3 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Choose Subject", desc: "Browse our collection of subjects and find your project", icon: BookOpen },
              { step: 2, title: "Make Payment", desc: "Secure payment via UPI, Cards or Net Banking", icon: Shield },
              { step: 3, title: "Download PDF", desc: "Instant download + email delivery", icon: Download },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-8 text-center shadow-sm border border-[#E2E8F0] card-hover" data-testid={`step-${item.step}`}>
                <div className="w-12 h-12 rounded-full bg-[#0F172A] text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <item.icon className="h-10 w-10 mx-auto mb-4 text-[#16A34A]" />
                <h3 className="font-heading text-xl font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-[#64748B]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Subjects */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              Popular Subjects
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto">
              Explore our most requested academic project categories
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Economics", icon: "📊", color: "from-blue-500 to-indigo-600" },
              { name: "Accountancy", icon: "📒", color: "from-green-500 to-emerald-600" },
              { name: "Business Studies", icon: "💼", color: "from-orange-500 to-red-600" },
              { name: "Physical Education", icon: "🏃", color: "from-purple-500 to-pink-600" },
            ].map((subject) => (
              <Link 
                key={subject.name} 
                to="/subjects" 
                className="subject-card bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm card-hover"
                data-testid={`subject-${subject.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="text-4xl mb-4">{subject.icon}</div>
                <h3 className="font-heading text-lg font-semibold text-[#0F172A]">{subject.name}</h3>
                <p className="text-sm text-[#64748B] mt-1">View projects →</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/subjects">
              <Button variant="outline" size="lg" className="rounded-full px-8" data-testid="view-all-subjects">
                View All Subjects <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />
              <span className="font-heading text-xl font-bold">Assign Your Assignment</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Assign Your Assignment. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
