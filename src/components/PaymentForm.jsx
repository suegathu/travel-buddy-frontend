import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const PaymentForm = () => {
  const { authTokens, user } = useContext(AuthContext);
  const { placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the selectedPrice which is now the calculated total price from Tickets component
  const { selectedPlace, selectedPrice, bookingDetails } = location.state || {};

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('card');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // Use the calculated total price from the Tickets component
    if (selectedPrice) {
      setAmount(selectedPrice);
    }
  }, [selectedPrice]);

  useEffect(() => {
    const generateReference = () => {
      const date = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `pay-${date}-${randomStr}`;
    };
    setReference(generateReference());

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Display booking details if available
  const renderBookingDetails = () => {
    if (bookingDetails) {
      return (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">Booking Details</h3>
          <p className="text-sm text-gray-600">Date: {bookingDetails.visitDate}</p>
          <p className="text-sm text-gray-600">Time: {bookingDetails.visitTime}</p>
          <p className="text-sm text-gray-600">Guests: {bookingDetails.guests}</p>
        </div>
      );
    }
    return null;
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardExpiry(value);
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/\D/g, '');
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    setCardNumber(parts.join(' ').trim());
  };

  const initiatePaystackPayment = () => {
    console.log("PaystackPop available:", !!window.PaystackPop);
    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_3f5891c7c1997586f49bd3a16a7ea1a5951a8979',
        email: email,
        amount: parseFloat(amount) * 100,
        ref: reference,
        currency: "KES",
        metadata: {
          place_id: placeId,
          custom_fields: [
            {
              display_name: "Place ID",
              variable_name: "place_id",
              value: placeId
            }
          ]
        },
        callback: function(response) {
          verifyPayment(response.reference);
        },
        onClose: function() {
          setIsLoading(false);
          setStatus('Payment cancelled. You can try again.');
        }
      });
      handler.openIframe();
    } else {
      setStatus('Payment gateway not available. Please try again later.');
      setIsLoading(false);
    }
  };

  const processDirectCardPayment = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`,
        'Content-Type': 'application/json',
      };
      
      const initRes = await axios.post('https://travel-buddy-backend-8kf4.onrender.com/api/paystack/initialize/', {
        email,
        amount,
        reference,
        place_id: placeId
      }, { headers });
      
      if (initRes.status === 200) {
        initiatePaystackPayment();
      } else {
        setStatus('Could not initiate payment. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setStatus(`Payment failed: ${err.response?.data?.message || 'Please try again'}`);
      setIsLoading(false);
    }
  };

  const processMpesaPayment = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`,
        'Content-Type': 'application/json',
      };
      
      const res = await axios.post('https://travel-buddy-backend-8kf4.onrender.com/api/paystack/mpesa/', {
        phone,
        email,
        amount,
        reference,
        place_id: placeId
      }, { headers });
      
      if (res.status === 200) {
        setStatus('STK Push sent to your phone. Please complete the payment.');
        startPolling(reference);
      } else {
        setStatus('Failed to initiate M-Pesa payment. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('M-Pesa payment error:', err);
      setStatus(`M-Pesa payment failed: ${err.response?.data?.message || 'Please try again'}`);
      setIsLoading(false);
    }
  };

  const verifyPayment = async (ref) => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`
      };
      
      const response = await axios.get(`https://travel-buddy-backend-8kf4.onrender.com/api/status/${ref}/`, { headers });
      
      if (response.data.status === 'success') {
        setPaymentStatus('success');
        setStatus('Payment completed successfully!');
        setTimeout(() => {
          navigate('/mytickets');
        }, 2000);
      } else if (response.data.status === 'failed') {
        setPaymentStatus('failed');
        setStatus('Payment verification failed. Please try again.');
      } else {
        setStatus('Payment is being processed. We will update you once completed.');
        startPolling(ref);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('Error verifying payment. Please check your payment status in your account.');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (ref) => {
    const pollInterval = setInterval(async () => {
      try {
        const headers = {
          Authorization: `Bearer ${authTokens?.access}`
        };
        
        const response = await axios.get(`https://travel-buddy-backend-8kf4.onrender.com/api/status/${ref}/`, { headers });
        
        if (response.data.status === 'success') {
          clearInterval(pollInterval);
          setPaymentStatus('success');
          setStatus('Payment completed successfully!');
          setIsLoading(false);
          setTimeout(() => {
            navigate('/mytickets');
          }, 2000);
        } else if (response.data.status === 'failed') {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          setStatus('Payment failed. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);

    setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
      if (paymentStatus !== 'success') {
        setStatus('Payment verification timed out. Please check your payment status in your account.');
      }
    }, 120000);
  };

  const handlePayment = async (e) => {
    console.log(e);
    e.preventDefault();
    setIsLoading(true);
    setStatus('Processing payment...');

    if (!amount || !email) {
      setStatus('Please provide email and amount.');
      setIsLoading(false);
      return;
    }
    
    if (method === 'mpesa' && !phone) {
      setStatus('Please provide a phone number for M-Pesa payment.');
      setIsLoading(false);
      return;
    }
    
    if (method === 'mpesa') {
      processMpesaPayment();
    } else if (method === 'card') {
      processDirectCardPayment();
    } else {
      setStatus('This payment method is not yet implemented.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Make Payment</h2>
      
      {/* Display booking details */}
      {renderBookingDetails()}
      
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            readOnly
            className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="card">Card</option>
            <option value="mpesa">M-Pesa</option>
          </select>
        </div>
        
        {method === 'mpesa' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
           <input
            type="tel"
            placeholder="Phone number (e.g., 2547XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-2 rounded"
          />

            <p className="text-xs text-gray-500 mt-1">Format: 254XXXXXXXXX (with +)</p>
          </div>
        )}
        
        <button
          type="submit"
          className={`w-full p-2 rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
          
        </button>
        
        {status && (
          <div className={`text-center p-3 rounded ${
            status.includes('success') ? 'bg-green-100 text-green-800' : 
            status.includes('failed') ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {status}
          </div>
        )}
      </form>

      <div className="mt-4 text-center">
        <img 
          src="/api/placeholder/200/40" 
          alt="Secured by Paystack" 
          className="mx-auto"
        />
        <p className="text-xs text-gray-500 mt-2">
          Payments are securely processed by Paystack
        </p>
      </div>

      {import.meta.env.MODE !== 'production' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mt-4 text-xs">
          Test Mode Active - For test cards, use:
          <ul className="list-disc ml-4 mt-1">
            <li>Success: 4084 0840 8408 4081</li>
            <li>Failed: 4084 0840 8408 4040</li>
            <li>Any expiry date (MM/YY) and CVV</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;