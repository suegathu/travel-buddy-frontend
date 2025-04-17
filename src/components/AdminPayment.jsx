import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext'; // Adjust path as necessary

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const { authTokens } = useContext(AuthContext); // Access token from context

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/payments/all/', {
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Payments response:", res.data);
      setPayments(res.data.results || []); // default to empty array if `results` not found
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authTokens) {
      fetchPayments();
    }
  }, [authTokens]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Payments</h2>
      {loading ? (
        <p>Loading payments...</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border shadow rounded bg-white">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Email</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Method</th>
                <th className="p-2">Status</th>
                <th className="p-2">Transaction ID</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, index) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{p.user_email}</td>
                  <td className="p-2">${p.amount}</td>
                  <td className="p-2 capitalize">{p.method}</td>
                  <td className={`p-2 ${p.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {p.status}
                  </td>
                  <td className="p-2">{p.transaction_id || '-'}</td>
                  <td className="p-2">{new Date(p.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
