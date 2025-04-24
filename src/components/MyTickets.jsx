import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const MyTickets = () => {
  const { authTokens } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);  // Place bookings state
  const [flightBookings, setFlightBookings] = useState([]);  // Flight bookings state
  const [error, setError] = useState('');
  const [flightError, setFlightError] = useState('');  // Flight bookings error state
  const navigate = useNavigate();

  // Fetch place tickets (your current functionality)
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/bookings/my/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTickets(data.results);  // Access 'results' key for tickets
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Failed to fetch bookings');
        }
      } catch (error) {
        setError('An error occurred while fetching bookings.');
        console.error('Error:', error);
      }
    };

    if (authTokens?.access) {
      fetchTickets();
    }
  }, [authTokens]);

  // Fetch flight bookings
  useEffect(() => {
    const fetchFlightBookings = async () => {
      if (!authTokens?.access) return;  // Ensure the user is authenticated

      try {
        const response = await fetch('http://localhost:8000/api/flights/my-bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFlightBookings(data.results);  // Access 'results' key for flight bookings
        } else {
          const errorData = await response.json();
          setFlightError(errorData.detail || 'Failed to fetch flight bookings');
        }
      } catch (error) {
        setFlightError('An error occurred while fetching flight bookings.');
        console.error('Error:', error);
      }
    };

    if (authTokens?.access) {
      fetchFlightBookings();
    }
  }, [authTokens]);

  // Format date/time for better display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not available';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (err) {
      return dateTimeStr;
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">My Bookings</h2>

      {/* Error handling */}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {flightError && <p className="text-red-500 text-sm mb-4">{flightError}</p>}

      {/* Place tickets */}
      {tickets.length > 0 ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">Place Bookings</h3>
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="mb-4">
                <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                  <p className="font-semibold text-lg">Place: {ticket.place_name}</p>
                  <p className="font-semibold">Visit Date: {ticket.booking_date}</p>
                  <p>Visit Time: {ticket.visit_time}</p>
                  <p>Total Price: KES {ticket.total_price}</p>
                  <p>Type: {ticket.place_type}</p>
                  <button
                    onClick={() => navigate(`/ticket-details/${ticket.id}`)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No Place Bookings booked yet.</p>
      )}

      {/* Flight bookings */}
      {flightBookings.length > 0 ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">Flight Bookings</h3>
          <ul>
            {flightBookings.map((flight) => (
              <li key={flight.id} className="mb-4">
                <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                  <p className="font-semibold text-lg">Flight: {flight.flight_number}</p>
                  <p className="font-semibold">Departure: {formatDateTime(flight.departure_time)}</p>
                  <p>Arrival: {formatDateTime(flight.arrival_time)}</p>
                  <p>From: {flight.origin} To: {flight.destination}</p>
                  <p>Seat: {flight.seat_number}</p>
                  <p>Status: {flight.status}</p>
                  <button
                    onClick={() => navigate(`/flight-details/${flight.id}`)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    View Flight Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No Flight Bookings booked yet.</p>
      )}
    </div>
  );
};

export default MyTickets;
