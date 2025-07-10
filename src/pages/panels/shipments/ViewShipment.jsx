import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShipmentById, updateShipment, cancelShipment, acceptShipment, rejectShipment } from "../../../services/shipmentService";
import { toast } from "react-toastify";
import { Edit2, X, Package as PackageIcon, User as UserIcon, MapPin, Check, XCircle } from "lucide-react";
import { ArrowLeft, ChevronDown, ChevronRight } from "react-feather";

const STATUS_OPTIONS = [
  "PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RETURNED", "ACCEPTED", "REJECTED"
];

export default function ViewShipment() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [editingEstimatedDelivery, setEditingEstimatedDelivery] = useState(false);
  const [estimatedDeliveryValue, setEstimatedDeliveryValue] = useState("");
  const [permissionError, setPermissionError] = useState(null);
  const [acceptingShipment, setAcceptingShipment] = useState(false);
  const [rejectingShipment, setRejectingShipment] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isSupplier = user.user_type === "supplier";
  const isImporterExporter = user.user_type === "importer_exporter";

  useEffect(() => {
    async function fetchShipment() {
      try {
        const res = await getShipmentById(shipmentId);
        setShipment(res.data);
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
    }
    fetchShipment();
  }, [shipmentId]);

  // Supplier can edit estimated delivery if accepted and not delivered
  const canSupplierEditEstimatedDelivery = shipment && isSupplier && shipment.status_type === "ACCEPTED";

  const handleEstimatedDeliverySave = async () => {
    try {
      await updateShipment(shipmentId, { estimated_delivery: estimatedDeliveryValue });
      setShipment(prev => ({ ...prev, estimated_delivery: estimatedDeliveryValue }));
      toast.success("Estimated delivery updated!");
      setEditingEstimatedDelivery(false);
    } catch {
      toast.error("Failed to update estimated delivery");
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

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }
  if (permissionError) {
    return <div className="flex justify-center items-center h-screen text-3xl text-red-600"><h1>{permissionError}</h1></div>;
  }
  if (!shipment) {
    return <div className="flex justify-center items-center h-screen text-3xl text-red-600"><h1>Shipment not found</h1></div>;
  }

  // Now it's safe to use shipment properties
  const isSuperAdmin = user.user_type === "super_admin";
  const isCreator = user.id === shipment.sender_id;
  const canEdit = (isCreator && shipment.status_type === "PENDING") || isSuperAdmin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-3xl w-full mx-auto flex flex-col items-center">
        {/* Avatar/Icon */}
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl font-bold text-orange-500 mb-4 shadow">
          <PackageIcon size={40} />
        </div>
        {/* Tracking Number Header */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wide font-mono mb-2 text-center">
          {shipment.tracking_number}
        </h1>
        <div className="text-sm text-orange-500 font-semibold mb-8 uppercase tracking-wider">{shipment.status_type}</div>
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
            <div>
            <div className="text-xs text-gray-500 mb-1">Sender</div>
            <div className="font-bold text-lg text-gray-900 mb-2">{shipment.sender_name}</div>
            <div className="text-xs text-gray-500 mb-1">Pickup Address</div>
            <div className="font-semibold text-gray-800 break-words">
              {[
                shipment.pickup_address_label,
                shipment.pickup_address_street_address,
                shipment.pickup_address_city,
                shipment.pickup_address_state,
                shipment.pickup_address_country,
                shipment.pickup_address_postal_code
              ].filter(Boolean).join(', ') || '-'}
            </div>
            </div>
            <div>
            <div className="text-xs text-gray-500 mb-1">Recipient</div>
            <div className="font-bold text-lg text-gray-900 mb-2">{shipment.recipient_name}</div>
            <div className="text-xs text-gray-500 mb-1">Delivery Address</div>
              <div className="font-semibold text-gray-800 break-words">{shipment.delivery_address_text ?? '-'}</div>
            </div>
          </div>
          {/* Package Section */}
        <div className="w-full mb-8">
              <div className="text-xs text-gray-500 mb-1">Package</div>
          <div className="font-semibold text-base text-orange-700">
                {shipment.package_label ?? '-'}
          </div>
          {/* Expand/collapse for package details if needed */}
                {shipment.package && (
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
          {/* Meta Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div>
              <div className="text-xs text-gray-500 mb-1">Special Instructions</div>
            <div className="mb-3">{shipment.special_instructions ?? '-'}</div>
              <div className="text-xs text-gray-500 mb-1">Signature Required</div>
            <div className="mb-3">{shipment.signature_required ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500 mb-1">Estimated Delivery</div>
            <div className="mb-3">{shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleString() : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Insurance Required</div>
            <div className="mb-3">{shipment.insurance_required ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500 mb-1">Pickup Date</div>
            <div className="mb-3">{shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleString() : '-'}</div>
              {shipment.status_type === 'DELIVERED' && (
                <>
                  <div className="text-xs text-gray-500 mb-1">Delivery Date</div>
                <div className="text-base font-medium text-gray-800">{shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleString() : '-'}</div>
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}