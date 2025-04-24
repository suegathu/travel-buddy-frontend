import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const AdminFlightBookings = () => {
  const { authTokens } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions] = useState(['pending', 'confirmed', 'checked_in', 'cancelled']);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAirline, setFilterAirline] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [error, setError] = useState('');
  const [airlines, setAirlines] = useState([]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (!authTokens?.access) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('http://localhost:8000/api/flights/admin/flights/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched booking data:", data); // Debug log
        const bookingsData = data.results || data;
        setBookings(bookingsData);
        
        // Extract unique airlines from bookings
        const uniqueAirlines = [...new Set(bookingsData.map(booking => booking.flight_airline).filter(Boolean))];
        setAirlines(uniqueAirlines);
        
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch flight bookings');
      }
    } catch (error) {
      setError('An error occurred while fetching flight bookings.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (id, data) => {
    try {
      if (!authTokens?.access) return;

      const response = await fetch(`http://localhost:8000/api/flights/admin/flights/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchBookings(); // Refresh the booking list
      } else {
        const errorData = await response.json();
        console.error('Error updating flight booking:', errorData);
      }
    } catch (error) {
      console.error('Error updating flight booking:', error);
    }
  };

  useEffect(() => {
    if (authTokens?.access) {
      fetchBookings();
    }
  }, [authTokens]); // Fetch bookings when the component mounts or auth tokens change

  const cancelBooking = async (id) => {
    try {
      if (!authTokens?.access) return;
  
      const response = await fetch(`http://localhost:8000/api/flights/admin/flights/${id}/cancel/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
  
      if (response.ok) {
        // Refresh bookings after cancellation
        fetchBookings();
        
        // Close the modal
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error(`Error cancelling flight booking ${id}:`, errorData);
      }
    } catch (error) {
      console.error(`Error cancelling flight booking ${id}:`, error);
    }
  };
  
  const handleStatusChange = (id, newStatus) => {
    updateBooking(id, { status: newStatus });
  };

  const openCancelModal = (id) => {
    setSelectedBookingId(id);
    setShowModal(true);
  };

  const filterBookings = (bookings) => {
    return bookings.filter((booking) => {
      const statusMatch = filterStatus ? booking.status === filterStatus : true;
      const airlineMatch = filterAirline ? booking.flight_airline === filterAirline : true;
      return statusMatch && airlineMatch;
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'KES 0.00';
    return `KES ${amount}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadgeStyle = (status) => {
    const badgeStyles = {
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'checked_in': 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return badgeStyles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Add this function to handle empty or undefined values
  const displayValue = (value) => {
    return value || 'N/A';
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Admin Flight Bookings</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4 items-center flex-wrap bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="font-medium text-gray-700 whitespace-nowrap">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="font-medium text-gray-700 whitespace-nowrap">Filter by Airline:</label>
          <select
            value={filterAirline}
            onChange={(e) => setFilterAirline(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Airlines</option>
            {airlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchBookings}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-sm transition duration-150 ease-in-out"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Airline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filterBookings(bookings).length ? (
                  filterBookings(bookings).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{displayValue(booking.user_name)}</td>
                      <td className="px-4 py-3 text-sm">{displayValue(booking.flight_number)}</td>
                      <td className="px-4 py-3 text-sm">{displayValue(booking.flight_airline)}</td>
                      <td className="px-4 py-3 text-sm">{displayValue(booking.flight_origin)}</td>
                      <td className="px-4 py-3 text-sm">{displayValue(booking.flight_destination)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(booking.departure_time)}</td>
                      <td className="px-4 py-3 text-sm">{displayValue(booking.seat_number)}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(booking.flight_price)}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          className={`text-xs border rounded p-1 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getStatusBadgeStyle(booking.status)}`}
                          value={booking.status || 'pending'}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => openCancelModal(booking.id)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded shadow"
                          disabled={booking.status === 'cancelled'}
                        >
                          Cancel
                        </button>
                        {booking.qr_code && (
                          <button
                            onClick={() => window.open(booking.qr_code, '_blank')}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded shadow ml-2"
                          >
                            View QR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-3 text-center text-sm text-gray-500">No bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Cancellation</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to cancel this flight booking? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  No, Keep Booking
                </button>
                <button
                  onClick={() => cancelBooking(selectedBookingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFlightBookings;