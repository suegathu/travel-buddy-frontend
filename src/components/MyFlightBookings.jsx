import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const MyFlightBookings = () => {
  const { api, authTokens } = useContext(AuthContext);
  const [flightBookings, setFlightBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlightBookings = async () => {
      try {
        const res = await api.get('/api/flights/my-flight-bookings/', {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });

        const data = Array.isArray(res.data.results)
          ? res.data.results
          : res.data.results ? [res.data.results] : [];

        setFlightBookings(data);
        setFilteredBookings(data);
      } catch (err) {
        console.error('Failed to fetch flight bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightBookings();
  }, [authTokens, api]);

  useEffect(() => {
    setFilteredBookings(
      statusFilter === 'all'
        ? flightBookings
        : flightBookings.filter((b) => b.status === statusFilter)
    );
  }, [statusFilter, flightBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
  
    try {
      await api.patch(`/api/flights/cancel-flight-booking/${bookingId}/`, {}, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
  
      const updated = flightBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      );
  
      setFlightBookings(updated);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Could not cancel the booking. Please try again later.');
    }
  };
  

  const handleDownloadPDF = async (bookingId) => {
    try {
      const response = await api.get(`/api/flights/bookings/${bookingId}/download/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          Accept: 'application/pdf',
        },
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flight_booking_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
  
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not download PDF.');
    }
  };
  
  if (loading) return <p className="text-center py-10">Loading your flights...</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🛫 My Flight Bookings</h2>
        <button onClick={() => navigate('/flights')} className="text-blue-600 underline">
          ← Back to Flights
        </button>
      </div>

      <div className="mb-4">
        <label className="mr-2">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="all">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredBookings.length === 0 ? (
        <p>No flights booked yet.</p>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={`${booking.id}-${booking.flight_number}`}
              className="bg-white shadow rounded-xl p-4 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{booking.airline}</h3>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              <p className="mt-1 text-gray-600">Flight: {booking.flight_number}</p>
              <p className="text-sm text-gray-500">
                From <strong>{booking.origin}</strong> to <strong>{booking.destination}</strong>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <p className="font-medium">Departure</p>
                  <p>{booking.departure_time || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Arrival</p>
                  <p>{booking.arrival_time || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Seat</p>
                  <p>{booking.seat_number || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="font-medium">Price</p>
                  <p>${booking.price}</p>
                </div>
              </div>

              {booking.qr_code && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">QR Code for Check-in:</p>
                  <img
                    src={`https://travel-buddy-backend-8kf4.onrender.com${booking.qr_code}`}
                    alt="Flight QR Code"
                    className="w-32 h-32 mt-2"
                  />
                </div>
              )}

              <p className="mt-2 text-sm text-gray-500">
                Booked at: {new Date(booking.created_at).toLocaleString()}
              </p>

              <div className="mt-4 flex gap-2">
                {booking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-4 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => handleDownloadPDF(booking.id)}
                  className="px-4 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFlightBookings;
