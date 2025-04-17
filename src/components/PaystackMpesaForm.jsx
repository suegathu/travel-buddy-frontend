import React, { useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const PaystackMpesaForm = () => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);
  const { authTokens } = useContext(AuthContext);

  const handlePay = async (e) => {
    e.preventDefault();
    setStatus("Processing...");

    try {
      const res = await axios.post(
        "/api/paystack/mpesa/",
        { phone, amount },
        {
          headers: {
            Authorization: `Bearer ${authTokens?.access}`,
          },
        }
      );
      setStatus(res.data.message || "Payment initiated");
    } catch (err) {
      console.error(err);
      setStatus("Payment failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Pay via M-Pesa (Paystack)</h2>
      <form onSubmit={handlePay} className="space-y-4">
        <input
          type="text"
          placeholder="Phone (07XXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Pay Now
        </button>
        {status && <p className="text-center mt-4">{status}</p>}
      </form>
    </div>
  );
};

export default PaystackMpesaForm;
