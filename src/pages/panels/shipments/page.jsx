// src/pages/panels/shipments/page.jsx
import { Edit2, Eye, Plus, Copy, Trash2, X, Check, XCircle } from "react-feather";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { getAllShipments, updateShipmentStatus, cancelShipment as cancelShipmentApi, acceptShipment, rejectShipment } from "../../../services/shipmentService";
import { getPackageById } from "../../../services/packageService";
import { toast } from "react-toastify";

export default function Shipment() {
    const [user, setUser] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [viewingShipment, setViewingShipment] = useState(null);
    const [editingShipment, setEditingShipment] = useState(null);
    const [activeTab, setActiveTab] = useState("open");
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

    useEffect(() => {
        const fetchShipments = async () => {
            if (!user) return;

            try {
                let response;

                let filters = {};

                if (user.user_type === "supplier") {
                    filters = {}; // suppliers see all
                } else if (user.user_type === "courier") {
                    filters = { courier_id: user.id }; // filter by assigned courier
                } else if (user.user_type === "super_admin") {
                    filters = {}; // super admins see everything
                } else {
                    filters = {
                        sender_id: user.id,
                    }; // importer/exporter
                }

                response = await getAllShipments(filters);

                console.log("Raw response:", response);
                console.log("Response structure:", {
                    hasData: !!response?.data,
                    hasResults: !!response?.data?.results,
                    isArray: Array.isArray(response?.data?.results),
                    directArray: Array.isArray(response?.data),
                    responseKeys: Object.keys(response || {}),
                    dataKeys: Object.keys(response?.data || {})
                });

                // Try different possible response structures
                let shipmentResults = [];

                if (response?.results && Array.isArray(response.results)) {
                    shipmentResults = response.results;
                } else if (response?.data?.results && Array.isArray(response.data.results)) {
                    shipmentResults = response.data.results;
                } else if (Array.isArray(response?.data)) {
                    shipmentResults = response.data;
                } else if (Array.isArray(response)) {
                    shipmentResults = response;
                } else {
                    console.warn("Unexpected response structure:", response);
                }

                console.log("Parsed shipments:", shipmentResults);
                console.log("First shipment sample:", shipmentResults[0]);

                // Fetch all unique packageIds
                const uniquePackageIds = [...new Set(shipmentResults.map(s => s.package_id).filter(Boolean))];
                const packageMap = {};
                await Promise.all(uniquePackageIds.map(async (pid) => {
                    try {
                        const res = await getPackageById(pid);
                        packageMap[pid] = res.data;
                    } catch (e) {
                        packageMap[pid] = null;
                    }
                }));

                // Attach final_cost to each shipment
                shipmentResults = shipmentResults.map(s => ({
                    ...s,
                    final_cost: packageMap[s.package_id]?.final_cost ?? null
                }));

                setShipments(shipmentResults);

            } catch (error) {
                console.error("Failed to fetch shipments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShipments();
    }, [user]);

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

    // Tabs configuration
    const baseTabs = [
        { key: "open", label: "Open" },
        { key: "accepted", label: "Accepted" },
        { key: "delivered", label: "Delivered" },
        { key: "rejected", label: "Rejected" },
    ];
    const tabCounts = {
        // open: shipments.filter(s => ["pending", "in_transit"].includes(s.status_type?.toLowerCase())).length,
        open: shipments.filter(s => s.status_type?.toLowerCase() === "pending").length,
        accepted: shipments.filter(s => s.status_type?.toLowerCase() === "accepted").length,
        delivered: shipments.filter(s => s.status_type?.toLowerCase() === "delivered").length,
        rejected: shipments.filter(s => ["rejected"].includes(s.status_type?.toLowerCase())).length,
        cancelled: shipments.filter(s => ["cancelled"].includes(s.status_type?.toLowerCase())).length,
    };
    const tabsConfig = user?.user_type === "importer_exporter"
        ? [...baseTabs, { key: "cancelled", label: "Cancelled" }]
        : baseTabs;

    const filteredShipments = shipments.filter((shipment) => {
        const status = shipment.status_type?.toLowerCase();
        if (user?.user_type === "supplier") {
            if (activeTab === "open") return status === "pending";
            if (activeTab === "accepted") return status === "accepted";
            if (activeTab === "delivered") return status === "delivered";
            if (activeTab === "rejected") return ["rejected", "cancelled"].includes(status);
        }
        // if (activeTab === "open") return ["pending", "in_transit"].includes(status);
        if (activeTab === "open") return status === "pending";
        if (activeTab === "accepted") return status === "accepted";
        if (activeTab === "delivered") return status === "delivered";
        if (activeTab === "rejected") return ["rejected"].includes(status);
        if (user?.user_type === "importer_exporter" && activeTab === "cancelled") return status === "cancelled";
        return true;
    });
    console.log("Filtered Shipments rendering:", filteredShipments);

    const Tabs = () => (
        <div className="flex gap-2 mb-8">
            {tabsConfig.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 ${activeTab === key ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}
                >
                    {label}
                    {tabCounts[key] > 0 && (
                        <span className="ml-2 bg-white text-orange-500 rounded-full px-2 py-0.5 text-xs font-bold">{tabCounts[key]}</span>
                    )}
                </button>
            ))}
        </div>
    );

    const statusBadge = (status) => {
        const s = status?.toLowerCase();
        let classes = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

        if (s === "pending") classes += " bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300";
        else if (s === "in_transit") classes += " bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300";
        else if (s === "accepted" || s === "delivered") classes += " bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300";
        else if (s === "rejected") classes += " bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300";
        else if (s === "cancelled") classes += " bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300";
        else classes += " bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300";

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

    const baseShipmentFields = [
        { key: "serial", label: "S/N" },
        { key: "sender_name", label: "Sender" },
        { key: "recipient_name", label: "Recipient" },
        { key: "supplier_name", label: "Supplier" },
        { key: "status_type", label: "Status" },
        { key: "pickup_date", label: "Pickup Date" },
        { key: "estimated_delivery", label: "ETA" },
        { key: "tracking_number", label: "Tracking #" },
        { key: "price", label: "Price" },
    ];
    const shipmentFields = (user?.user_type === 'importer_exporter')
        ? baseShipmentFields.filter(f => f.key !== 'sender_name')
        : baseShipmentFields;

    const ShipmentsListing = () => (
        <div className="min-h-screen p-8" style={{ background: '#fff7f0' }}>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Shipments Management
                        </h1>
                        <p className="text-gray-600 mt-2">Track and manage all your shipments in one place</p>
                    </div>
                    {(user?.user_type === "importer_exporter" || user?.user_type === "super_admin") && (
                    <button
                        onClick={handleCreate}
                        className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Create Shipment
                    </button>
                    )}
                </div>
                </div>

                <Tabs />

            {/* Table Container */}
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 w-full">
                    <div className="overflow-x-auto p-6">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    {shipmentFields.map((field) => (
                                        <th key={field.key} className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            {field.label}
                                        </th>
                                    ))}
                                    <th className="py-2 px-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                        </tr>
                    </thead>

                            <tbody className="divide-y divide-gray-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={shipmentFields.length + 1} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                                <span className="text-gray-500 font-medium">Loading shipments...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredShipments.length === 0 && (
                            <tr>
                                        <td colSpan={shipmentFields.length + 1} className="py-16 text-center">
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
                                {!loading && filteredShipments.map((shipment, index) => {
                                    const showDecisionButtons =
                                        user?.user_type === "supplier" &&
                                        activeTab === "open" &&
                                        shipment.status_type?.toLowerCase() === "pending";

                                    return (
                                        <tr key={shipment.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group">
                                            {shipmentFields.map((field) => {
                                                let value;
                                                if (field.key === 'serial') {
                                                    value = index + 1;
                                                } else {
                                                    value = shipment[field.key];
                                                }
                                                let cellClass = "py-2 px-3 text-sm text-gray-700";
                                                // Make wide columns truncate
                                                if (["tracking_number", "supplier_name", "recipient_name"].includes(field.key)) {
                                                    cellClass += " max-w-[10rem] truncate";
                                                }

                                                // For price, use shipment.final_cost
                                                if (field.key === "price") {
                                                    value = shipment.final_cost;
                                                    value = value !== undefined && value !== null ? `₹${value}` : <span className="text-gray-400 italic">N/A</span>;
                                                }

                                                // Format status_type (capitalize first letter)
                                                if (field.key === "status_type" && typeof value === "string") {
                                                    value = statusBadge(value);
                                                }

                                                // Format dates
                                                if (["pickup_date", "estimated_delivery"].includes(field.key)) {
                                                    value = value ? new Date(value).toLocaleDateString() : (
                                                        <span className="text-gray-400 italic">Not set</span>
                                                    );
                                                }

                                                // Copy tracking number
                                                if (field.key === "tracking_number" && value) {
                                                    value = (
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-lg max-w-xs truncate inline-block whitespace-nowrap"
                                                                title={value}
                                                            >
                                                                {value}
                                                            </span>
                                                            <button
                                                                aria-label="Copy tracking number"
                                                                onClick={() => copyToClipboard(value)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <td key={field.key} className={cellClass} title={typeof value === 'string' ? value : undefined}>
                                                        {value ?? <span className="text-gray-400 italic">N/A</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-2 px-3">
                                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        title="View Details"
                                                        aria-label={`View shipment ${shipment.id}`}
                                        onClick={() => handleView(shipment.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                                    >
                                                        <Eye size={18} />
                                    </button>
                                                    {user?.user_type !== "supplier" && !["cancelled", "delivered", "accepted"].includes(shipment.status_type?.toLowerCase()) && (
                                    <button
                                        title="Edit Shipment"
                                                            aria-label={`Edit shipment ${shipment.id}`}
                                        onClick={() => handleEdit(shipment)}
                                                            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                    )}
                                                    {/* Cancel button for importer_exporter if status is pending, in_transit, or accepted */}
                                                    {user?.user_type === "importer_exporter" && ["pending", "in_transit", "accepted"].includes(shipment.status_type?.toLowerCase()) && (
                                                        <button
                                                            onClick={() => handleCancelClick(shipment)}
                                                            className="p-2 hover:bg-orange-100 rounded-full"
                                                            aria-label="Cancel"
                                                        >
                                                            <X size={20} className="text-orange-500" />
                                                        </button>
                                                    )}
                                                    {showDecisionButtons && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAcceptShipment(shipment.id)}
                                                                disabled={acceptingShipmentId === shipment.id}
                                                                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center gap-1.5 ${acceptingShipmentId === shipment.id
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40'
                                                                    }`}
                                                                aria-label="Accept shipment"
                                                            >
                                                                {acceptingShipmentId === shipment.id ? (
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                                                ) : (
                                                                    <Check size={14} />
                                                                )}
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectShipment(shipment.id)}
                                                                disabled={rejectingShipmentId === shipment.id}
                                                                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center gap-1.5 ${rejectingShipmentId === shipment.id
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40'
                                                                    }`}
                                                                aria-label="Reject shipment"
                                                            >
                                                                {rejectingShipmentId === shipment.id ? (
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                                                ) : (
                                                                    <XCircle size={14} />
                                                                )}
                                                                Reject
                                    </button>
                                                        </div>
                                                    )}
                                                </div>
                                </td>
                            </tr>
                                    );
                                })}
                    </tbody>
                </table>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
                        <div className="text-center">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Shipment</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to cancel shipment{" "}
                                <span className="font-mono font-semibold text-gray-900">#{shipmentToCancel?.tracking_number}</span>?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    Keep Shipment
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 transform hover:scale-105"
                                >
                                    Yes, Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Super Admin View: use the same ShipmentsListing UI as other users
    if (user?.user_type === 'super_admin') {
        return <ShipmentsListing />;
    }

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