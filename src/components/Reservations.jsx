import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Reservations = () => {
  const { authTokens } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPlace, selectedPrice } = location.state || {};
  
  const [basePrice, setBasePrice] = useState(Number(selectedPrice) || 0);
  const [formData, setFormData] = useState({
    mealChoices: '',
    guests: 1,
    visitTime: '',
    booking_date: new Date().toISOString().split("T")[0], // Today as default
    payment_method: 'mpesa',
    total_price: (Number(selectedPrice) || 0).toFixed(2),
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a random price if not provided
  const getEffectivePrice = () => {
    return selectedPlace?.price && selectedPlace.price > 0
      ? parseFloat(selectedPlace.price)
      : Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
  };

  useEffect(() => {
    const price = getEffectivePrice();
    setBasePrice(price);
    setFormData(prev => ({
      ...prev,
      total_price: (price * prev.guests).toFixed(2)
    }));
  }, [selectedPlace]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "guests") {
      const guests = Math.max(1, parseInt(value, 10));
      setFormData(prev => ({
        ...prev,
        guests,
        total_price: (basePrice * guests).toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.mealChoices || !formData.visitTime || !formData.booking_date || formData.guests < 1) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!selectedPlace || !selectedPlace.id) {
      setError('Please select a place before submitting.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      // Make sure total_price is a number for the API
      const totalPriceNumber = parseFloat(formData.total_price);
      
      const dataToSend = {
        place: selectedPlace.id,
        check_in: formData.booking_date,
        check_out: formData.booking_date, // Same day for restaurant reservation
        visit_time: formData.visitTime,
        meal_choices: formData.mealChoices,
        guests: formData.guests,
        total_price: totalPriceNumber,
        payment_method: formData.payment_method,
        booking_date: formData.booking_date,
      };
      
      const response = await fetch("https://travel-buddy-7g6f.onrender.com/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(dataToSend),
      });
  
      if (response.ok) {
        const booking = await response.json();
        // Navigate to payment page with relevant details
        navigate(`/payment/${booking.id}`, {
          state: {
            selectedPlace,
            selectedPrice: formData.total_price, // Pass the formatted price string
            bookingDetails: {
              bookingDate: formData.booking_date,
              visitTime: formData.visitTime,
              guests: formData.guests,
              mealChoices: formData.mealChoices
            }
          }
        });
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 
                            (errorData.non_field_errors ? errorData.non_field_errors.join(', ') : 'Unknown error');
        setError(`Reservation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Reservation error:', error);
      setError('An error occurred while processing your reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display a message if no place is selected
  if (!selectedPlace) {
    return (
      <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
        <p className="text-red-500 text-center">Please select a place before making a reservation.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-4"
        >
          Go Back to Places
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">
        Reservation for {selectedPlace?.name || "Selected Place"}
      </h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700">
            Booking Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="visitTime" className="block text-sm font-medium text-gray-700">
            Visit Time <span className="text-red-500">*</span>
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
            Number of Guests <span className="text-red-500">*</span>
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
          <label htmlFor="mealChoices" className="block text-sm font-medium text-gray-700">
            Meal Choices <span className="text-red-500">*</span>
          </label>
          <textarea
            name="mealChoices"
            value={formData.mealChoices}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Vegan, Gluten-free, Steak with fries..."
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="total_price" className="block text-sm font-medium text-gray-700">
            Total Price
          </label>
          <input
            type="text"
            name="total_price"
            value={`$${formData.total_price}`}
            disabled
            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed shadow-sm focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
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
          className={`w-full ${isSubmitting || !!error ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          {isSubmitting ? "Processing..." : "Reserve Now"}
        </button>
      </form>
    </div>
  );
};

export default Reservations;