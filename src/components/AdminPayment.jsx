import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const AdminPayments = () => {
  const { authTokens } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [statusOptions] = useState(['pending', 'success', 'failed']);
  const [methodOptions] = useState(['card', 'mpesa', 'paypal', 'stripe']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  // Fetch payments using the same pattern as AdminBookings
  const fetchPayments = async () => {
    setLoading(true);
    try {
      if (!authTokens?.access) {
        console.error('Authentication token not found');
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch('https://travel-buddy-7g6f.onrender.com/api/payments/all/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.results || data);
        setTotalCount(data.count || (data.results ? data.results.length : data.length));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch payments');
      }
    } catch (error) {
      setError('An error occurred while fetching payments.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update payment status
  const updatePaymentStatus = async (id, newStatus) => {
    try {
      if (!authTokens?.access) return;

      const response = await fetch(`https://travel-buddy-7g6f.onrender.com/api/payments/${id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the payment in the local state
        setPayments(payments.map(payment => 
          payment.id === id ? { ...payment, status: newStatus } : payment
        ));
      } else {
        const errorData = await response.json();
        setError(`Failed to update status: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setError(`Error updating payment status: ${error.message}`);
    }
  };

  useEffect(() => {
    if (authTokens?.access) {
      fetchPayments();
    }
  }, [authTokens]); // Fetch payments when the component mounts or auth tokens change

  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const filterPayments = (paymentsList) => {
    return paymentsList.filter((payment) => {
      const statusMatch = filterStatus ? payment.status === filterStatus : true;
      const methodMatch = filterMethod ? payment.payment_method === filterMethod : true;
      
      const searchMatch = searchQuery 
        ? (payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.place_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      return statusMatch && methodMatch && searchMatch;
    });
  };

  const sortPayments = (paymentsList) => {
    return [...paymentsList].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortField === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const getStatusBadgeStyle = (status) => {
    const badgeStyles = {
      success: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
    };
    
    return badgeStyles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'mpesa':
        return '📱';
      case 'paypal':
        return '🅿️';
      case 'stripe':
        return '💻';
      default:
        return '💰';
    }
  };

  // Calculate pagination
  const filteredPayments = filterPayments(payments);
  const sortedPayments = sortPayments(filteredPayments);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = sortedPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openConfirmModal = (id) => {
    setSelectedPaymentId(id);
    setShowModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Payment Management</h1>
      
      {/* Filter and Search */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by reference or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          
          <div className="w-full sm:w-1/4 min-w-[150px]">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-1/4 min-w-[150px]">
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="method"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All Methods</option>
              {methodOptions.map((method) => (
                <option key={method} value={method}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-1/4 min-w-[150px] flex items-end">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterMethod('');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200 w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredPayments.length} of {totalCount} payments
          </div>
          
          <button
            onClick={fetchPayments}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Payments Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading payments...</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('reference')}
                  >
                    Reference {renderSortIcon('reference')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    Customer {renderSortIcon('email')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    Amount {renderSortIcon('amount')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('payment_method')}
                  >
                    Method {renderSortIcon('payment_method')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('timestamp')}
                  >
                    Date {renderSortIcon('timestamp')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {renderSortIcon('status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPayments.length > 0 ? (
                  currentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.email || payment.user_email}
                        {payment.place_name && (
                          <div className="text-xs text-gray-400">
                            {payment.place_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="mr-1">{getPaymentMethodIcon(payment.payment_method)}</span>
                        {payment.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(payment.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeStyle(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'success')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'failed')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {payment.status === 'failed' && (
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'success')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Success
                            </button>
                          )}
                          {payment.status === 'success' && (
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'failed')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Mark Failed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No payments found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {[...Array(totalPages).keys()].map((number) => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === number + 1
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {number + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for status changes that need confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Status Change</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to change the status of this payment? This may affect related bookings.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Logic to process the confirmed status change would go here
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;