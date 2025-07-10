// src/pages/panels/shipments/page.jsx
import { Edit2, Eye, Plus, Copy, Trash2, X, Check, XCircle } from "react-feather";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { getAllShipments, updateShipmentStatus, cancelShipment as cancelShipmentApi, acceptShipment, rejectShipment } from "../../../services/shipmentService";
import { toast } from "react-toastify";

const shipmentFields = [
    { key: "id", label: "ID" },
    { key: "sender_name", label: "Sender" },
    { key: "recipient_name", label: "Recipient" },
    { key: "supplier_name", label: "Supplier" },
    { key: "status_type", label: "Status" },
    { key: "price", label: "Price" }, // <-- Add Price column here
    { key: "pickup_date", label: "Pickup Date" },
    { key: "estimated_delivery", label: "ETA" },
    { key: "tracking_number", label: "Tracking #" },
];

export default function Shipment() {
    const [user, setUser] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [viewingShipment, setViewingShipment] = useState(null);
    const [editingShipment, setEditingShipment] = useState(null);
    // === Tabs UI with All Shipments and status tabs ===
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");

    const tabs = [
        { key: "all", label: "All Shipments" },
        { key: "pending", label: "Pending" },
        { key: "in_transit", label: "In Transit" },
        { key: "accepted", label: "Accepted" },
        { key: "delivered", label: "Delivered" },
        { key: "rejected", label: "Rejected" },
        { key: "cancelled", label: "Cancelled" },
    ];

    const [cancellingShipmentId, setCancellingShipmentId] = useState(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [shipmentToCancel, setShipmentToCancel] = useState(null);
    const [acceptingShipmentId, setAcceptingShipmentId] = useState(null);
    const [rejectingShipmentId, setRejectingShipmentId] = useState(null);

    const nav = useNavigate();

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [totalRows, setTotalRows] = useState(0);
    const [backendShipments, setBackendShipments] = useState([]);

    // Fetch shipments with backend pagination
    useEffect(() => {
      const fetchShipments = async () => {
        if (!user) return;
        setLoading(true);
        try {
          let filters = {};
          if (user.user_type === "supplier") {
            filters = {};
          } else if (user.user_type === "courier") {
            filters = { courier_id: user.id };
          } else if (user.user_type === "super_admin") {
            filters = {};
          } else {
            filters = { sender_id: user.id };
          }
          const response = await getAllShipments({ ...filters, page: currentPage, limit: rowsPerPage });
          setBackendShipments(response.results || []);
          setTotalRows(response.total || 0);
        } catch (error) {
          console.error("Failed to fetch shipments", error);
        } finally {
          setLoading(false);
        }
      };
      fetchShipments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentPage]);

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const handleStatusUpdate = async (shipmentId, newStatus) => {
        try {
            await updateShipmentStatus(shipmentId, { status: newStatus });
            setShipments((prev) =>
                prev.map((shipment) =>
                    shipment.id === shipmentId ? { ...shipment, status_type: newStatus } : shipment
                )
            );
        } catch (error) {
            console.error(`Failed to update shipment ${shipmentId} status:`, error);
        }
    };

    const handleAcceptShipment = async (shipmentId) => {
        setAcceptingShipmentId(shipmentId);
        try {
            await acceptShipment(shipmentId);
            setShipments((prev) =>
                prev.map((shipment) =>
                    shipment.id === shipmentId ? { ...shipment, status_type: "ACCEPTED" } : shipment
                )
            );
            toast.success("Shipment accepted successfully!");
        } catch (error) {
            console.error(`Failed to accept shipment ${shipmentId}:`, error);
            toast.error(error.response?.data?.detail || "Failed to accept shipment");
        } finally {
            setAcceptingShipmentId(null);
        }
    };

    const handleRejectShipment = async (shipmentId) => {
        setRejectingShipmentId(shipmentId);
        try {
            await rejectShipment(shipmentId);
            setShipments((prev) =>
                prev.map((shipment) =>
                    shipment.id === shipmentId ? { ...shipment, status_type: "REJECTED" } : shipment
                )
            );
            toast.success("Shipment rejected successfully!");
        } catch (error) {
            console.error(`Failed to reject shipment ${shipmentId}:`, error);
            toast.error(error.response?.data?.detail || "Failed to reject shipment");
        } finally {
            setRejectingShipmentId(null);
        }
    };

    const handleView = (shipmentId) => {
        nav(`/shipments/${shipmentId}`);
    };

    const handleEdit = (shipment) => {
        nav(`/shipments/edit/${shipment.id}`);
    };

    const handleCreate = () => {
        nav(`/shipments/create`);
    };

    const cancelShipment = async (shipmentId) => {
        setCancellingShipmentId(shipmentId);
        try {
            await cancelShipmentApi(shipmentId);
            setShipments((prev) =>
                prev.map((shipment) =>
                    shipment.id === shipmentId ? { ...shipment, status_type: "cancelled" } : shipment
                )
            );
        } catch (error) {
            console.error(`Failed to cancel shipment ${shipmentId}:`, error);
        } finally {
            setCancellingShipmentId(null);
        }
    };

    const handleCancelClick = (shipment) => {
        setShipmentToCancel(shipment);
        setShowCancelConfirm(true);
    };

    const confirmCancel = async () => {
        if (shipmentToCancel) {
            await cancelShipment(shipmentToCancel.id);
            setShowCancelConfirm(false);
            setShipmentToCancel(null);
        }
    };

    console.log("User type:", user?.user_type);
    console.log("Total shipments:", shipments.length);
    console.log("Shipments data:", shipments);

    // Filtering logic
    const filteredShipments = backendShipments.filter((shipment) => {
        if (activeTab !== "all") {
            return shipment.status_type?.toLowerCase() === activeTab;
        }
        return true;
    });
    console.log("Filtered Shipments rendering:", filteredShipments);

    const statusBadge = (status) => {
        const s = status?.toLowerCase();
        let classes = "inline-flex items-center px-4 py-1 rounded-full text-sm font-bold shadow-sm border-2 mr-1";
        
        if (s === "pending") classes += " bg-yellow-100 text-yellow-800 border-yellow-300";
        else if (s === "in_transit") classes += " bg-blue-100 text-blue-800 border-blue-300";
        else if (s === "accepted" || s === "delivered") classes += " bg-green-100 text-green-800 border-green-300";
        else if (s === "rejected") classes += " bg-red-100 text-red-800 border-red-400";
        else if (s === "cancelled") classes += " bg-gray-200 text-gray-700 border-gray-400";
        else classes += " bg-gray-100 text-gray-700 border-gray-300";

        return (
            <span className={classes}>
                <div className={`w-2 h-2 rounded-full mr-2 ${s === "pending" ? "bg-yellow-500" :
                        s === "in_transit" ? "bg-blue-500" :
                            (s === "accepted" || s === "delivered") ? "bg-green-500" :
                                s === "rejected" ? "bg-red-500" :
                                    s === "cancelled" ? "bg-gray-500" : "bg-gray-400"
                    }`}></div>
                {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}
            </span>
        );
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const ShipmentsListing = () => (
        <div className="flex-1 min-h-0 flex flex-col bg-[#fff7f0] w-full h-full p-2 sm:p-4 md:p-6">
            <div className="w-full flex flex-col items-start justify-start mb-4">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2 ml-2 drop-shadow-sm">Shipments</h1>
            </div>
            <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full h-full">
                <div className="w-full flex-1 flex flex-col bg-white rounded-3xl shadow-2xl border border-orange-100 p-0 h-full">
                    {/* Create Shipment Button (top right) */}
                    {(user?.user_type === "importer_exporter" || user?.user_type === "super_admin") && (
                        <div className="flex justify-end p-2 sm:p-4 md:p-6 pb-0">
                            <button
                                onClick={handleCreate}
                                className="bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-all text-lg font-semibold"
                            >
                                Create Shipment
                            </button>
                        </div>
                    )}
                    {/* Tabs UI */}
                    <div className="flex gap-3 mb-6 px-4 pt-4 flex-wrap">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative px-6 py-3 rounded-2xl font-semibold text-base transition-all duration-300 shadow-sm border-2 ${activeTab === tab.key ? 'bg-orange-500 text-white border-orange-500 scale-105' : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 hover:scale-105'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {/* Table Container with horizontal scroll on small screens */}
                    <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-x-auto">
                        <div className="w-full min-w-[900px] md:min-w-0 h-full px-0 pb-0">
                            <table className="w-full h-full table-fixed text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 h-14">
                                    <tr className="h-14">
                                        {/* Conditionally render Sender column */}
                                        {['super_admin', 'supplier'].includes(user?.user_type) && (
                                            <th className="truncate px-4 py-3 text-base font-bold">Sender</th>
                                        )}
                                        <th className="truncate px-4 py-3 text-base font-bold">Recipient</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Supplier</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Status</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Price</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Pickup</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">ETA</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Tracking #</th>
                                        <th className="truncate px-4 py-3 text-base font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && (
                                        <tr className="h-12">
                                            <td colSpan={9} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                                    <span className="text-gray-500 font-medium">Loading shipments...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredShipments.length === 0 && (
                                        <tr className="h-12">
                                            <td colSpan={9} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="text-6xl opacity-50">📦</div>
                                                    <div className="text-gray-500">
                                                        <p className="text-lg font-medium">No shipments found</p>
                                                        <p className="text-sm">No shipments match your current filter criteria.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredShipments.map((shipment) => (
                                        <tr key={shipment.id} className="text-sm h-14 hover:bg-orange-50 transition-all">
                                            {/* Conditionally render Sender column */}
                                            {['super_admin', 'supplier'].includes(user?.user_type) && (
                                                <td className="truncate px-4 py-3" title={shipment.sender_name}>{shipment.sender_name}</td>
                                            )}
                                            <td className="truncate px-4 py-3" title={shipment.recipient_name}>{shipment.recipient_name}</td>
                                            <td className="truncate px-4 py-3" title={shipment.supplier_name}>{shipment.supplier_name}</td>
                                            <td className="truncate px-4 py-3">{statusBadge(shipment.status_type)}</td>
                                            <td className="truncate px-4 py-3">{shipment.package && shipment.package.final_cost != null ? `${shipment.package.final_cost} ${shipment.package.currency || ''}` : <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="truncate px-4 py-3">{shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="truncate px-4 py-3">{shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="truncate px-4 py-3 font-mono" title={shipment.tracking_number}>
                                                <span className="block max-w-[120px] truncate cursor-pointer" title={shipment.tracking_number}>{shipment.tracking_number}</span>
                                            </td>
                                            <td className="truncate px-4 py-3 text-center">
                                                <button
                                                    title="View Details"
                                                    aria-label={`View shipment ${shipment.id}`}
                                                    onClick={() => handleView(shipment.id)}
                                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {user?.user_type !== "supplier" && !["cancelled", "delivered", "accepted"].includes(shipment.status_type?.toLowerCase()) && (
                                                    <button
                                                        title="Edit Shipment"
                                                        aria-label={`Edit shipment ${shipment.id}`}
                                                        onClick={() => handleEdit(shipment)}
                                                        className="p-1 hover:bg-gray-100 rounded-full text-green-600"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls (not sticky, just below table) */}
                        {totalPages > 1 && (
                            <div className="w-full bg-white border-t border-orange-100 px-0 py-2 sm:py-4 z-10 flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 sm:px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="font-medium">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 sm:px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* <Navbar /> */}
            {!editingShipment && !creatingShipment && <ShipmentsListing />}
            {viewingShipment && <ShipmentDetailsView shipment={viewingShipment} />}
            {editingShipment && (
                <ShipmentEditForm
                    shipment={editingShipment}
                    onCancel={() => setEditingShipment(null)}
                />
            )}
            {creatingShipment && (
                <ShipmentCreateForm onCancel={() => setCreatingShipment(false)} />
            )}
        </>
    );
}