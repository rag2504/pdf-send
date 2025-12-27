import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Loader2, Shield, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Project not found');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(formData.customer_phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/payments/create-order', {
        ...formData,
        project_id: projectId
      });

      if (response.data.payment_session_id) {
        // Redirect to Cashfree payment page
        const cashfreeUrl = `https://sandbox.cashfree.com/pg/view/order/${response.data.payment_session_id}`;
        window.location.href = cashfreeUrl;
      } else {
        // Fallback: Mark as paid for demo (when Cashfree keys not configured)
        toast.info('Payment gateway not configured. Simulating successful payment...');
        setTimeout(() => {
          navigate(`/payment-status?order_id=${response.data.order_id}&demo=true`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setSubmitting(false);
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
              <span className="font-heading text-xl font-bold text-[#0F172A]">Assign Your Assignment</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Checkout Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to={`/subjects/${project?.subject_id}`} 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
            data-testid="back-link"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm h-fit">
              <h2 className="font-heading text-xl font-bold text-[#0F172A] mb-6">Order Summary</h2>
              
              <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg mb-6">
                <FileText className="h-12 w-12 text-[#16A34A] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{project?.title}</h3>
                  <p className="text-sm text-[#64748B] mb-2">{project?.subject_name}</p>
                  <span className="badge-accent px-2 py-0.5 rounded text-xs font-medium">PDF</span>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#64748B]">Project Price</span>
                  <span className="font-medium">{formatPrice(project?.price)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
                  <span className="font-semibold text-[#0F172A]">Total</span>
                  <span className="price-tag text-2xl text-[#0F172A]">{formatPrice(project?.price)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#F0FDF4] rounded-lg">
                <div className="flex items-center gap-2 text-[#16A34A]">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Secure Checkout</span>
                </div>
                <p className="text-sm text-[#166534] mt-1">
                  Your payment is protected with bank-grade encryption
                </p>
              </div>
            </div>

            {/* Customer Form */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-[#0F172A] mb-6">Your Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="customer_name" className="text-[#0F172A]">Full Name</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    placeholder="Enter your full name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="mt-1"
                    data-testid="input-name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_email" className="text-[#0F172A]">Email Address</Label>
                  <Input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    className="mt-1"
                    data-testid="input-email"
                    required
                  />
                  <p className="text-xs text-[#64748B] mt-1">PDF will be sent to this email</p>
                </div>

                <div>
                  <Label htmlFor="customer_phone" className="text-[#0F172A]">Phone Number</Label>
                  <Input
                    id="customer_phone"
                    name="customer_phone"
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="mt-1"
                    data-testid="input-phone"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-success rounded-full py-6 text-lg mt-6"
                  disabled={submitting}
                  data-testid="pay-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay {formatPrice(project?.price)}
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4 text-[#64748B] text-sm">
                <span>Powered by</span>
                <span className="font-semibold">Cashfree</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
