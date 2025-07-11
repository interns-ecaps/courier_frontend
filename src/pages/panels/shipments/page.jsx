// src/pages/panels/shipments/page.jsx
import { Edit2, Eye, Plus, Copy, Trash2, X, Check, XCircle, Package, Truck, Calendar, DollarSign, Users, MapPin, Clock, TrendingUp } from "lucide-react";
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
    { key: "price", label: "Price" },
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
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");

    const tabs = [
        { key: "all", label: "All Shipments", icon: Package },
        { key: "pending", label: "Pending", icon: Clock },
        { key: "in_transit", label: "In Transit", icon: Truck },
        { key: "accepted", label: "Accepted", icon: Check },
        { key: "delivered", label: "Delivered", icon: TrendingUp },
        { key: "rejected", label: "Rejected", icon: XCircle },
        { key: "cancelled", label: "Cancelled", icon: X },
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
                // Add status_type filter if not "all"
                if (activeTab !== "all") {
                    filters.status_type = activeTab;
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
    }, [user, currentPage, activeTab]);

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

    const statusBadge = (status) => {
        const s = status?.toLowerCase();
        let classes = "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all duration-200";

        if (s === "pending") classes += " bg-yellow-50 text-yellow-700 border-yellow-200";
        else if (s === "in_transit") classes += " bg-blue-50 text-blue-700 border-blue-200";
        else if (s === "accepted" || s === "delivered") classes += " bg-green-50 text-green-700 border-green-200";
        else if (s === "rejected") classes += " bg-red-50 text-red-700 border-red-200";
        else if (s === "cancelled") classes += " bg-gray-50 text-gray-600 border-gray-200";
        else classes += " bg-gray-50 text-gray-600 border-gray-200";

        return (
            <span className={classes}>
                <div className={`w-2 h-2 rounded-full mr-2 ${s === "pending" ? "bg-yellow-500" :
                    s === "in_transit" ? "bg-blue-500" :
                        (s === "accepted" || s === "delivered") ? "bg-green-500" :
                            s === "rejected" ? "bg-red-500" :
                                s === "cancelled" ? "bg-gray-400" : "bg-gray-400"
                    }`}></div>
                {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}
            </span>
        );
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Tracking number copied to clipboard!");
    };

    const ShipmentsListing = () => (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl shadow-xl mb-8 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                        Shipment Management
                                    </h1>
                                    <p className="text-orange-100 text-sm sm:text-base">
                                        Track and manage all your shipments in one place
                                    </p>
                                </div>
                            </div>
                            {(user?.user_type === "importer_exporter" || user?.user_type === "super_admin") && (
                                <button
                                    onClick={handleCreate}
                                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:bg-white/30 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Shipment
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                                <p className="text-2xl font-bold text-gray-900">{totalRows}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Transit</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {backendShipments.filter(s => s.status_type?.toLowerCase() === 'in_transit').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {backendShipments.filter(s => s.status_type?.toLowerCase() === 'pending').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Delivered</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {backendShipments.filter(s => s.status_type?.toLowerCase() === 'delivered').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
                    {/* Tabs UI */}
                    <div className="p-6 border-b border-orange-100">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {tabs.map(tab => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-sm border-2 flex items-center gap-2 whitespace-nowrap ${
                                            activeTab === tab.key 
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 scale-105 shadow-lg' 
                                                : 'bg-white/80 text-gray-700 border-orange-200 hover:bg-orange-50 hover:scale-105 hover:shadow-md'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-orange-50 border-b border-orange-100">
                                    <tr>
                                        {['super_admin', 'supplier'].includes(user?.user_type) && (
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Sender
                                                </div>
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Recipient
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4" />
                                                Supplier
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">
                                            <div className="flex items-center gap-2 justify-end">
                                                <DollarSign className="w-4 h-4" />
                                                Price
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                            <div className="flex items-center gap-2 justify-center">
                                                <Calendar className="w-4 h-4" />
                                                Pickup
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                            <div className="flex items-center gap-2 justify-center">
                                                <Clock className="w-4 h-4" />
                                                ETA
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                            <div className="flex items-center gap-2 justify-center">
                                                <MapPin className="w-4 h-4" />
                                                Tracking #
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-100">
                                    {loading && (
                                        <tr>
                                            <td colSpan={9} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                                                    <span className="text-gray-600 font-medium">Loading shipments...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && backendShipments.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="text-6xl opacity-50">📦</div>
                                                    <div className="text-gray-500">
                                                        <p className="text-xl font-semibold">No shipments found</p>
                                                        <p className="text-sm">No shipments match your current filter criteria.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && backendShipments.map((shipment) => (
                                        <tr
                                            key={shipment.id}
                                            className="group hover:bg-orange-50/50 transition-all duration-300"
                                        >
                                            {['super_admin', 'supplier'].includes(user?.user_type) && (
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{shipment.sender_name}</div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{shipment.recipient_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{shipment.supplier_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {statusBadge(shipment.status_type)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {shipment.package && shipment.package.final_cost != null ? (
                                                    <div className="font-semibold text-gray-900">
                                                        {shipment.package.final_cost} {shipment.package.currency || ''}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {shipment.pickup_date ? (
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(shipment.pickup_date).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {shipment.estimated_delivery ? (
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(shipment.estimated_delivery).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {shipment.tracking_number ? (
                                                    <button
                                                        onClick={() => copyToClipboard(shipment.tracking_number)}
                                                        className="font-mono text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
                                                        title="Click to copy"
                                                    >
                                                        {shipment.tracking_number}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        title="View Details"
                                                        onClick={() => handleView(shipment.id)}
                                                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-110"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {user?.user_type !== "supplier" && !["cancelled", "delivered", "accepted"].includes(shipment.status_type?.toLowerCase()) && (
                                                        <button
                                                            title="Edit Shipment"
                                                            onClick={() => handleEdit(shipment)}
                                                            className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 hover:scale-110"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-6 border-t border-orange-100 bg-gradient-to-r from-gray-50 to-orange-50">
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-white border border-orange-200 text-gray-700 font-semibold disabled:opacity-50 hover:bg-orange-50 transition-all duration-200"
                                >
                                    Previous
                                </button>
                                <span className="font-medium text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-white border border-orange-200 text-gray-700 font-semibold disabled:opacity-50 hover:bg-orange-50 transition-all duration-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
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