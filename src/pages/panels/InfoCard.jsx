import { Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import axios from "axios";

const InfoCard = ({ title, fields, addressData, index, onDelete }) => {
  const [editField, setEditField] = useState(null);
  const [editedData, setEditedData] = useState(addressData);
  const [hoveredField, setHoveredField] = useState(null);
  const [editAll, setEditAll] = useState(false);

  const resetEdits = () => {
    setEditedData(addressData);
    setEditAll(false);
    setEditField(null);
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveEdit = async (field) => {
    setEditField(null);
    const accessToken = sessionStorage.getItem("accessToken");
    try {
      await axios.patch(`http://localhost:8000/user/v1/update_address/${addressData.id}`, {
        [field]: editedData[field],
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error("Failed to update address field", err);
    }
  };

  const saveAllEdits = async () => {
    const accessToken = sessionStorage.getItem("accessToken");
    try {
      await axios.put(`http://localhost:8000/user/v1/replace_address/${addressData.id}`, editedData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setEditAll(false);
    } catch (err) {
      console.error("Failed to update address (PUT)", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md group relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          {!editAll ? (
            <button
              onClick={() => {
                setEditAll(true);
                setEditField(null);
              }}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Edit All
            </button>
          ) : (
            <>
              <button
                onClick={saveAllEdits}
                className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600"
              >
                Save All
              </button>
              <button
                onClick={resetEdits}
                className="bg-gray-300 text-sm px-3 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map(({ field, label }) => (
          <div
            key={field}
            className="relative"
            onMouseEnter={() => setHoveredField(field)}
            onMouseLeave={() => setHoveredField(null)}
          >
            <label className="block text-sm text-gray-500">{label}</label>

            {editAll || editField === field ? (
              <div className="flex items-center gap-2">
                <input
                  value={editedData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onBlur={() => !editAll && saveEdit(field)}
                  autoFocus={!editAll}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                />
                {!editAll && (
                  <>
                    <button
                      onClick={() => saveEdit(field)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={resetEdits}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-800 text-sm">{editedData[field] || "—"}</p>
                {hoveredField === field && (
                  <button
                    onClick={() => {
                      setEditField(field);
                      setEditAll(false);
                    }}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoCard;
