import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const TicketDetail = () => {
  const { authTokens } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        const response = await fetch(`https://travel-buddy-backend-8kf4.onrender.com/api/bookings/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTicket(data);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Failed to fetch ticket details');
        }
      } catch (error) {
        setError('An error occurred while fetching ticket details.');
        console.error('Error:', error);
      }
    };

    if (authTokens?.access) {
      fetchTicketDetail();
    }
  }, [authTokens, id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">🎟️ Ticket Details</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {ticket ? (
          <div className="space-y-4 text-gray-700">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {/* Updated Place Name */}
              <p className="font-medium">🏙️ Place Name:</p>
              <p>{ticket.place_name || 'Place name not available'}</p>

              {/* Updated Location */}
              <p className="font-medium">📍 Location:</p>
              <p>
                {ticket.place?.location
                  ? ticket.place.location
                  : 'Location not available'}
              </p>

              <p className="font-medium">📅 Booking Date:</p>
              <p>{ticket.booking_date}</p>

              <p className="font-medium">⏰ Visit Time:</p>
              <p>{ticket.visit_time || 'N/A'}</p>

              <p className="font-medium">💵 Total Price:</p>
              <p>${ticket.total_price}</p>

              <p className="font-medium">🏷️ Type:</p>
              <p>{ticket.place_type}</p>

              <p className="font-medium">🔖 Status:</p>
              <p className={`font-semibold ${ticket.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                {ticket.status}
              </p>

              <p className="font-medium">🍽️ Meal Choices:</p>
              <p>{ticket.meal_choices || 'N/A'}</p>

              <p className="font-medium">💳 Payment Method:</p>
              <p>{ticket.payment_method}</p>
            </div>

            {ticket.place_image && (
              <div className="mt-6 rounded overflow-hidden">
                <img
                  src={ticket.place_image}
                  alt="Place"
                  className="w-full h-64 object-cover rounded-lg shadow-md transition-transform duration-200 hover:scale-105"
                />
              </div>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/mytickets')}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition duration-200"
              >
                ⬅ Back to My Bookings
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading ticket details...</p>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
