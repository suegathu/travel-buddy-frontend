import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./components/AdminUsers";
import { AuthProvider } from "./context/AuthContext";
import EditUserForm from "./components/EditUserForm";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./components/Dashboard";
import Map from "./components/Map";
import AdminPlaces from "./components/AdminPlaces";
import AdminPanel from "./pages/AdminPanel";
import AdminBookings from "./components/AdminBookings";
import Place from "./pages/Place";
import HotelBookings from "./components/HotelBookings";
import Reservations from "./components/Reservations";
import Tickets from "./components/Tickets";
import MyTickets from "./components/MyTickets";
import TicketDetail from "./components/TicketDetails";
import Navbar from "./pages/Navbar";
import PaymentForm from "./components/PaymentForm";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<Map />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/users/:id/edit" element={<EditUserForm />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/admin-places" element={<AdminPlaces />} />
          <Route path="/admin-bookings" element={<AdminBookings />} />
          <Route path="/place" element={<Place />} />
          <Route path="/bookings/hotel/:id" element={<HotelBookings />} />
          <Route path="/reservations/restaurant/:placeId" element={<Reservations />} />
          <Route path="/tickets/attraction/:placeId" element={<Tickets />} />
          <Route path="/mytickets" element={<MyTickets />} />
         <Route path="/ticket-details/:id" element={<TicketDetail />} />
         <Route path="/payment/:id" element={<PaymentForm />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
