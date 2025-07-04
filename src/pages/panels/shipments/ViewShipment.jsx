import { Edit2 } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";



const shipmentsSampleData = [
  {
    id: 'SHP001',
    sender: 'Alice Johnson',
    recipient: 'Bob Smith',
    status: 'In Transit',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    weight: '5 kg',
    deliveryDate: '2024-06-15'
  },
  {
    id: 'SHP002',
    sender: 'Mary Lee',
    recipient: 'John Doe',
    status: 'Delivered',
    origin: 'Chicago, IL',
    destination: 'Houston, TX',
    weight: '10 kg',
    deliveryDate: '2024-06-10'
  },
  {
    id: 'SHP003',
    sender: 'Chris Green',
    recipient: 'Sara White',
    status: 'Pending',
    origin: 'San Francisco, CA',
    destination: 'Seattle, WA',
    weight: '3 kg',
    deliveryDate: '2024-06-18'
  }
];
export default function ShipmentDetailsView() {
  const { shipmentId } = useParams()
  const Navigate = useNavigate();


  const [shipment, setShipment] = useState(shipmentsSampleData.find((shipment) => shipment.id === shipmentId));

  if (shipment === undefined) {
    toast.error('Shipment not found');
    return <>
      <div className="flex justify-center items-center h-screen text-3xl text-red-600">
        <h1>Shipment not found</h1>
      </div>
    </>
  }

  const [inlineEditField, setInlineEditField] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [editingShipment, setEditingShipment] = useState(null);
  // State for edit-all mode that enables editing all fields one by one
  const [editAllMode, setEditAllMode] = useState(false);
  // Track order of fields for edit all traversal
  const editableFields = [
    { key: 'sender', label: 'Sender', type: 'text' },
    { key: 'recipient', label: 'Recipient', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Transit', 'Delivered', 'Cancelled'] },
    { key: 'origin', label: 'Origin', type: 'text' },
    { key: 'destination', label: 'Destination', type: 'text' },
    { key: 'weight', label: 'Weight', type: 'text' },
    { key: 'deliveryDate', label: 'Delivery Date', type: 'date' }
  ];
  // Index state for edit all mode: which field currently editing
  const [editAllIndex, setEditAllIndex] = useState(0);
  // Temp field value to keep during edit all multi-step editing
  const [editAllTempValue, setEditAllTempValue] = useState({
    sender: shipment.sender,
    recipient: shipment.recipient,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    weight: shipment.weight,
    deliveryDate: shipment.deliveryDate
  });

  // useEffect(() => {
  //     // Reset inline edit when Id changes, and edit all mode states
  //     setInlineEditField(null);
  //     setInlineEditValue('');
  //     setEditAllMode(false);
  //     setEditAllIndex(0);
  //     setEditAllTempValue('');
  // }, [Id]);

  const patchShipmentField = (shipmentId, field, value) => {
    // Find shipment to patch


    // Also update viewingShipment state if the patched shipment is being viewed
    if (viewingShipment && viewingShipment.id === shipmentId) {
      setViewingShipment((prev) => ({ ...prev, [field]: value }));
    }
  };

  const startInlineEdit = (fieldKey, currentValue) => {
    setInlineEditField(fieldKey);
    setInlineEditValue(currentValue);
    setEditAllMode(false);
  };

  const saveShipment = () => {
    setEditAllMode(false);
    // api call with edit wala thing
    setShipment({ ...editAllTempValue })
    
  };

  const cancelInlineEdit = () => {
    setInlineEditField(null);
    setInlineEditValue('');
  };

  // const saveShipment = () => {
  //   const trimmedValue = inlineEditValue.toString().trim();
  //   // if (trimmedValue === '') {
  //   //     alert('Value cannot be empty');
  //   //     return;
  //   // }
  //   patchShipmentField(Id.id, inlineEditField, trimmedValue);
  //   setInlineEditField(null);
  //   setInlineEditValue('');
  // };

  // Handlers for edit all mode
  const startEditAll = () => {
    setEditAllMode(true);
    setEditAllIndex(0);
    // setEditAllTempValue(shipment[editableFields[0].key] || '');
    setInlineEditField(null);
  };

  const cancelEditAll = () => {
    setEditAllMode(false);
    setEditAllIndex(0);
    setEditAllTempValue('');
  };

  const saveEditAllField = () => {
    const field = editableFields[editAllIndex];
    const val = editAllTempValue.toString().trim();
    if (val === '') {
      alert('Value cannot be empty');
      return;
    }
    patchShipmentField(shipment.id, field.key, val);
    // Move to next field or finish edit all mode
    if (editAllIndex < editableFields.length - 1) {
      const nextIndex = editAllIndex + 1;
      setEditAllIndex(nextIndex);
      setEditAllTempValue(shipment[editableFields[nextIndex].key] || '');
    } else {
      // Finished editing all
      setEditAllMode(false);
      setEditAllIndex(0);
      setEditAllTempValue('');
    }
  };

  const onEditAllValueChange = (key, e) => {
    console.log();

    setEditAllTempValue({
      ...editAllTempValue,
      [key]: e.target.value
    });
  };

  // Inline edit input for edit all mode or single inline field
  const renderFieldInput = (field) => {
    const value =  editAllTempValue[field.key] 
    console.log(field.key);

    if (field.type === 'select') {
      return (
        <select
          autoFocus
          value={value}
          onChange={(e) => onEditAllValueChange(field.key, e) }
          // onBlur={() => {
          //   if (!editAllMode) saveShipment();
          // }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (editAllMode) saveEditAllField();
              else saveShipment();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              if (editAllMode) cancelEditAll();
              else cancelInlineEdit();
            }
          }}
          className="border border-orange-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'date') {
      return (
        <input
          type="date"
          autoFocus
          value={value}
          onChange={(element) =>  onEditAllValueChange(field.key, element)}
          onBlur={() => {
            if (!editAllMode) saveShipment();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (editAllMode) saveEditAllField();
              else saveShipment();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              if (editAllMode) cancelEditAll();
              else cancelInlineEdit();
            }
          }}
          className="border border-orange-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      );
    }
    return (
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(element) =>onEditAllValueChange(field.key, element)}
        onBlur={() => {
          if (!editAllMode) saveShipment();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (editAllMode) saveEditAllField();
            else saveShipment();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            if (editAllMode) cancelEditAll();
            else cancelInlineEdit();
          }
        }}
        className="border border-orange-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    );
  };

  return (
    <div className="bg-white mt-10 bg-opacity-90 backdrop-blur-md p-8 rounded-3xl border border-orange-200 shadow-lg max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Shipment Details - {shipment.id}</h2>

      {/* Edit All Button */}
      {/* <div className="mb-6 flex justify-end">
                {!editAllMode ? (
                    <button
                        onClick={startEditAll}
                        className="bg-orange-500 text-white px-6 py-2 rounded-xl hover:bg-orange-600 shadow-md transition flex items-center gap-2"
                        aria-label="Edit all shipment details"
                    >
                        <Edit2 className="w-5 h-5" />
                        Edit All
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-orange-600 font-semibold">
                            Editing: {editableFields[editAllIndex].label}
                        </span>
                        {renderFieldInput(editableFields[editAllIndex])}
                        <button
                            onClick={saveEditAllField}
                            className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 shadow transition"
                            aria-label="Save field"
                        >
                            Save
                        </button>
                        <button
                            onClick={cancelEditAll}
                            className="bg-orange-100 text-orange-700 px-4 py-1 rounded hover:bg-orange-200 shadow transition"
                            aria-label="Cancel edit all"
                        >
                            Cancel
                        </button>
                    </div> */}
      {/* )} */}
      {/* </div> */}

      {/* Grid container for details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 text-lg">
        {editableFields.map(({ key, label, type, options }) => {
          // Show inline edit input if inlineEditField matches this field and not in editAll mode
          const isEditingThisField = editAllMode || inlineEditField === key;
          console.log(isEditingThisField);

          const valueToShow = shipment[key] || '';
          return (
            <div
              key={key}
              className="relative group p-3 rounded-lg hover:bg-orange-50 cursor-default"
            >
              <p className="font-semibold">{label}:</p>
              {isEditingThisField ? (
                renderFieldInput({ key, label, type, options })
              ) : (
                <p className="mt-1 text-gray-800">{valueToShow}</p>
              )}
              {/* Edit pen button on hover - only if not editing all or editing this field */}
              {!editAllMode && (
                <button
                  onClick={() => {
                    if (!isEditingThisField) startInlineEdit(key, valueToShow);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 hover:text-orange-700"
                  aria-label={`Edit ${label}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      startInlineEdit(key, valueToShow);
                    }
                  }}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => Navigate('/shipments')}
          className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 shadow-md transition"
        >
          Back to List
        </button>
        {!editAllMode ? (
          <button
            onClick={() => startEditAll()}
            className="bg-orange-100 text-orange-700 px-5 py-2 rounded-xl hover:bg-orange-200 shadow-md transition"
          >
            Edit Shipment (Full Page)
          </button>
        ) : (
          <button
            onClick={() => saveShipment()}
            className="bg-orange-100 text-orange-700 px-5 py-2 rounded-xl hover:bg-orange-200 shadow-md transition"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
};