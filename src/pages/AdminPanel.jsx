import { useState } from "react";
import AdminUsers from "../components/AdminUsers";
import AdminPlaces from "../components/AdminPlaces";
import AdminBookings from "../components/AdminBookings";
import AdminPayments from "../components/AdminPayment";
import FlightAdmin from "../components/FlightAdmin";
import AdminFlightBookings from "../components/AdminFlightBooking";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");

  const renderTab = () => {
    switch (activeTab) {
      case "users":
        return <AdminUsers />;
      case "places":
        return <AdminPlaces />;
      case "bookings":
        return <AdminBookings />;
      case "payments":
        return <AdminPayments />;
      case 'flight':
        return <AdminFlightBookings />;  
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Admin Panel</h1>
      
      {/* Responsive tabs - horizontal on desktop, vertical menu on mobile */}
      <div className="mb-4 md:mb-6">
        {/* Mobile dropdown menu */}
        <div className="block md:hidden mb-4">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="users">Users</option>
            <option value="places">Places</option>
            <option value="bookings">Bookings</option>
            <option value="payments">Payments</option>
            <option value="flight">Flights</option>
          </select>
        </div>
        
        {/* Desktop tab buttons */}
        <div className="hidden md:flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab("users")} 
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "users" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab("places")} 
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "places" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Places
          </button>
          <button 
            onClick={() => setActiveTab("bookings")} 
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "bookings" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab("payments")} 
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "payments" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Payments
          </button>
          <button 
            onClick={() => setActiveTab("flight")} 
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "payments" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            flight
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white shadow rounded p-2 md:p-4">
        {renderTab()}
      </div>
    </div>
  );
};

export default AdminPanel;