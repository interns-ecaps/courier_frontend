import React, { useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';

/**
 * PaymentButton initiates a Razorpay payment for a shipment and package.
 * REQUIREMENT: User must select a package before proceeding to payment.
 * - If no package is selected, show a user-friendly error and prevent payment.
 * - The selected package's ID (package_id) is included in the API request payload.
 * - Calls onPaymentSuccess() after successful payment verification.
 */
const PaymentButton = forwardRef(({ amount = 500, shipmentId, packageId, onPaymentSuccess }, ref) => {
    const [error, setError] = useState('');

    // Expose the pay method to parent via ref
    useImperativeHandle(ref, () => ({
        pay: handlePayment
    }));

    async function handlePayment() {
        console.log('PaymentButton props:', { shipmentId, packageId });
        // 1. Ensure a package is selected before proceeding
        if (!packageId) {
            setError('Please select a package before proceeding to payment.');
            return;
        }
        setError('');
        try {
            const token = getToken();
            // 2. Include package_id in the API request payload
            const response = await axios.post(
                'http://localhost:8000/shipment/v1/razorpay/create-order',
                {
                    amount: amount,
                    currency: 'INR',
                    shipment_id: shipmentId,
                    package_id: packageId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const { order_id } = response.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount,
                currency: 'INR',
                name: 'Your Company Name',
                description: 'Test Payment',
                order_id: order_id,
                handler: async function (response) {
                    await axios.post(
                        'http://localhost:8000/shipment/v1/razorpay/verify-payment',
                        {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    alert('Payment successful!');
                    if (onPaymentSuccess) {
                        onPaymentSuccess();
                    }
                },
                prefill: {
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    contact: '9999999999'
                },
                notes: {
                    address: 'Razorpay Corporate Office'
                },
                theme: {
                    color: '#3399cc'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Order creation failed:', error);
            alert('Payment failed. Please try again.');
        }
    }

    return (
        <div style={{ display: 'none' }}>
            <button onClick={handlePayment}>Pay Now</button>
            {error && (
                <div className="mt-2 text-red-600 text-sm font-medium">{error}</div>
            )}
        </div>
    );
});

export default PaymentButton; 