import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const AdminBookings = () => {
  const { authTokens } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions] = useState(['pending', 'confirmed', 'cancelled']);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [typeOptions] = useState(['hotel', 'restaurant', 'attraction']);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (!authTokens?.access) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('https://travel-buddy-backend-8kf4.onrender.com/api/admin/bookings/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.results || data);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch bookings');
      }
    } catch (error) {
      setError('An error occurred while fetching bookings.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (id, data) => {
    try {
      if (!authTokens?.access) return;

      const response = await fetch(`https://travel-buddy-backend-8kf4.onrender.com/api/admin/bookings/${id}/`, {
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
        console.error('Error updating booking:', errorData);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  useEffect(() => {
    if (authTokens?.access) {
      fetchBookings();
    }
  }, [authTokens]); // Fetch bookings when the component mounts or auth tokens change

  const deleteBooking = async (id) => {
    try {
      if (!authTokens?.access) return;
  
      const response = await fetch(`https://travel-buddy-backend-8kf4.onrender.com/api/admin/bookings/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
  
      if (response.ok) {
        // Refresh bookings after deletion
        fetchBookings();
        
        // Close the modal
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error(`Error deleting booking ${id}:`, errorData);
      }
    } catch (error) {
      console.error(`Error deleting booking ${id}:`, error);
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
      const typeMatch = filterType ? booking.place_type === filterType : true;
      return statusMatch && typeMatch;
    });
  };

  const formatCurrency = (amount) => {
    // Use KES as the currency like in MyTickets
    return `KES ${amount}`;
  };

  const getTypeBadgeStyle = (type) => {
    const badgeStyles = {
      hotel: 'bg-blue-100 text-blue-800 border-blue-300',
      restaurant: 'bg-green-100 text-green-800 border-green-300',
      attraction: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return badgeStyles[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentMethodBadgeStyle = (method) => {
    const badgeStyles = {
      'Credit Card': 'bg-blue-100 text-blue-800',
      'PayPal': 'bg-yellow-100 text-yellow-800',
      'Bank Transfer': 'bg-green-100 text-green-800',
      'Cash': 'bg-gray-100 text-gray-800',
    };
    return badgeStyles[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Admin Bookings</h2>

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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="font-medium text-gray-700 whitespace-nowrap">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filterBookings(bookings).length ? (
                  filterBookings(bookings).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{booking.user_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{booking.place_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getTypeBadgeStyle(booking.place_type)}`}>
                          {booking.place_type?.charAt(0).toUpperCase() + booking.place_type?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{booking.booking_date}</td>
                      <td className="px-4 py-3 text-sm">{booking.visit_time || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(booking.total_price)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getPaymentMethodBadgeStyle(booking.payment_method)}`}>
                          {booking.payment_method || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          className="text-xs border border-gray-300 rounded p-1 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => openCancelModal(booking.id)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded shadow"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-3 text-center text-sm text-gray-500">No bookings found</td>
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
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  No, Keep Booking
                </button>
                <button
                  onClick={() => deleteBooking(selectedBookingId)}
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

export default AdminBookings;