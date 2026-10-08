import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Link } from "react-router-dom";
import { Package, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const TrackingPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${API}/tracking/${trackingId}`);
      setTrackingData(response.data);
      toast.success("Shipment found!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Tracking ID not found");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SwiftLogistics</span>
          </Link>
          <Link to="/auth">
            <Button className="bg-blue-600 hover:bg-blue-700">Login</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Track Your Shipment</h1>
          <p className="text-lg text-gray-600">Enter your tracking ID to get real-time updates</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Label htmlFor="tracking-id">Tracking ID</Label>
              <Input
                id="tracking-id"
                placeholder="Enter your tracking ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Tracking..." : "Track Shipment"}
            </Button>
          </form>
        </div>

        {trackingData && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipment Details</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Order ID</p>
                  <p className="text-gray-600">{trackingData.order_id}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Route</p>
                  <p className="text-gray-600">{trackingData.from_location} → {trackingData.to_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Current Status</p>
                  <p className="text-gray-600">{trackingData.status}</p>
                </div>
              </div>
            </div>

            {trackingData.tracking_updates && trackingData.tracking_updates.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tracking History</h3>
                <div className="space-y-3">
                  {trackingData.tracking_updates.map((update) => (
                    <div key={update.update_id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold text-gray-900">{update.location}</p>
                      <p className="text-sm text-gray-600">{update.status}</p>
                      <p className="text-xs text-gray-500">{new Date(update.updated_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
