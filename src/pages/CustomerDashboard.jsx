import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Package, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

const CustomerDashboard = ({ user, onLogout }) => {
  const [shipments, setShipments] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    logistic_type: "",
    service_type: "",
    from_location: "",
    to_location: "",
    receiver_name: "",
    phone_number: "",
    alternate_phone: "",
    full_address: "",
    pincode: "",
    weight_kg: "",
    volume_weight: "",
    booking_date: "",
    booking_time: ""
  });
  const [verificationForm, setVerificationForm] = useState({ order_id: "", otp: "" });
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "" });
  const [packagingForm, setPackagingForm] = useState({ packing_type: "", pickup_date: "", pickup_time: "", branch_location: "" });
  const [feedbackForm, setFeedbackForm] = useState({ shipment_id: "", rating: 5, package_condition: "safe", review_comment: "" });
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/shipment/my-shipments`, { headers });
      setShipments(response.data.shipments);
    } catch (error) {
      toast.error("Failed to fetch shipments");
    }
  };

  const handleBookShipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/shipment/book`, {
        ...bookingForm,
        weight_kg: parseFloat(bookingForm.weight_kg),
        volume_weight: parseFloat(bookingForm.volume_weight)
      }, { headers });
      toast.success(`Shipment booked! Order ID: ${response.data.order_id}`);
      fetchShipments();
      setBookingForm({
        logistic_type: "", service_type: "", from_location: "", to_location: "",
        receiver_name: "", phone_number: "", alternate_phone: "", full_address: "",
        pincode: "", weight_kg: "", volume_weight: "", booking_date: "", booking_time: ""
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to book shipment");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/order/verify`, verificationForm, { headers });
      setVerifiedOrder(response.data);
      toast.success("Order verified successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!verifiedOrder) { toast.error("Please verify order first"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/payment/process`, {
        order_id: verificationForm.order_id,
        payment_method: paymentForm.payment_method,
        amount: verifiedOrder.estimated_price
      }, { headers });
      toast.success("Payment processed successfully!");
      fetchShipments();
      setVerifiedOrder(null);
      setVerificationForm({ order_id: "", otp: "" });
      setPaymentForm({ payment_method: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePackagingSelection = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderIdForPackaging = verificationForm.order_id || shipments.find(s => s.payment_status === "paid")?.order_id;
      if (!orderIdForPackaging) { toast.error("No paid order found for packaging selection"); return; }
      await axios.post(`${API}/packaging/select`, { order_id: orderIdForPackaging, ...packagingForm }, { headers });
      toast.success("Packaging option selected successfully!");
      fetchShipments();
      setPackagingForm({ packing_type: "", pickup_date: "", pickup_time: "", branch_location: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to select packaging");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.shipment_id) {
      toast.error("Select a delivered shipment before submitting feedback.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/feedback/submit`, feedbackForm, { headers });
      toast.success("Feedback submitted successfully!");
      fetchShipments();
      setFeedbackForm({ shipment_id: "", rating: 5, package_condition: "safe", review_comment: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SwiftLogistics</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user.full_name}</span>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Dashboard</h1>

        <Tabs
          defaultValue="book"
          className="w-full"
          onValueChange={(value) => {
            if (value === "feedback") fetchShipments();
          }}
        >
          <TabsList>
            <TabsTrigger value="book">Book Shipment</TabsTrigger>
            <TabsTrigger value="verify">Verify & Pay</TabsTrigger>
            <TabsTrigger value="packaging">Packaging</TabsTrigger>
            <TabsTrigger value="shipments">My Shipments</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Book New Shipment</h2>
            <form onSubmit={handleBookShipment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Logistic Type</Label>
                <Select value={bookingForm.logistic_type} onValueChange={(value) => setBookingForm({ ...bookingForm, logistic_type: value })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothes">Clothes</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="home_appliances">Home Appliances</SelectItem>
                    <SelectItem value="industrial_items">Industrial Items</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fragile_items">Fragile Items</SelectItem>
                    <SelectItem value="books_or_study_material">Books/Study Material</SelectItem>
                    <SelectItem value="foods">Foods</SelectItem>
                    <SelectItem value="cosmetics">Cosmetics</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="medicines">Medicines</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type</Label>
                <Select value={bookingForm.service_type} onValueChange={(value) => setBookingForm({ ...bookingForm, service_type: value })}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="airways">Airways</SelectItem>
                    <SelectItem value="groundways">Groundways</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Location</Label>
                <Input placeholder="Origin city" value={bookingForm.from_location} onChange={(e) => setBookingForm({ ...bookingForm, from_location: e.target.value })} required />
              </div>
              <div>
                <Label>To Location</Label>
                <Input placeholder="Destination city" value={bookingForm.to_location} onChange={(e) => setBookingForm({ ...bookingForm, to_location: e.target.value })} required />
              </div>
              <div>
                <Label>Receiver Name</Label>
                <Input placeholder="Name" value={bookingForm.receiver_name} onChange={(e) => setBookingForm({ ...bookingForm, receiver_name: e.target.value })} required />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input placeholder="+91 98765 43210" value={bookingForm.phone_number} onChange={(e) => setBookingForm({ ...bookingForm, phone_number: e.target.value })} required />
              </div>
              <div>
                <Label>Alternate Phone</Label>
                <Input placeholder="Alternate contact" value={bookingForm.alternate_phone} onChange={(e) => setBookingForm({ ...bookingForm, alternate_phone: e.target.value })} required />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input placeholder="123456" value={bookingForm.pincode} onChange={(e) => setBookingForm({ ...bookingForm, pincode: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Label>Full Address</Label>
                <Textarea placeholder="Complete delivery address" value={bookingForm.full_address} onChange={(e) => setBookingForm({ ...bookingForm, full_address: e.target.value })} required />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.01" placeholder="10.5" value={bookingForm.weight_kg} onChange={(e) => setBookingForm({ ...bookingForm, weight_kg: e.target.value })} required />
              </div>
              <div>
                <Label>Volume Weight</Label>
                <Input type="number" step="0.01" placeholder="12.0" value={bookingForm.volume_weight} onChange={(e) => setBookingForm({ ...bookingForm, volume_weight: e.target.value })} required />
              </div>
              <div>
                <Label>Booking Date</Label>
                <Input type="date" value={bookingForm.booking_date} onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })} required />
              </div>
              <div>
                <Label>Booking Time</Label>
                <Input type="time" value={bookingForm.booking_time} onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />{loading ? "Booking..." : "Book Shipment"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="verify" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Verify Order & Make Payment</h2>
            {!verifiedOrder ? (
              <form onSubmit={handleVerifyOrder} className="space-y-4 max-w-md">
                <div>
                  <Label>Order ID</Label>
                  <Input placeholder="Enter Order ID from email" value={verificationForm.order_id} onChange={(e) => setVerificationForm({ ...verificationForm, order_id: e.target.value })} required />
                </div>
                <div>
                  <Label>OTP</Label>
                  <Input placeholder="Enter OTP from email" value={verificationForm.otp} onChange={(e) => setVerificationForm({ ...verificationForm, otp: e.target.value })} required />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Order"}
                </Button>
              </form>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-900 mb-2">Order Verified Successfully!</h3>
                  <p className="text-green-800">Estimated Price: ₹{verifiedOrder.estimated_price}</p>
                </div>
                <form onSubmit={handlePayment} className="space-y-4 max-w-md">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ payment_method: value })}>
                      <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpay">Google Pay</SelectItem>
                        <SelectItem value="phonepe">PhonePe</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
                    {loading ? "Processing..." : `Pay ₹${verifiedOrder.estimated_price}`}
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>

          <TabsContent value="packaging" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Select Packaging Option</h2>
            <form onSubmit={handlePackagingSelection} className="space-y-4 max-w-md">
              <div>
                <Label>Packing Type</Label>
                <Select value={packagingForm.packing_type} onValueChange={(value) => setPackagingForm({ ...packagingForm, packing_type: value })}>
                  <SelectTrigger><SelectValue placeholder="Select packing type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doorstep_pack">Doorstep Packing</SelectItem>
                    <SelectItem value="self_pack">Self Packing</SelectItem>
                    <SelectItem value="branch_pack">Branch Packing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {packagingForm.packing_type === "doorstep_pack" && (
                <>
                  <div>
                    <Label>Pickup Date</Label>
                    <Input type="date" value={packagingForm.pickup_date} onChange={(e) => setPackagingForm({ ...packagingForm, pickup_date: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Pickup Time</Label>
                    <Input type="time" value={packagingForm.pickup_time} onChange={(e) => setPackagingForm({ ...packagingForm, pickup_time: e.target.value })} required />
                  </div>
                </>
              )}
              {packagingForm.packing_type === "branch_pack" && (
                <div>
                  <Label>Branch Location</Label>
                  <Input placeholder="Nearest branch location" value={packagingForm.branch_location} onChange={(e) => setPackagingForm({ ...packagingForm, branch_location: e.target.value })} required />
                </div>
              )}
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Submitting..." : "Confirm Packaging"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="shipments" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">My Shipments</h2>
            <div className="space-y-4">
              {shipments.length === 0 ? (
                <p className="text-gray-500">No shipments found</p>
              ) : (
                shipments.map((shipment) => (
                  <div key={shipment.order_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">Order: {shipment.order_id}</p>
                        <p className="text-sm text-gray-600">Tracking: {shipment.tracking_id}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{shipment.order_status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="font-medium">From:</span> {shipment.from_location}</p>
                      <p><span className="font-medium">To:</span> {shipment.to_location}</p>
                      <p><span className="font-medium">Type:</span> {shipment.logistic_type}</p>
                      <p><span className="font-medium">Service:</span> {shipment.service_type}</p>
                      <p><span className="font-medium">Payment:</span> {shipment.payment_status}</p>
                      <p><span className="font-medium">Weight:</span> {shipment.weight_kg} kg</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Submit Feedback</h2>
            {!shipments.some((shipment) => shipment.order_status === "Delivered") && (
              <p className="text-gray-600 mb-4">Feedback is available after your shipment status is marked Delivered.</p>
            )}
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 max-w-md">
              <div>
                <Label>Shipment</Label>
                <Select value={feedbackForm.shipment_id} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, shipment_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select delivered shipment" /></SelectTrigger>
                  <SelectContent>
                    {shipments.filter((shipment) => shipment.order_status === "Delivered").map((s) => (
                      <SelectItem key={s.shipment_id} value={s.shipment_id}>{s.order_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Input type="number" min="1" max="5" value={feedbackForm.rating} onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })} required />
              </div>
              <div>
                <Label>Package Condition</Label>
                <Select value={feedbackForm.package_condition} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, package_condition: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="minor_issues">Minor Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Review Comment</Label>
                <Textarea placeholder="Share your experience..." value={feedbackForm.review_comment} onChange={(e) => setFeedbackForm({ ...feedbackForm, review_comment: e.target.value })} required />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;
