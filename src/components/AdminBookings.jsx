import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions] = useState(['pending', 'confirmed', 'cancelled']);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [typeOptions] = useState(['hotel', 'restaurant', 'attraction']);

  const getAuthToken = () => {
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) return null;
    try {
      const parsed = JSON.parse(authTokens);
      return parsed.access || parsed;
    } catch (e) {
      console.error(e);
      return authTokens;
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      // Make the request to the API to fetch bookings
      const response = await axios.get('/api/admin/bookings/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch additional details for each booking (client-side)
      const bookingsData = Array.isArray(response.data) ? response.data : response.data.results || [];

      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const detailsResponse = await axios.get(`/api/admin/bookings/${booking.id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            const {
              booking_type,
              total_price,
              payment_method,
              place_type,
            } = detailsResponse.data;

            const actualType = place_type || booking_type || booking.place_type || booking.booking_type;

            return {
              ...booking,
              booking_type: actualType,
              total_price: parseFloat(total_price) || parseFloat(booking.total_price) || 0,
              payment_method: payment_method || booking.payment_method || 'Credit Card',
            };
          } catch (error) {
            console.error(`Error fetching details for booking ${booking.id}:`, error);

            return {
              ...booking,
              booking_type: booking.place_type || booking.booking_type || 'hotel',
              total_price: parseFloat(booking.total_price) || 0,
              payment_method: booking.payment_method || 'Credit Card',
            };
          }
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (id, data) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.patch(`/api/admin/bookings/${id}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings(); // Refresh the booking list
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []); // Fetch bookings when the component mounts

  const handleStatusChange = (id, newStatus) => {
    updateBooking(id, { status: newStatus });
  };

  const handlePaymentToggle = (id, currentConfirmed) => {
    updateBooking(id, { payment_confirmed: !currentConfirmed });
  };

  const filterBookings = (bookings) => {
    return bookings.filter((booking) => {
      const statusMatch = filterStatus ? booking.status === filterStatus : true;
      const typeMatch = filterType ? booking.booking_type === filterType : true;
      return statusMatch && typeMatch;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeBadgeStyle = (type) => {
    const badgeStyles = {
      hotel: 'bg-blue-100 text-blue-800 border-blue-300',
      restaurant: 'bg-green-100 text-green-800 border-green-300',
      attraction: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return badgeStyles[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Admin Bookings</h2>

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
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
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getTypeBadgeStyle(booking.booking_type)}`}>
                          {booking.booking_type?.charAt(0).toUpperCase() + booking.booking_type?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(booking.booking_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(booking.total_price)}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{booking.payment_method}</td>
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
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handlePaymentToggle(booking.id, booking.payment_confirmed)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.payment_confirmed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {booking.payment_confirmed ? 'Confirmed' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          className="text-xs text-red-600 hover:text-red-800"
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
    </div>
  );
};

export default AdminBookings;
