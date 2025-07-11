import React, { useState } from 'react';
import {
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  X,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

const ShipmentStatusTracker = ({ currentStatus, statusHistory = [], onStatusUpdate }) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Define the status flow with their display info
  const statusFlow = [
    {
      key: 'PENDING',
      label: 'Pending',
      icon: Clock,
      description: 'Shipment created and awaiting processing'
    },
    {
      key: 'ACCEPTED',
      label: 'Accepted',
      icon: Check,
      description: 'Shipment accepted by supplier'
    },
    {
      key: 'IN_TRANSIT',
      label: 'In Transit',
      icon: Truck,
      description: 'Package is on its way'
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      icon: Package,
      description: 'Package has been delivered'
    }
  ];

  // Special statuses like Cancelled, Rejected, etc.
  const specialStatuses = {
    'CANCELLED': { label: 'Cancelled', icon: X, color: 'text-red-500' },
    'REJECTED': { label: 'Rejected', icon: XCircle, color: 'text-red-500' },
    'RETURNED': { label: 'Returned', icon: MapPin, color: 'text-yellow-500' }
  };

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex(status => status.key === currentStatus);
  };

  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

  const getCurrentStatusLabel = () => {
    const currentStatusObj = statusFlow.find(status => status.key === currentStatus);
    return currentStatusObj ? currentStatusObj.label : currentStatus;
  };

  const handleStatusUpdateClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus || !onStatusUpdate) return;

    setIsUpdating(true);
    setShowConfirmModal(false);
    
    try {
      await onStatusUpdate(nextStatus.key);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowConfirmModal(false);
  };

  const getStatusState = (status, index) => {
    const currentIndex = getCurrentStatusIndex();

    if (currentIndex === -1) return 'future';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) {
      return status.key === 'DELIVERED' ? 'completed' : 'current';
    }
    return 'future';
  };

  const getStatusColor = (status, index) => {
    const state = getStatusState(status, index);
    switch (state) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-orange-500 text-white border-orange-500';
      case 'future':
        return 'bg-gray-200 text-gray-500 border-gray-300';
      default:
        return 'bg-gray-200 text-gray-500 border-gray-300';
    }
  };

  const getTextColor = (status, index) => {
    const state = getStatusState(status, index);
    switch (state) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-orange-600';
      case 'future':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectorColor = (index) => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex === -1) return 'bg-gray-300';
    return index < currentIndex ? 'bg-green-400' : 'bg-gray-300';
  };

  // -- FIX: Do not show update button if delivery or special terminal status --
  const isTerminalStatus = currentStatus === 'DELIVERED' || specialStatuses.hasOwnProperty(currentStatus);

  // Handle special statuses UI early return
  if (specialStatuses[currentStatus]) {
    const specialStatus = specialStatuses[currentStatus];
    const IconComponent = specialStatus.icon;

    return (
      <div className="bg-white rounded-xl p-4 shadow border border-red-100 mb-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
            currentStatus === 'CANCELLED' || currentStatus === 'REJECTED'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <IconComponent size={20} className={specialStatus.color} />
            <span className={`font-semibold text-base ${specialStatus.color}`}>
              {specialStatus.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Sort statusHistory
  const sortedHistory = [...statusHistory].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Only show the first occurrence of each key status in a fixed order
  const keyStatuses = ["PENDING", "ACCEPTED", "IN_TRANSIT", "DELIVERED"];
  const uniqueStatusMap = {};
  const uniqueHistoryMap = {};
  for (const entry of sortedHistory) {
    const status = (entry.status || "").toUpperCase();
    if (keyStatuses.includes(status) && !uniqueStatusMap[status]) {
      uniqueStatusMap[status] = true;
      uniqueHistoryMap[status] = entry;
    }
  }
  // Build the timeline in the fixed order
  const orderedHistory = keyStatuses
    .filter(status => uniqueHistoryMap[status])
    .map(status => uniqueHistoryMap[status]);

  const nextStatus = getNextStatus();

  return (
    <div className="w-full px-1 mb-6">
      {/* Update Button - only render if NOT terminal and nextStatus is present */}
      {!isTerminalStatus && nextStatus && onStatusUpdate && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleStatusUpdateClick}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
              isUpdating
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
            ) : (
              <ArrowRight size={16} />
            )}
            Update to {nextStatus.label}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/40 transition-all duration-200 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-orange-700">Confirm Status Update</h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to update the status from{' '}
              <span className="font-semibold text-orange-600">{getCurrentStatusLabel()}</span> to{' '}
              <span className="font-semibold text-orange-600">{nextStatus?.label}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelUpdate}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {statusFlow.map((status, index) => {
            const IconComponent = status.icon;

            return (
              <React.Fragment key={status.key}>
                <div className="flex flex-col items-center relative max-w-[80px]">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStatusColor(status, index)}`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="mt-1 text-center">
                    <div className={`font-medium text-xs leading-tight ${getTextColor(status, index)}`}>
                      {status.label}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">
                      {status.description}
                    </div>
                  </div>
                  {getStatusState(status, index) === 'current' && status.key !== 'DELIVERED' && (
                    <div className="absolute -bottom-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* Connector Line */}
                {index < statusFlow.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 rounded transition-all duration-300 ${getConnectorColor(index)}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {statusFlow.map((status, index) => {
            const IconComponent = status.icon;

            return (
              <div key={status.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${getStatusColor(status, index)}`}>
                  <IconComponent size={14} />
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm leading-snug ${getTextColor(status, index)}`}>
                    {status.label}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {status.description}
                  </div>
                </div>
                {getStatusState(status, index) === 'current' && status.key !== 'DELIVERED' && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status History Dropdown */}
      {(orderedHistory.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-orange-600 focus:outline-none"
          >
            <span>Status History</span>
            {isHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isHistoryExpanded && (
            <div className="mt-2 space-y-1">
              {orderedHistory.map((history, index) => {
                let label = history.status.replace('_', ' ');
                if (history.status === 'PENDING') label = 'CREATED';
                if (history.status === 'IN_TRANSIT') label = 'SHIPPED';
                return (
                  <div key={index} className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-medium">{label.toUpperCase()}</span>
                    <span>{new Date(history.created_at).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentStatusTracker;