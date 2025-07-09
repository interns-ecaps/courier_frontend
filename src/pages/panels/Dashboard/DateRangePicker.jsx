import React from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function DateRangePicker({ value, onChange, onApply }) {
  // Defensive fallback for value
  const safeValue = value && value.startDate && value.endDate && value.key
    ? value
    : {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      };
  return (
    <div className="rounded-2xl shadow-lg p-4 bg-white w-full max-w-xs mx-auto">
      <DateRange
        editableDateInputs={true}
        onChange={onChange}
        moveRangeOnFirstSelection={false}
        ranges={[safeValue]}
        rangeColors={["#f97316"]}
        showMonthAndYearPickers={true}
        showDateDisplay={false}
        className="rounded-2xl"
      />
      <button
        className="w-full mt-4 py-2 rounded-full bg-orange-700 text-white font-bold text-lg shadow"
        onClick={onApply}
      >
        Apply
      </button>
    </div>
  );
} 