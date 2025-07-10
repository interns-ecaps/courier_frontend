import { Edit2, X, Package as PackageIcon, User as UserIcon, MapPin, Check, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getShipmentById, updateShipment, cancelShipment, acceptShipment, rejectShipment, updateShipmentTrackerStatus, updateShipmentStatusByStatusId } from "../../../services/shipmentService";
import { Eye, ArrowLeft, ChevronDown, ChevronRight } from "react-feather";
import ShipmentStatusTracker from "../../../pages/Tracker/statusTracker";
import axiosInstance from '../../../utils/axiosInstance';

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
  const [showPackageDetails, setShowPackageDetails] = useState(false);
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
        setShipment(response.data);
        // Fetch status history if available
        if (response.data.status_history) {
          setStatusHistory(response.data.status_history);
        }
        setEditAllTempValue(response.data);
        setPermissionError(null);
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
        setShipment(prev => ({ ...prev, status_type: newStatus }));
        toast.success(`Status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      } else {
        await updateShipmentTrackerStatus(shipmentId, { action: newStatus });
        setShipment(prev => ({ ...prev, status_type: newStatus }));
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
    let color = "bg-gray-200 text-gray-700";
    if (s === "pending") color = "bg-yellow-100 text-yellow-800";
    if (s === "in_transit") color = "bg-blue-100 text-blue-800";
    if (s === "accepted" || s === "delivered") color = "bg-green-100 text-green-800";
    if (s === "rejected") color = "bg-red-100 text-red-800";
    if (s === "cancelled") color = "bg-red-200 text-red-900";
    return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>;
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
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }
  if (permissionError) {
    return <div className="flex justify-center items-center h-screen text-3xl text-red-600"><h1>{permissionError}</h1></div>;
  }
  if (!shipment) {
    return <div className="flex justify-center items-center h-screen text-3xl text-red-600"><h1>Shipment not found</h1></div>;
  }

  return (
    <div className="w-full min-h-screen py-6 px-4 bg-[#fff7f0]">
      <div className="w-full bg-white rounded-none shadow-none overflow-visible">
        {/* Header Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-orange-400 to-orange-500">
          <UserIcon className="text-white" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex-1">Shipment Details</h2>
          <button onClick={() => navigate(-1)} className="text-white hover:text-orange-100 transition" aria-label="Back to shipments list"><ArrowLeft size={22} /></button>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-8">
          {isImporterExporter && shipment.status_type?.toUpperCase() === "ACCEPTED" && (
            <div className="mb-6 flex justify-end">
              {shipment.payment_status === "COMPLETED" ? (
                // Payment completed - show success state
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-6 py-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-800 font-medium">Payment Completed</span>
                  <span className="text-green-600 text-sm">₹{shipment.package?.final_cost}</span>
                </div>
              ) : (
                // Payment pending - show pay button
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full shadow transition disabled:opacity-60"
                  disabled={paying}
                  onClick={async () => {
                    // DEBUG: Log all relevant fields before checking
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
                        amount: shipment.package?.final_cost, // No fallback to 1
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
                  {paying ? 'Processing...' : 'Pay'}
                </button>
              )}
            </div>
          )}
          {/* Status Tracker with Update Button */}
          {isSupplier && shipment.payment_status !== "COMPLETED" && shipment.status_type === "ACCEPTED" && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Waiting for payment completion</span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Status updates will be available once the importer completes the payment.
              </p>
            </div>
          )}
          <ShipmentStatusTracker
            currentStatus={shipment.status_type}
            statusHistory={statusHistory}
            onStatusUpdate={canUpdateStatus ? handleStatusUpdate : null}
          />

          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><UserIcon size={14} className="text-orange-400" /> Sender</div>
              <div className="font-bold text-base sm:text-lg text-gray-900 mb-2">{shipment.sender_name}</div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="mb-2">{statusBadge(shipment.status_type)}</div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={14} className="text-orange-400" /> Pickup Address</div>
              <div className="font-semibold text-gray-800 break-words">{shipment.pickup_address_label ?? '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><UserIcon size={14} className="text-orange-400" /> Recipient</div>
              <div className="font-bold text-base sm:text-lg text-gray-900 mb-2">{shipment.recipient_name}</div>
              <div className="text-xs text-gray-500 mb-1">Courier</div>
              <div className="font-semibold text-gray-800 mb-2">{shipment.courier_name ?? '-'}</div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={14} className="text-orange-400" /> Delivery Address</div>
              <div className="font-semibold text-gray-800 break-words">{shipment.delivery_address_text ?? '-'}</div>
            </div>
          </div>

          {/* Rest of your existing content... */}
          {/* Divider */}
          <div className="border-t border-orange-100 my-4 sm:my-6" />
          {/* Package Section */}
          <div className="bg-orange-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 overflow-x-auto">
            <PackageIcon size={22} className="text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">Package</div>
              <div className="font-semibold text-sm sm:text-base text-orange-700 flex items-center gap-2 flex-wrap">
                {shipment.package_label ?? '-'}
                {shipment.package && (
                  <button
                    className="ml-2 text-orange-600 hover:text-orange-800 focus:outline-none rounded-full p-1 transition hover:bg-orange-200"
                    onClick={() => setShowPackageDetails((prev) => !prev)}
                    aria-label={showPackageDetails ? 'Hide package details' : 'Show package details'}
                  >
                    {showPackageDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                )}
              </div>
              {showPackageDetails && shipment.package && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div><span className="font-semibold">Type:</span> {shipment.package.type}</div>
                  <div><span className="font-semibold">Weight:</span> {shipment.package.weight} kg</div>
                  <div><span className="font-semibold">Dimensions:</span> {shipment.package.length} x {shipment.package.width} x {shipment.package.height} cm</div>
                  <div><span className="font-semibold">Negotiable:</span> {shipment.package.is_negotiable ? 'Yes' : 'No'}</div>
                  <div><span className="font-semibold">Estimated Cost:</span> {shipment.package.estimated_cost ?? '-'} {shipment.package.currency ?? ''}</div>
                  <div><span className="font-semibold">Final Cost:</span> {shipment.package.final_cost ?? '-'} {shipment.package.currency ?? ''}</div>
                </div>
              )}
            </div>
          </div>

          {/* Meta Info Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-orange-50 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Special Instructions</div>
              <div className="mb-3 sm:mb-4">{shipment.special_instructions ?? '-'}</div>
              <div className="text-xs text-gray-500 mb-1">Signature Required</div>
              <div className="mb-3 sm:mb-4">{shipment.signature_required ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500 mb-1">Estimated Delivery</div>
              {isSupplier && shipment.status_type !== 'DELIVERED' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await updateShipment(shipment.id, { estimated_delivery: e.target.eta.value });
                      setShipment((prev) => ({ ...prev, estimated_delivery: e.target.eta.value }));
                      toast.success('ETA updated!');
                    } catch (err) {
                      toast.error('Failed to update ETA');
                    }
                  }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="datetime-local"
                    name="eta"
                    defaultValue={shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toISOString().slice(0, 16) : ''}
                    className="border p-2 rounded"
                    required
                  />
                  <button type="submit" className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">Save</button>
                </form>
              ) : (
                <div>{shipment.status_type === 'DELIVERED' ? '-' : (shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleString() : '-')}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Insurance Required</div>
              <div className="mb-3 sm:mb-4">{shipment.insurance_required ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500 mb-1">Pickup Date</div>
              <div className="mb-3 sm:mb-4">{shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleString() : '-'}</div>
              {shipment.status_type === 'DELIVERED' && (
                <>
                  <div className="text-xs text-gray-500 mb-1">Delivery Date</div>
                  <div>{shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleString() : '-'}</div>
                </>
              )}
            </div>
          </div>

          {/* Actions - Only show if not in final states */}
          {shipment && !["REJECTED", "DELIVERED", "CANCELLED"].includes(shipment.status_type) && (
            <div className="flex gap-4 mt-8 items-center justify-end">
              {canEdit && (
                <button
                  onClick={() => setEditAllMode(true)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-300 flex items-center gap-2"
                  aria-label="Edit shipment"
                >
                  <Edit2 size={18} /> Edit
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="p-2 hover:bg-orange-100 rounded-full"
                  aria-label="Cancel shipment"
                >
                  <X size={22} className="text-orange-500" />
                </button>
              )}
              {canAcceptReject && (
                <>
                  <button
                    onClick={handleAcceptShipment}
                    disabled={acceptingShipment}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${acceptingShipment
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40'
                      }`}
                    aria-label="Accept shipment"
                  >
                    {acceptingShipment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    ) : (
                      <Check size={18} />
                    )}
                    Accept Shipment
                  </button>
                  <button
                    onClick={handleRejectShipment}
                    disabled={rejectingShipment}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${rejectingShipment
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40'
                      }`}
                    aria-label="Reject shipment"
                  >
                    {rejectingShipment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    ) : (
                      <XCircle size={18} />
                    )}
                    Reject Shipment
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-orange-700">Cancel Shipment</h3>
              <p className="mb-6">Are you sure you want to cancel this shipment?</p>
              <div className="flex gap-4 justify-end">
                <button onClick={async () => { await cancelShipment(shipment.id); toast.success('Shipment cancelled!'); setShowCancelConfirm(false); navigate(0); }} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Yes, Cancel</button>
                <button onClick={() => setShowCancelConfirm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}