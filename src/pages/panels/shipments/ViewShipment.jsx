import { Edit2, X, Package as PackageIcon, User as UserIcon, MapPin, Check, XCircle, Truck, Info, Calendar, Clock, Shield, FileText, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getShipmentById, updateShipment, cancelShipment, acceptShipment, rejectShipment, updateShipmentTrackerStatus, updateShipmentStatusByStatusId } from "../../../services/shipmentService";
import { Eye, ArrowLeft, ChevronDown, ChevronRight } from "react-feather";
import ShipmentStatusTracker from "../../../pages/Tracker/statusTracker";
import axiosInstance from '../../../utils/axiosInstance';
import { getAddressById } from '../../../services/addressService';

const STATUS_OPTIONS = [
  "PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RETURNED", "ACCEPTED", "REJECTED"
];

export default function ShipmentDetailsView() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState([]);
  const [inlineEditField, setInlineEditField] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [editAllMode, setEditAllMode] = useState(false);
  const [editAllIndex, setEditAllIndex] = useState(0);
  const [editAllTempValue, setEditAllTempValue] = useState({});
  const [showPackageDetails, setShowPackageDetails] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [acceptingShipment, setAcceptingShipment] = useState(false);
  const [rejectingShipment, setRejectingShipment] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [paying, setPaying] = useState(false);
  const canPay = !!(shipment && shipment.package && shipment.package.final_cost && shipment.id && (shipment.package_id || shipment.package.id));

  // Editable fields aligned with backend
  const editableFields = [
    { key: "sender_name", label: "Sender", type: "text" },
    { key: "recipient_name", label: "Recipient", type: "text" },
    { key: "status_type", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "pickup_address_id", label: "Pickup Address ID", type: "text" },
    { key: "delivery_address_text", label: "Delivery Address", type: "text" },
    { key: "weight", label: "Weight", type: "text" },
    { key: "delivery_date", label: "Delivery Date", type: "date" }
  ];

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const response = await getShipmentById(shipmentId);
        console.log('SHIPMENT:', response.data);
        setShipment(response.data);
        // Fetch status history if available
        if (response.data.status_history) {
          setStatusHistory(response.data.status_history);
        }
        setEditAllTempValue(response.data);
        setPermissionError(null);
        // No delivery address fetch needed
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setPermissionError("You do not have permission to view this shipment.");
        } else {
          toast.error("Shipment not found");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [shipmentId]);

  // Handle status update from the tracker
  const handleStatusUpdate = async (newStatus) => {
    try {
      if (isSupplier) {
        // Prefer top-level status_id if present, else fallback to latest statusHistory id
        const statusId = shipment.status_id || (statusHistory?.length > 0 ? statusHistory[statusHistory.length - 1]?.id : null);
        if (!statusId) {
          toast.error("No status ID found for this shipment.");
          return;
        }
        await updateShipmentStatusByStatusId(statusId, newStatus);
        let updateFields = { status_type: newStatus };
        if (newStatus === "DELIVERED") {
          const now = new Date().toISOString();
          await updateShipment(shipmentId, { delivery_date: now });
          updateFields.delivery_date = now;
        }
        setShipment(prev => ({ ...prev, ...updateFields }));
        toast.success(`Status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      } else {
        await updateShipmentTrackerStatus(shipmentId, { action: newStatus });
        let updateFields = { status_type: newStatus };
        if (newStatus === "DELIVERED") {
          const now = new Date().toISOString();
          await updateShipment(shipmentId, { delivery_date: now });
          updateFields.delivery_date = now;
        }
        setShipment(prev => ({ ...prev, ...updateFields }));
        toast.success(`Status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      // Check if it's an authorization error
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("You don't have permission to update this shipment status");
        return;
      }
      // Check if it's a validation error
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Invalid status update";
        toast.error(errorMessage);
        return;
      }
      toast.error("Failed to update status. Please try again.");
      throw error; // Re-throw only for unexpected errors
    }
  };

  // Helper to refetch shipment details
  const refetchShipment = async () => {
    setLoading(true);
    try {
      const response = await getShipmentById(shipmentId);
      setShipment(response.data);
      if (response.data.status_history) setStatusHistory(response.data.status_history);
    } catch (err) {
      toast.error('Failed to reload shipment');
    } finally {
      setLoading(false);
    }
  };

  // User info
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isSupplier = user.user_type === "supplier";
  const isImporterExporter = user.user_type === "importer_exporter";
  const isRejected = shipment && shipment.status_type === "REJECTED";
  const isDelivered = shipment && shipment.status_type === "DELIVERED";
  const isCancelled = shipment && shipment.status_type === "CANCELLED";

  // Fixed permission checks
  const canEdit = shipment &&
    !["CANCELLED", "DELIVERED", "REJECTED"].includes(shipment.status_type) &&
    user.user_type === "importer_exporter" &&
    shipment.sender_id === user.id &&
    shipment.status_type !== "ACCEPTED";

  const canCancel = shipment &&
    isImporterExporter &&
    ["PENDING", "IN_TRANSIT", "ACCEPTED"].includes(shipment.status_type) &&
    !["REJECTED", "DELIVERED", "CANCELLED"].includes(shipment.status_type);

  const canAcceptReject = shipment &&
    isSupplier &&
    shipment.status_type === "PENDING" &&
    !["REJECTED", "DELIVERED", "CANCELLED"].includes(shipment.status_type) &&
    shipment.payment_status !== "COMPLETED";

  // Check if user can update status (only suppliers can update status via the tracker)
  // Supplier can only update status AFTER payment is completed by importer
  const canUpdateStatus = shipment &&
    isSupplier &&
    !["CANCELLED", "DELIVERED", "REJECTED"].includes(shipment.status_type) &&
    shipment.payment_status === "COMPLETED";

  // DEBUG: Log status update permissions
  console.log('DEBUG Status Update Check:', {
    shipment: !!shipment,
    isSupplier,
    status_type: shipment?.status_type,
    payment_status: shipment?.payment_status,
    canUpdateStatus,
    user_type: user?.user_type
  });

  const handleAcceptShipment = async () => {
    setAcceptingShipment(true);
    try {
      await acceptShipment(shipmentId);
      setShipment(prev => ({ ...prev, status_type: "ACCEPTED" }));
      toast.success("Shipment accepted successfully!");
    } catch (error) {
      console.error("Failed to accept shipment:", error);
      toast.error(error.response?.data?.detail || "Failed to accept shipment");
    } finally {
      setAcceptingShipment(false);
    }
  };

  const handleRejectShipment = async () => {
    setRejectingShipment(true);
    try {
      await rejectShipment(shipmentId);
      setShipment(prev => ({ ...prev, status_type: "REJECTED" }));
      toast.success("Shipment rejected successfully!");
    } catch (error) {
      console.error("Failed to reject shipment:", error);
      toast.error(error.response?.data?.detail || "Failed to reject shipment");
    } finally {
      setRejectingShipment(false);
    }
  };

  const statusBadge = (status) => {
    const s = status?.toLowerCase();
    let color = "bg-gray-100 text-gray-700 border-gray-200";
    if (s === "pending") color = "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "in_transit") color = "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "accepted" || s === "delivered") color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "rejected") color = "bg-red-50 text-red-700 border-red-200";
    if (s === "cancelled") color = "bg-slate-50 text-slate-700 border-slate-200";
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${color}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${s === "pending" ? "bg-amber-400" : s === "in_transit" ? "bg-blue-400" : s === "accepted" || s === "delivered" ? "bg-emerald-400" : s === "rejected" ? "bg-red-400" : "bg-slate-400"}`}></div>
        {status}
      </span>
    );
  };

  function openRazorpay({ order_id, amount, currency, user }) {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100, // in paisa
      currency: currency || 'INR',
      order_id: order_id,
      name: 'CourierPro',
      description: 'Shipment Payment',
      handler: async function (response) {
        try {
          await axiosInstance.post('/shipment/v1/razorpay/verify-payment', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Payment verified and successful!');
        } catch (err) {
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        email: user.email,
        contact: user.phone,
      },
      theme: { color: '#f97316' },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shipment details...</p>
        </div>
      </div>
    );
  }
  
  if (permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-red-600">{permissionError}</p>
        </div>
      </div>
    );
  }
  
  if (!shipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Shipment Not Found</h1>
          <p className="text-gray-600">The shipment you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <PackageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Shipment Details</h1>
                  <p className="text-orange-100 text-sm sm:text-base">Tracking your package journey</p>
                </div>
              </div>
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-105"
                aria-label="Back to shipments list"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {isImporterExporter && shipment.status_type?.toUpperCase() === "ACCEPTED" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-8 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Status</h3>
                  <p className="text-sm text-gray-600">Complete payment to proceed with shipment</p>
                </div>
              </div>
              {shipment.payment_status === "COMPLETED" ? (
                <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 rounded-2xl px-6 py-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold">Payment Completed</span>
                  <span className="text-green-600 font-bold">₹{shipment.package?.final_cost}</span>
                </div>
              ) : (
                <button
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:transform-none"
                  disabled={paying}
                  onClick={async () => {
                    console.log('DEBUG shipment:', shipment);
                    console.log('DEBUG shipment.id:', shipment?.id);
                    console.log('DEBUG shipment.package:', shipment?.package);
                    console.log('DEBUG shipment.package.final_cost:', shipment?.package?.final_cost);
                    console.log('DEBUG shipment.package_id:', shipment?.package_id);
                    console.log('DEBUG shipment.package.id:', shipment?.package?.id);
                    if (!(shipment && shipment.package && shipment.package.final_cost && shipment.id && (shipment.package_id || shipment.package.id))) {
                      toast.error("Payment amount or package info missing.");
                      return;
                    }
                    setPaying(true);
                    try {
                      const payload = {
                        amount: shipment.package?.final_cost,
                        shipment_id: shipment.id,
                        package_id: shipment.package_id || shipment.package?.id,
                        currency: 'INR'
                      };
                      console.log('Razorpay payload:', payload);
                      const res = await axiosInstance.post('/shipment/v1/razorpay/create-order', payload);
                      openRazorpay({
                        order_id: res.data.order_id,
                        amount: payload.amount,
                        currency: payload.currency,
                        user: user,
                      });
                    } catch (err) {
                      toast.error(err?.response?.data?.detail || 'Payment initiation failed');
                    } finally {
                      setPaying(false);
                    }
                  }}
                >
                  {paying ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pay ₹{shipment.package?.final_cost}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Payment Waiting Notice */}
        {isSupplier && shipment.payment_status !== "COMPLETED" && shipment.status_type === "ACCEPTED" && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl shadow-lg backdrop-blur-sm mb-8 p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-amber-800 font-semibold">Waiting for Payment</h3>
                <p className="text-amber-700 text-sm">Status updates will be available once the importer completes the payment.</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Tracker */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-8 p-6">
          <ShipmentStatusTracker
            currentStatus={shipment.status_type}
            statusHistory={statusHistory}
            onStatusUpdate={canUpdateStatus ? handleStatusUpdate : null}
            glassmorphic
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sender & Recipient */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender & Recipient Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sender Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Sender</h3>
                    <p className="text-sm text-gray-600">Package origin</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                    <p className="text-gray-800 font-semibold">{shipment.sender_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pickup Address</p>
                    <p className="text-gray-800">{shipment.pickup_address_label ?? '-'}</p>
                  </div>
                </div>
              </div>

              {/* Recipient Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Recipient</h3>
                    <p className="text-sm text-gray-600">Package destination</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                    <p className="text-gray-800 font-semibold">{shipment.recipient_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Courier</p>
                    <p className="text-gray-800">{shipment.courier_name ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-gray-800">{shipment?.delivery_address_text || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Details Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <PackageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Package Details</h3>
                    <p className="text-sm text-gray-600">Physical package information</p>
                  </div>
                </div>
                {shipment.package && (
                  <button
                    className="text-orange-600 hover:text-orange-800 focus:outline-none rounded-xl p-2 transition hover:bg-orange-50"
                    onClick={() => setShowPackageDetails((prev) => !prev)}
                    aria-label={showPackageDetails ? 'Hide package details' : 'Show package details'}
                  >
                    {showPackageDetails ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Package Label</p>
                <p className="text-gray-800 font-semibold">{shipment.package_label ?? '-'}</p>
              </div>

              {showPackageDetails && shipment.package && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Type</p>
                    <p className="text-gray-800 font-semibold">{shipment.package.type}</p>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Weight</p>
                    <p className="text-gray-800 font-semibold">{shipment.package.weight} kg</p>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Dimensions</p>
                    <p className="text-gray-800 font-semibold">{shipment.package.length} × {shipment.package.width} × {shipment.package.height} cm</p>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Negotiable</p>
                    <p className="text-gray-800 font-semibold">{shipment.package.is_negotiable ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-600 mb-1">Estimated Cost</p>
                    <p className="text-blue-800 font-bold">{shipment.package.estimated_cost ?? '-'} {shipment.package.currency ?? ''}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-green-600 mb-1">Final Cost</p>
                    <p className="text-green-800 font-bold">{shipment.package.final_cost ?? '-'} {shipment.package.currency ?? ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Meta Information */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Current Status</h3>
                  <p className="text-sm text-gray-600">Shipment progress</p>
                </div>
              </div>
              <div className="mb-4">
                {statusBadge(shipment.status_type)}
              </div>
            </div>

            {/* Shipment Details Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Shipment Details</h3>
                  <p className="text-sm text-gray-600">Additional information</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Special Instructions</p>
                  <p className="text-gray-800">{shipment.special_instructions ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Signature Required</p>
                  <p className="text-gray-800 font-semibold">{shipment.signature_required ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Insurance Required</p>
                  <p className="text-gray-800 font-semibold">{shipment.insurance_required ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Important Dates</h3>
                  <p className="text-sm text-gray-600">Timeline information</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pickup Date</p>
                  <p className="text-gray-800">{shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleString() : '-'}</p>
                </div>
                {isSupplier && shipment.status_type !== 'DELIVERED' ? (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const etaValue = e.target.eta.value;
                        if (!etaValue) {
                          toast.error('Please select a date and time.');
                          return;
                        }
                        try {
                          const isoEta = new Date(etaValue).toISOString();
                          await updateShipment(shipment.id, { estimated_delivery: isoEta });
                          setShipment((prev) => ({ ...prev, estimated_delivery: isoEta }));
                          toast.success('ETA updated!');
                        } catch (err) {
                          toast.error(err?.response?.data?.detail || err?.message || 'Failed to update ETA');
                        }
                      }}
                      className="space-y-2"
                    >
                      <input
                        type="datetime-local"
                        name="eta"
                        defaultValue={shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toISOString().slice(0, 16) : ''}
                        className="w-full border border-gray-200 rounded-xl p-3 bg-white/60 backdrop-blur focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium"
                      >
                        Update ETA
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</p>
                    <p className="text-gray-800">{shipment.status_type === 'DELIVERED' ? '-' : (shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleString() : '-')}</p>
                  </div>
                )}
                {shipment.status_type === 'DELIVERED' && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Delivery Date</p>
                    <p className="text-gray-800">{shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleString() : '-'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        {shipment && !["REJECTED", "DELIVERED", "CANCELLED"].includes(shipment.status_type) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mt-8 p-6">
            <div className="flex flex-wrap gap-4 items-center justify-end">
              {canEdit && (
                <button
                  onClick={() => setEditAllMode(true)}
                  className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-gray-600 hover:to-slate-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium"
                  aria-label="Edit shipment"
                >
                  <Edit2 className="w-4 h-4" /> Edit Shipment
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium"
                  aria-label="Cancel shipment"
                >
                  <X className="w-4 h-4" /> Cancel Shipment
                </button>
              )}
              {canAcceptReject && (
                <>
                  <button
                    onClick={handleAcceptShipment}
                    disabled={acceptingShipment}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${
                      acceptingShipment
                        ? 'bg-gray-300/70 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40'
                    }`}
                    aria-label="Accept shipment"
                  >
                    {acceptingShipment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accept Shipment
                  </button>
                  <button
                    onClick={handleRejectShipment}
                    disabled={rejectingShipment}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${
                      rejectingShipment
                        ? 'bg-gray-300/70 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40'
                    }`}
                    aria-label="Reject shipment"
                  >
                    {rejectingShipment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject Shipment
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Shipment</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to cancel this shipment? This action cannot be undone.</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={async () => { 
                    await cancelShipment(shipment.id); 
                    toast.success('Shipment cancelled!'); 
                    setShowCancelConfirm(false); 
                    navigate(0); 
                  }} 
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium"
                >
                  Yes, Cancel
                </button>
                <button 
                  onClick={() => setShowCancelConfirm(false)} 
                  className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all duration-200 font-medium"
                >
                  No, Keep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}