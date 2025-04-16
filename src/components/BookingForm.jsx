import React, { useState } from "react";

const BookingForm = ({ place, onSubmit }) => {
  const [formData, setFormData] = useState({
    check_in: "",
    check_out: "",
    guests: 1,
    meal_choices: "",
    visit_time: "",
    booking_date: "",
    payment_method: "mpesa",
    room_type: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, place: place.id });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
      {place.place_type === "hotel" && (
        <>
          <label>Check-in:</label>
          <input type="date" name="check_in" onChange={handleChange} required />
          <label>Check-out:</label>
          <input type="date" name="check_out" onChange={handleChange} required />
          <label>Room Type:</label>
          <select name="room_type" onChange={handleChange}>
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
          </select>
        </>
      )}
      {place.place_type === "restaurant" && (
        <>
          <label>Meal Choices:</label>
          <textarea name="meal_choices" onChange={handleChange} />
        </>
      )}
      {place.place_type === "attraction" && (
        <>
          <label>Date:</label>
          <input type="date" name="booking_date" onChange={handleChange} required />
          <label>Time:</label>
          <input type="time" name="visit_time" onChange={handleChange} />
        </>
      )}
      <label>Guests:</label>
      <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" />
      <label>Payment Method:</label>
      <select name="payment_method" onChange={handleChange}>
        <option value="mpesa">M-Pesa</option>
        <option value="visa">Visa/PayPal</option>
      </select>
      <button type="submit" className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
        Proceed to Payment
      </button>
    </form>
  );
};

export default BookingForm;
