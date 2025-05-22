import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const MyTickets = () => {
  const { authTokens } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('https://travel-buddy-backend-8kf4.onrender.com/api/bookings/my/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTickets(data.results);
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

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">My Bookings</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {tickets.length > 0 ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">Place Bookings</h3>
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="mb-4">
                <div className="bg-gray-100 p-4 rounded-md shadow-sm">
                  <p className="font-semibold text-lg">
                    Place: {ticket.place_name || ticket.place?.name || 'Unknown'}
                  </p>
                  <p className="font-semibold">Visit Date: {ticket.booking_date}</p>
                  <p>Visit Time: {ticket.visit_time || 'Not specified'}</p>
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
    </div>
  );
};

export default MyTickets;
