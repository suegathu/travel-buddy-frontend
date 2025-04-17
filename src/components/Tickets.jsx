import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Tickets = () => {
  const { authTokens } = useContext(AuthContext);
  const { placeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPlace, selectedPrice } = location.state || {} // Price passed from Card
  const [basePrice, setBasePrice] = useState(Number(selectedPrice) || 0);
  const [formData, setFormData] = useState({
    visitDate: '',
    visitTime: '',
    guests: 1,
    totalPrice: (Number(selectedPrice) || 0).toFixed(2),
    paymentMethod: 'mpesa',
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedPrice) {
      setError('Price information is missing. Please select a valid ticket.');
    }
  }, [selectedPrice]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'guests') {
      const guests = Math.max(1, Number(value)); // Ensure at least 1 guest
      const newTotal = guests * basePrice;
      setFormData((prevData) => ({
        ...prevData,
        guests,
        totalPrice: newTotal.toFixed(2),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.visitDate || !formData.visitTime || !formData.guests || formData.totalPrice <= 0) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!basePrice) {
      setError('Price is missing. Cannot proceed with booking.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const token = authTokens?.access;

    const dataToSend = {
      booking_date: formData.visitDate,
      visit_time: formData.visitTime,
      total_price: parseFloat(formData.totalPrice),
      payment_method: formData.paymentMethod,
      place: placeId,
    };

    try {
      const response = await fetch('http://localhost:8000/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const booking = await response.json();
        // Pass the calculated total price to the payment form
        navigate(`/payment/${booking.id}`, {
          state: {
            selectedPlace,
            selectedPrice: formData.totalPrice, // Pass the calculated total price
            bookingDetails: {
              visitDate: formData.visitDate,
              visitTime: formData.visitTime,
              guests: formData.guests
            }
          }
        });
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">Ticket Booking</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
            Visit Date
          </label>
          <input
            type="date"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="visitTime" className="block text-sm font-medium text-gray-700">
            Visit Time
          </label>
          <input
            type="time"
            name="visitTime"
            value={formData.visitTime}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
            Number of Guests
          </label>
          <input
            type="number"
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            min="1"
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700">
            Total Price
          </label>
          <input
            type="text"
            name="totalPrice"
            value={`$${formData.totalPrice}`}
            disabled
            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed shadow-sm focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="visa">Visa/PayPal</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!error}
          className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Booking...' : 'Book Ticket'}
        </button>
      </form>
    </div>
  );
};

export default Tickets;