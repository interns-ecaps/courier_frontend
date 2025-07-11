// src/pages/Auth/Privacy.jsx
import React from 'react';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-orange-50 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-orange-500 p-3 rounded-full">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-orange-600 text-center mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-700 text-center mb-8">
          Your privacy is important to us. This policy explains how we collect, use, and safeguard your information when you use our courier services.
        </p>

        <div className="space-y-6 text-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">1. Information We Collect</h2>
            <p>We collect personal information such as your name, contact number, email address, and delivery details to provide courier services efficiently.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">2. Use of Information</h2>
            <p>Your data is used solely for delivery operations, account management, service improvements, and customer support. We do not sell your data.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">3. Data Protection</h2>
            <p>We use secure servers, encrypted communications, and access controls to protect your data from unauthorized access or breaches.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">4. Sharing of Information</h2>
            <p>We only share your data with third parties involved in your delivery, such as logistics partners, and only when necessary for completing a shipment.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">5. Your Rights</h2>
            <p>You can access, update, or delete your personal information by contacting our support. You may also request data export or processing limitations.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-orange-600 mb-1">6. Updates to this Policy</h2>
            <p>We may update this Privacy Policy from time to time. All changes will be posted on this page with the latest update date.</p>
          </div>

          <p className="text-sm text-gray-500 mt-10">Last updated: July 9, 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
