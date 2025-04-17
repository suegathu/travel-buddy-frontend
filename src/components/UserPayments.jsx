import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const UserPayments = () => {
  const { authTokens } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get('/api/paystack/payments/', {
          headers: {
            Authorization: `Bearer ${authTokens.access}`,
          },
        });
        setPayments(res.data);
      } catch (err) {
        console.error('Error fetching payments:', err);
      }
    };
    fetchPayments();
  }, [authTokens]);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Your Paystack Payments</h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Amount (KES)</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Reference</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="p-2 border">{payment.amount}</td>
              <td className="p-2 border">{payment.phone}</td>
              <td className="p-2 border">{payment.reference}</td>
              <td className="p-2 border">{payment.status}</td>
              <td className="p-2 border">{new Date(payment.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserPayments;
