import { Edit2, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";

const shipmentsSampleData = [
    {
        id: "SHP001",
        sender: "Alice Johnson",
        recipient: "Bob Smith",
        status: "In Transit",
        origin: "New York, NY",
        destination: "Los Angeles, CA",
        weight: "5 kg",
        deliveryDate: "2024-06-15",
    },
    {
        id: "SHP002",
        sender: "Mary Lee",
        recipient: "John Doe",
        status: "Delivered",
        origin: "Chicago, IL",
        destination: "Houston, TX",
        weight: "10 kg",
        deliveryDate: "2024-06-10",
    },
    {
        id: "SHP003",
        sender: "Chris Green",
        recipient: "Sara White",
        status: "Pending",
        origin: "San Francisco, CA",
        destination: "Seattle, WA",
        weight: "3 kg",
        deliveryDate: "2024-06-18",
    },
    {
        id: "SHP004",
        sender: "Tom Black",
        recipient: "Lucy Blue",
        status: "Accepted",
        origin: "Miami, FL",
        destination: "Atlanta, GA",
        weight: "7 kg",
        deliveryDate: "2024-06-20",
    },
    {
        id: "SHP005",
        sender: "Jane Doe",
        recipient: "Martin King",
        status: "Rejected",
        origin: "Boston, MA",
        destination: "Denver, CO",
        weight: "12 kg",
        deliveryDate: "2024-06-25",
    },
];

// Define the possible tabs/key names
const tabsConfig = [
    { key: "open", label: "Open Shipments" },
    { key: "accepted", label: "Accepted Shipments" },
    { key: "rejected", label: "Rejected Shipments" },
];

export default function Shipment() {
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [shipments, setShipments] = useState(shipmentsSampleData);
    const [viewingShipment, setViewingShipment] = useState(null);
    const [editingShipment, setEditingShipment] = useState(null);
    const [activeTab, setActiveTab] = useState("open"); // default to open shipments

    const nav = useNavigate();

    // Filtering shipments based on the selected tab
    const filteredShipments = shipments.filter((shipment) => {
        if (activeTab === "open") {
            // Define "Open Shipments" as those with status Pending or In Transit
            return shipment.status === "Pending" || shipment.status === "In Transit";
        }
        if (activeTab === "accepted") {
            return shipment.status === "Accepted" || shipment.status === "Delivered";
        }
        if (activeTab === "rejected") {
            return shipment.status === "Rejected" || shipment.status === "Cancelled";
        }
        return true;
    });

    const handleSaveEdit = (updatedShipment) => {
        setShipments((prev) =>
            prev.map((s) => (s.id === updatedShipment.id ? updatedShipment : s))
        );
        setEditingShipment(null);
    };

    const handleCreate = () => {
        nav(`/shipments/create`);
    };

    const handleCreateShipment = (newShipment) => {
        setShipments((prev) => [...prev, newShipment]);
        setCreatingShipment(false);
    };

    const handleView = (shipmentId) => {
        nav(`/shipments/${shipmentId}`);
    };

    const handleEdit = (shipment) => {
        setEditingShipment(shipment);
        setViewingShipment(null);
    };

    // Tab menu component
    const Tabs = () => (
        <div className="flex gap-4 border-b border-orange-300 mb-6">
            {tabsConfig.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-6 py-2 rounded-t-xl font-semibold transition 
                        ${
                            activeTab === key
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
        <>
            <div className="overflow-x-auto bg-white bg-opacity-90 backdrop-blur-md rounded-3xl border border-orange-200 p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Shipments List</h2>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow-md transition"
                        aria-label="Create new shipment"
                    >
                        <Plus className="w-5 h-5" />
                        Create Shipment
                    </button>
                </div>

                {/* Render tabs */}
                <Tabs />

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-orange-100 text-orange-700 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 border-b border-orange-200">ID</th>
                            <th className="py-3 px-6 border-b border-orange-200">Sender</th>
                            <th className="py-3 px-6 border-b border-orange-200">Recipient</th>
                            <th className="py-3 px-6 border-b border-orange-200">Status</th>
                            <th className="py-3 px-6 border-b border-orange-200">Origin</th>
                            <th className="py-3 px-6 border-b border-orange-200">Destination</th>
                            <th className="py-3 px-6 border-b border-orange-200">Weight</th>
                            <th className="py-3 px-6 border-b border-orange-200">Delivery Date</th>
                            <th className="py-3 px-6 border-b border-orange-200 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm">
                        {filteredShipments.length === 0 && (
                            <tr>
                                <td colSpan="9" className="py-4 text-center text-gray-500">
                                    No shipments found in this category.
                                </td>
                            </tr>
                        )}
                        {filteredShipments.map((shipment) => (
                            <tr
                                key={shipment.id}
                                className="border-b border-orange-200 hover:bg-orange-50 transition-colors"
                            >
                                <td className="py-3 px-6">{shipment.id}</td>
                                <td className="py-3 px-6">{shipment.sender}</td>
                                <td className="py-3 px-6">{shipment.recipient}</td>
                                <td className="py-3 px-6">{shipment.status}</td>
                                <td className="py-3 px-6">{shipment.origin}</td>
                                <td className="py-3 px-6">{shipment.destination}</td>
                                <td className="py-3 px-6">{shipment.weight}</td>
                                <td className="py-3 px-6">{shipment.deliveryDate}</td>
                                <td className="py-3 px-6 text-center flex justify-center gap-3">
                                    <button
                                        title="View Details"
                                        onClick={() => handleView(shipment.id)}
                                        className="text-orange-600 hover:text-orange-700 transition"
                                        aria-label={`View shipment ${shipment.id}`}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        title="Edit Shipment"
                                        onClick={() => handleEdit(shipment)}
                                        className="text-orange-600 hover:text-orange-700 transition"
                                        aria-label={`Edit shipment ${shipment.id}`}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    // Keep your ShipmentEditForm and ShipmentCreateForm unchanged from your original code
    // I'll include them unchanged here for completeness:
    // (Same as before, omitted here for brevity in this snippet)

    // To avoid clutter, only add ShipmentsListing with tabs here; the other forms can stay the same.

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
            {creatingShipment && <ShipmentCreateForm onCancel={() => setCreatingShipment(false)} />}
        </>
    );
}