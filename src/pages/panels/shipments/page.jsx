// src/pages/panels/shipments/page.jsx
import { Edit2, Eye, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { getAllShipments, updateShipmentStatus } from "../../../services/shipmentService";

const tabsConfig = [
    { key: "open", label: "Open Shipments" },
    { key: "accepted", label: "Accepted Shipments" },
    { key: "rejected", label: "Rejected Shipments" },
];

const shipmentFields = [
    { key: "id", label: "ID" },
    { key: "sender_name", label: "Sender" },
    { key: "recipient_name", label: "Recipient" },
    { key: "status_type", label: "Status" },
    { key: "pickup_date", label: "Pickup Date" },
    { key: "delivery_date", label: "Delivery Date" },
    { key: "courier_id", label: "Courier ID" },
    { key: "tracking_number", label: "Tracking #" },
];

export default function Shipment() {
    const [user, setUser] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [viewingShipment, setViewingShipment] = useState(null);
    const [editingShipment, setEditingShipment] = useState(null);
    const [activeTab, setActiveTab] = useState("open");

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
                        recipient_id: user.id,
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

    const handleView = (shipmentId) => {
        nav(`/shipments/${shipmentId}`);
    };

    const handleEdit = (shipment) => {
        setEditingShipment(shipment);
        setViewingShipment(null);
    };

    const handleCreate = () => {
        nav(`/shipments/create`);
    };

    console.log("User type:", user?.user_type);
    console.log("Total shipments:", shipments.length);
    console.log("Shipments data:", shipments);

    const filteredShipments = shipments.filter((shipment) => {
        console.log("Filtering shipment:", shipment.id, "Status:", shipment.status_type);

        const status = shipment.status_type?.toLowerCase();
        console.log("Status:", status);
        if (user?.user_type === "supplier") {
            if (activeTab === "open") return status === "pending";
            if (activeTab === "accepted") return ["accepted", "delivered"].includes(status);
            if (activeTab === "rejected") return ["rejected", "cancelled"].includes(status);
        }

        if (activeTab === "open") return ["PENDING", "IN_TRANSIT"].includes(status);
        if (activeTab === "accepted") return ["ACCEPTED", "DELIVERED"].includes(status);
        if (activeTab === "rejected") return ["REJECTED", "CANCELLED"].includes(status);

        return true;
    });
    console.log("Filtered Shipments rendering:", filteredShipments);

    const Tabs = () => (
        <div className="flex gap-4 border-b border-orange-300 mb-6">
            {tabsConfig.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-6 py-2 rounded-t-xl font-semibold transition 
              ${activeTab === key
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        }`}
                    aria-selected={activeTab === key}
                >
                    {label}
                </button>
            ))}
        </div>
    );

    const ShipmentsListing = () => (
        <div className="overflow-x-auto bg-white bg-opacity-90 backdrop-blur-md rounded-3xl border border-orange-200 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Shipments List</h2>
                {user?.user_type !== "supplier" && (
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow-md transition"
                        aria-label="Create new shipment"
                    >
                        <Plus className="w-5 h-5" />
                        Create Shipment
                    </button>
                )}
            </div>

            <Tabs />


            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-orange-100 text-orange-700 uppercase text-sm leading-normal">
                        {shipmentFields.map((field) => (
                            <th key={field.key} className="py-3 px-6 border-b border-orange-200">
                                {field.label}
                            </th>
                        ))}
                        <th className="py-3 px-6 border-b border-orange-200 text-center">Action</th>
                    </tr>
                </thead>

                <tbody className="text-gray-700 text-sm">
                    {loading && (
                        <tr>
                            <td colSpan={shipmentFields.length + 1} className="py-4 text-center text-gray-500">
                                Loading shipments...
                            </td>
                        </tr>
                    )}
                    {!loading && filteredShipments.length === 0 && (
                        <tr>
                            <td colSpan={shipmentFields.length + 1} className="py-4 text-center text-gray-500">
                                No shipments found in this category.
                            </td>
                        </tr>
                    )}
                    {!loading && filteredShipments.map((shipment) => {
                        const showDecisionButtons =
                            user?.user_type === "supplier" &&
                            activeTab === "open" &&
                            shipment.status_type?.toLowerCase() === "pending";

                        return (
                            <tr key={shipment.id} className="border-b border-orange-200 hover:bg-orange-50 transition-colors">
                                {shipmentFields.map((field) => {
                                    let value = shipment[field.key];

                                    // Format status_type (capitalize first letter)
                                    if (field.key === "status_type" && typeof value === "string") {
                                        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                    }

                                    // Format dates
                                    if (["pickup_date", "delivery_date"].includes(field.key)) {
                                        value = value ? new Date(value).toLocaleDateString() : "-";
                                    }

                                    return (
                                        <td key={field.key} className="py-3 px-6">
                                            {value ?? "-"}
                                        </td>
                                    );
                                })}
                                <td className="py-3 px-6 text-center flex justify-center gap-3">
                                    <button
                                        title="View Details"
                                        onClick={() => handleView(shipment.id)}
                                        className="text-orange-600 hover:text-orange-700 transition"
                                        aria-label={`View shipment ${shipment.id}`}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    {user?.user_type !== "supplier" && (
                                        <button
                                            title="Edit Shipment"
                                            onClick={() => handleEdit(shipment)}
                                            className="text-orange-600 hover:text-orange-700 transition"
                                            aria-label={`Edit shipment ${shipment.id}`}
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    {showDecisionButtons && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(shipment.id, "accepted")}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(shipment.id, "rejected")}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
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