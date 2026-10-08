import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Package, LogOut, Send, Truck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [feedbackReports, setFeedbackReports] = useState([]);
  const [emailForm, setEmailForm] = useState({ order_id: "", estimated_price: "" });
  const [statusForm, setStatusForm] = useState({ order_id: "", order_status: "" });
  const [driverForm, setDriverForm] = useState({
    shipment_id: "", driver_name: "", driver_license_number: "",
    driver_phone: "", vehicle_plate_number: "", vehicle_type: "", vehicle_capacity: ""
  });
  const [trackingForm, setTrackingForm] = useState({
    shipment_id: "", location: "", status: "", latitude: "", longitude: ""
  });
  const [deliveryForm, setDeliveryForm] = useState({
    shipment_id: "", delivery_photo: "", parcel_condition_photo: ""
  });
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    fetchFeedbackReports();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders`, { headers });
      const fetchedOrders = response.data.orders || [];
      if (fetchedOrders.some((order) => !order.order_id)) {
        toast.error("Backend returned incomplete order data. Restart it from l_m_s/backend, then refresh orders.");
      }
      const sortedOrders = fetchedOrders.sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
      setOrders(sortedOrders);
    } catch (error) {
      toast.error("Failed to fetch orders");
    }
  };

  const fetchFeedbackReports = async () => {
    try {
      const response = await axios.get(`${API}/admin/feedback-reports`, { headers });
      setFeedbackReports(response.data.feedback);
    } catch (error) {
      toast.error("Failed to fetch feedback");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/send-shipment-email`, {
        order_id: emailForm.order_id,
        estimated_price: parseFloat(emailForm.estimated_price)
      }, { headers });
      if (response.data.status !== "success") {
        const otpMessage = response.data.otp ? ` OTP for manual sharing: ${response.data.otp}` : "";
        toast.error(`${response.data.message || "Email could not be sent."}${otpMessage}`);
        return;
      }
      toast.success(`Gmail accepted the email for ${response.data.customer_email || "the customer"}. Check Spam/Promotions if it is missing.`);
      setEmailForm({ order_id: "", estimated_price: "" });
      fetchOrders();
    } catch (error) {
      const message = error.response?.status === 403
        ? "This tab is not authenticated as an admin. Log out and sign in to the admin account again."
        : error.response?.data?.detail || "Failed to send email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/admin/update-shipment-status`, statusForm, { headers });
      toast.success("Status updated successfully!");
      setStatusForm({ order_id: "", order_status: "" });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/assign-driver-vehicle`, driverForm, { headers });
      toast.success("Driver assigned successfully!");
      setDriverForm({ shipment_id: "", driver_name: "", driver_license_number: "", driver_phone: "", vehicle_plate_number: "", vehicle_type: "", vehicle_capacity: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to assign driver");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/add-tracking-update`, {
        ...trackingForm,
        latitude: trackingForm.latitude ? parseFloat(trackingForm.latitude) : null,
        longitude: trackingForm.longitude ? parseFloat(trackingForm.longitude) : null
      }, { headers });
      toast.success("Tracking update added!");
      setTrackingForm({ shipment_id: "", location: "", status: "", latitude: "", longitude: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add tracking update");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDeliveryProof = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/upload-delivery-proof`, deliveryForm, { headers });
      toast.success("Delivery proof uploaded!");
      setDeliveryForm({ shipment_id: "", delivery_photo: "", parcel_condition_photo: "" });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload delivery proof");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">SwiftLogistics Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Admin: {user.full_name}</span>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <Tabs
          defaultValue="orders"
          className="w-full"
          onValueChange={(value) => {
            if (value === "feedback") fetchFeedbackReports();
          }}
        >
          <TabsList>
            <TabsTrigger value="orders">All Orders</TabsTrigger>
            <TabsTrigger value="email">Send Email</TabsTrigger>
            <TabsTrigger value="status">Update Status</TabsTrigger>
            <TabsTrigger value="driver">Assign Driver</TabsTrigger>
            <TabsTrigger value="tracking">Add Tracking</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Proof</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Orders ({orders.length})</h2>
              <Button type="button" variant="outline" onClick={fetchOrders} title="Refresh orders">
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-gray-500">No orders found</p>
              ) : (
                orders.map((order, index) => (
                  <div key={order.order_id || order.shipment_id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">Order: {order.order_id || "Order ID unavailable"}</p>
                        <p className="text-sm text-gray-600">Tracking: {order.tracking_id || "Not available"}</p>
                        <p className="text-sm text-gray-600">Customer: {order.user_email || "Not available"}</p>
                        {order.created_at && (
                          <p className="text-xs text-gray-500">Created: {new Date(order.created_at).toLocaleString()}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{order.order_status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="font-medium">From:</span> {order.from_location || "Not provided"}</p>
                      <p><span className="font-medium">To:</span> {order.to_location || "Not provided"}</p>
                      <p><span className="font-medium">Receiver:</span> {order.receiver_name || "Not provided"}</p>
                      <p><span className="font-medium">Phone:</span> {order.phone_number || "Not provided"}</p>
                      <p><span className="font-medium">Alternate phone:</span> {order.alternate_phone || "Not provided"}</p>
                      <p><span className="font-medium">Pincode:</span> {order.pincode || "Not provided"}</p>
                      <p><span className="font-medium">Address:</span> {order.full_address || "Not provided"}</p>
                      <p><span className="font-medium">Item type:</span> {order.logistic_type || "Not provided"}</p>
                      <p><span className="font-medium">Service:</span> {order.service_type || "Not provided"}</p>
                      <p><span className="font-medium">Weight:</span> {order.weight_kg ?? "Not provided"} kg</p>
                      <p><span className="font-medium">Volume weight:</span> {order.volume_weight ?? "Not provided"} kg</p>
                      <p><span className="font-medium">Booking:</span> {[order.booking_date, order.booking_time].filter(Boolean).join(" ") || "Not provided"}</p>
                      <p><span className="font-medium">Payment:</span> {order.payment_status || "Not available"}</p>
                      <p><span className="font-medium">Price:</span> {order.estimated_price != null ? `₹${order.estimated_price}` : "Not set"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="email" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Send Shipment Confirmation Email</h2>
            <form onSubmit={handleSendEmail} className="space-y-4 max-w-md">
              <div>
                <Label>Order ID</Label>
                <Input placeholder="Enter Order ID" value={emailForm.order_id} onChange={(e) => setEmailForm({ ...emailForm, order_id: e.target.value })} required />
              </div>
              <div>
                <Label>Estimated Price (₹)</Label>
                <Input type="number" step="0.01" placeholder="500.00" value={emailForm.estimated_price} onChange={(e) => setEmailForm({ ...emailForm, estimated_price: e.target.value })} required />
              </div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />{loading ? "Sending..." : "Send Email"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="status" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
            <form onSubmit={handleUpdateStatus} className="space-y-4 max-w-md">
              <div>
                <Label>Order ID</Label>
                <Input placeholder="Enter Order ID" value={statusForm.order_id} onChange={(e) => setStatusForm({ ...statusForm, order_id: e.target.value })} required />
              </div>
              <div>
                <Label>New Status</Label>
                <Select value={statusForm.order_status} onValueChange={(value) => setStatusForm({ ...statusForm, order_status: value })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Order Submitted">Order Submitted</SelectItem>
                    <SelectItem value="Payment Completed">Payment Completed</SelectItem>
                    <SelectItem value="Packaging Scheduled">Packaging Scheduled</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Order Completed">Order Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Updating..." : "Update Status"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="driver" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Assign Driver & Vehicle</h2>
            <form onSubmit={handleAssignDriver} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Shipment ID</Label>
                <Input placeholder="Enter Shipment ID" value={driverForm.shipment_id} onChange={(e) => setDriverForm({ ...driverForm, shipment_id: e.target.value })} required />
              </div>
              <div>
                <Label>Driver Name</Label>
                <Input placeholder="John Doe" value={driverForm.driver_name} onChange={(e) => setDriverForm({ ...driverForm, driver_name: e.target.value })} required />
              </div>
              <div>
                <Label>License Number</Label>
                <Input placeholder="DL123456" value={driverForm.driver_license_number} onChange={(e) => setDriverForm({ ...driverForm, driver_license_number: e.target.value })} required />
              </div>
              <div>
                <Label>Driver Phone</Label>
                <Input placeholder="+91 98765 43210" value={driverForm.driver_phone} onChange={(e) => setDriverForm({ ...driverForm, driver_phone: e.target.value })} required />
              </div>
              <div>
                <Label>Vehicle Plate Number</Label>
                <Input placeholder="MH12AB1234" value={driverForm.vehicle_plate_number} onChange={(e) => setDriverForm({ ...driverForm, vehicle_plate_number: e.target.value })} required />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Input placeholder="Truck" value={driverForm.vehicle_type} onChange={(e) => setDriverForm({ ...driverForm, vehicle_type: e.target.value })} required />
              </div>
              <div>
                <Label>Vehicle Capacity</Label>
                <Input placeholder="5 tons" value={driverForm.vehicle_capacity} onChange={(e) => setDriverForm({ ...driverForm, vehicle_capacity: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  <Truck className="h-4 w-4 mr-2" />{loading ? "Assigning..." : "Assign Driver"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tracking" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Add Tracking Update</h2>
            <form onSubmit={handleAddTracking} className="space-y-4 max-w-md">
              <div>
                <Label>Shipment ID</Label>
                <Input placeholder="Enter Shipment ID" value={trackingForm.shipment_id} onChange={(e) => setTrackingForm({ ...trackingForm, shipment_id: e.target.value })} required />
              </div>
              <div>
                <Label>Location</Label>
                <Input placeholder="Mumbai Hub" value={trackingForm.location} onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })} required />
              </div>
              <div>
                <Label>Status</Label>
                <Input placeholder="In Transit" value={trackingForm.status} onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })} required />
              </div>
              <div>
                <Label>Latitude (Optional)</Label>
                <Input type="number" step="any" placeholder="19.0760" value={trackingForm.latitude} onChange={(e) => setTrackingForm({ ...trackingForm, latitude: e.target.value })} />
              </div>
              <div>
                <Label>Longitude (Optional)</Label>
                <Input type="number" step="any" placeholder="72.8777" value={trackingForm.longitude} onChange={(e) => setTrackingForm({ ...trackingForm, longitude: e.target.value })} />
              </div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Adding..." : "Add Tracking Update"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="delivery" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Upload Delivery Proof</h2>
            <form onSubmit={handleUploadDeliveryProof} className="space-y-4 max-w-md">
              <div>
                <Label>Shipment ID</Label>
                <Input placeholder="Enter Shipment ID" value={deliveryForm.shipment_id} onChange={(e) => setDeliveryForm({ ...deliveryForm, shipment_id: e.target.value })} required />
              </div>
              <div>
                <Label>Delivery Photo URL</Label>
                <Input placeholder="https://example.com/delivery.jpg" value={deliveryForm.delivery_photo} onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_photo: e.target.value })} required />
              </div>
              <div>
                <Label>Parcel Condition Photo URL</Label>
                <Input placeholder="https://example.com/condition.jpg" value={deliveryForm.parcel_condition_photo} onChange={(e) => setDeliveryForm({ ...deliveryForm, parcel_condition_photo: e.target.value })} required />
              </div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Uploading..." : "Upload Delivery Proof"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="feedback" className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Customer Feedback Reports</h2>
              <Button type="button" variant="outline" onClick={fetchFeedbackReports} title="Refresh feedback">
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {feedbackReports.length === 0 ? (
                <p className="text-gray-500">No feedback reports found</p>
              ) : (
                feedbackReports.map((feedback) => (
                  <div key={feedback.feedback_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold">Shipment ID: {feedback.shipment_id}</p>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">{feedback.rating} ⭐</span>
                    </div>
                    <p className="text-sm"><span className="font-medium">Condition:</span> {feedback.package_condition}</p>
                    <p className="text-sm mt-2"><span className="font-medium">Review:</span> {feedback.review_comment}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
