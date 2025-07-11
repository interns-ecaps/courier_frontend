// src/pages/Auth/Terms.jsx
import React from 'react';
import { Truck } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-orange-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-orange-500 p-3 rounded-full">
            <Truck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-orange-600 text-center mb-4">
          Terms and Conditions
        </h1>
        <p className="text-gray-700 text-center mb-8">
          Welcome to our courier service platform. By accessing or using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
        </p>

        <div className="space-y-6 text-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">1. Account Registration</h2>
            <p>You must provide accurate and complete information during registration. You are responsible for safeguarding your account and agree not to share your login credentials.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">2. Use of Services</h2>
            <p>Our services are intended for lawful use only. Any misuse, such as fraudulent delivery requests or tampering with packages, is strictly prohibited.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">3. Courier Responsibilities</h2>
            <p>Couriers must ensure safe and timely deliveries. Loss or damage due to negligence may lead to account suspension.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">4. Limitation of Liability</h2>
            <p>We are not liable for any indirect or consequential damages arising from the use of our platform or courier delays.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">5. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.</p>
          </div>

          <p className="text-sm text-gray-500 mt-10">Last updated: July 9, 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
