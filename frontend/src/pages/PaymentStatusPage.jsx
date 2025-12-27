import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, XCircle, Loader2, Download, Mail, Home } from "lucide-react";
import api, { API_BASE } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const isDemo = searchParams.get('demo') === 'true';
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const verifyPayment = async () => {
    setVerifying(true);
    try {
      const response = await api.get(`/payments/verify/${orderId}`);
      setOrder(response.data);
      
      // If demo mode, simulate marking as paid
      if (isDemo && response.data.payment_status === 'PENDING') {
        // For demo, we'll just show as successful
        setOrder({ ...response.data, payment_status: 'PAID' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (order) {
      window.open(`${API_BASE}/download/${order.order_id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#0F172A] mx-auto mb-4" />
          <p className="text-[#64748B]">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-[#0F172A] mb-2">Invalid Order</h1>
          <p className="text-[#64748B] mb-6">No order ID provided</p>
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order?.payment_status === 'PAID';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <GraduationCap className="h-8 w-8 text-[#0F172A]" />
              <span className="font-heading text-xl font-bold text-[#0F172A]">Assign Your Assignment</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Status Section */}
      <section className="py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm text-center">
            {isPaid ? (
              <>
                <div className="w-20 h-20 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-[#16A34A]" />
                </div>
                <h1 className="font-heading text-3xl font-bold text-[#0F172A] mb-2" data-testid="success-title">
                  Payment Successful!
                </h1>
                <p className="text-[#64748B] mb-8">
                  Your project PDF has been downloaded and sent to your email.
                </p>

                {/* Order Details */}
                <div className="bg-[#F8FAFC] rounded-lg p-6 text-left mb-8">
                  <h3 className="font-semibold text-[#0F172A] mb-4">Order Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Order ID</span>
                      <span className="font-mono font-medium">{order?.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Project</span>
                      <span className="font-medium">{order?.project_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Subject</span>
                      <span className="font-medium">{order?.subject_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Amount Paid</span>
                      <span className="font-medium text-[#16A34A]">{formatPrice(order?.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload}
                    className="w-full btn-success rounded-full py-6 text-lg"
                    data-testid="download-btn"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                    <Mail className="h-4 w-4" />
                    <span>PDF also sent to {order?.customer_email}</span>
                  </div>
                </div>

                {isDemo && (
                  <div className="mt-6 p-4 bg-[#FEF9C3] rounded-lg">
                    <p className="text-sm text-[#854D0E]">
                      <strong>Demo Mode:</strong> Payment gateway not configured. This is a simulated successful payment.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="font-heading text-3xl font-bold text-[#0F172A] mb-2" data-testid="failed-title">
                  Payment Pending
                </h1>
                <p className="text-[#64748B] mb-8">
                  Your payment is still being processed or was not completed.
                </p>

                {/* Order Details */}
                <div className="bg-[#F8FAFC] rounded-lg p-6 text-left mb-8">
                  <h3 className="font-semibold text-[#0F172A] mb-4">Order Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Order ID</span>
                      <span className="font-mono font-medium">{order?.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Status</span>
                      <span className="status-pending px-2 py-1 rounded text-xs font-medium">{order?.payment_status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={verifyPayment}
                    variant="outline"
                    className="w-full rounded-full"
                    disabled={verifying}
                    data-testid="retry-verify"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Check Payment Status
                  </Button>
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <Link to="/">
                <Button variant="ghost" className="text-[#64748B]" data-testid="home-btn">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
