import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import AuthContext from '../context/AuthContext';
import { useParams } from 'react-router-dom';

const Tickets = () => {
  const { authTokens } = useContext(AuthContext); // Access authTokens from context
  const [formData, setFormData] = useState({
    visitDate: '',
    visitTime: '',
    guests: 1,
    totalPrice: 0,
    paymentMethod: 'mpesa',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { placeId } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to generate a random price based on the number of guests
  const generateRandomPrice = (guests) => {
    const basePrice = 10; // Base price for 1 guest
    const maxPriceVariation = 30; // Max price variation per guest
    return (basePrice + Math.floor(Math.random() * maxPriceVariation) * guests).toFixed(2);
  };

  useEffect(() => {
    if (formData.guests) {
      const newPrice = generateRandomPrice(Number(formData.guests));
      setFormData((prevData) => ({ ...prevData, totalPrice: newPrice }));
    }
  }, [formData.guests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // If the number of guests changes, recalculate the price
    if (name === 'guests') {
      const newPrice = generateRandomPrice(Number(value));
      setFormData((prevData) => ({ ...prevData, totalPrice: newPrice }));
    }
  };

  const validateForm = () => {
    if (!formData.visitDate || !formData.visitTime || !formData.guests || !formData.totalPrice) {
      setError('Please fill in all required fields.');
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

    // Send the form data with both date and time separately
    const dataToSend = {
      booking_date: formData.visitDate,  // Send the visit date
      visit_time: formData.visitTime,    // Send the visit time
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
        alert('Booking Successful!');
        navigate('/mytickets');  
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
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
            Total Price (Generated)
          </label>
          <input
            type="number"
            name="totalPrice"
            value={formData.totalPrice}
            disabled
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Booking...' : 'Book Ticket'}
        </button>
      </form>
    </div>
  );
};

export default Tickets;
