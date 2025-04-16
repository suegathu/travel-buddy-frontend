import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Reservations = () => {
  const { authTokens } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlace, setSelectedPlace] = useState(location.state?.selectedPlace || null);
  const [formData, setFormData] = useState({
    mealChoices: '',
    guests: 1,
    visitTime: '',
    booking_date: '',
    payment_method: 'mpesa',
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a random price if not provided
  const getEffectivePrice = () => {
    return selectedPlace?.price && selectedPlace.price > 0
      ? selectedPlace.price
      : Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
  };

  useEffect(() => {
    const price = getEffectivePrice();
    setTotalPrice(formData.guests * price);
  }, [formData.guests, selectedPlace]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'guests' ? parseInt(value, 10) : value;
    setFormData({ ...formData, [name]: updatedValue });
  };

  const validateForm = () => {
    if (!formData.mealChoices || !formData.visitTime || !formData.booking_date) {
      setError('Please fill all required fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedPlace || !selectedPlace.id) {
      setError('Please select a place before submitting.');
      return;
    }
  
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    setError('');
  
    try {
      const response = await fetch("http://localhost:8000/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({
          ...formData,
          total_price: totalPrice,
          place: selectedPlace.id,
          payment_method: formData.payment_method,
          check_in: formData.booking_date,
          check_out: formData.booking_date,
          visit_time: formData.visitTime,
          meal_choices: formData.mealChoices
        }),
      });
  
      if (response.ok) {
        alert('Reservation Successful!');
        navigate('/mytickets'); 
      } else {
        const errorData = await response.json();
        if (errorData.non_field_errors) {
          setError(errorData.non_field_errors.join(', '));
        } else {
          setError('Reservation failed. Please check your inputs and try again.');
        }
      }
    } catch (error) {
      setError('An error occurred while submitting your reservation.');
      console.error('Reservation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Display a message if no place is selected
  if (!selectedPlace) {
    return (
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
        <p className="text-red-500 text-center">Please select a place before making a reservation.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
        >
          Go Back to Places
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
        Reservation for {selectedPlace?.name || "Selected Place"}
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Book your table and meal preferences
      </p>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Meal Choices<span className="text-red-500">*</span></label>
          <textarea
            name="mealChoices"
            value={formData.mealChoices}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="e.g. Vegan, Gluten-free, Steak with fries..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Number of Guests<span className="text-red-500">*</span></label>
          <input
            type="number"
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            min="1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Visit Time<span className="text-red-500">*</span></label>
          <input
            type="time"
            name="visitTime"
            value={formData.visitTime}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Booking Date<span className="text-red-500">*</span></label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Payment Method<span className="text-red-500">*</span></label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="visa">Visa / PayPal</option>
          </select>
        </div>

        <div className="text-right text-gray-700 font-medium">
          Total: <span className="text-blue-600 font-bold">KES {totalPrice}</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {isSubmitting ? 'Reserving...' : 'Reserve Now'}
        </button>
      </form>
    </div>
  );
};

export default Reservations;