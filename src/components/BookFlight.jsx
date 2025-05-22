import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/api";
import './BookFlight.css';
import {
  Button,
  Container,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import AuthContext from "../context/AuthContext";

const BookFlight = () => {
  const { flightId } = useParams();  // Get the flightId from URL params
  const location = useLocation();  // Use location to access state
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  // State for flight details - either from navigation state or fetched
  const [flightDetails, setFlightDetails] = useState(location.state?.flightData || null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  // Ensure the user is authenticated
  useEffect(() => {
    if (!authTokens) {
      navigate("/", { state: { from: `/book-flight/${flightId}` } });
    } else {
      // If flight details weren't passed through navigation state, fetch them
      if (!flightDetails) {
        fetchFlightDetails();
      }
      fetchAvailableSeats();
    }
  }, [authTokens, flightId, navigate, flightDetails]);

  const fetchFlightDetails = async () => {
    try {
      const response = await api.fetchFlightDetails(flightId);
      if (response) {
        setFlightDetails(response);
      }
    } catch (err) {
      console.error("Error fetching flight details:", err);
      setError("Failed to fetch flight details.");
    }
  };

  const fetchAvailableSeats = async () => {
    setLoading(true);
    setError("");
    try {
      const seats = await api.getAvailableSeats(flightId);
      
      if (Array.isArray(seats)) {
        setAvailableSeats(seats);
      } else if (seats.available_seats && Array.isArray(seats.available_seats)) {
        setAvailableSeats(seats.available_seats);
      } else if (seats.error) {
        throw new Error(seats.error);
      } else {
        throw new Error("Invalid seats format.");
      }
    } catch (err) {
      console.error("Error fetching seats:", err);
      setAvailableSeats([]);
      setError("Failed to fetch available seats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
      setError("Please select a seat.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await api.bookFlight(flightId, selectedSeat);
      if (response && response.success) {
        setMessage(`Booking successful! Booking ID: ${response.booking.id}`);
        setBookingId(response.booking.id);
        setError("");
        setSelectedSeat("");
        await fetchAvailableSeats();
  
        // Navigate to 'My Tickets' page with booking details
        setTimeout(() => {
          navigate("/payment", { 
            state: { 
              bookingId: response.booking.id,
              flightDetails: flightDetails,
              selectedSeat: selectedSeat,
              amount: flightDetails.price
            } 
          });
        }, 2000);
      } else {
        throw new Error(response.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "An error occurred while booking.");
    } finally {
      setLoading(false);
    }
  };
  

  // Format date/time for better display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "Not available";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (err) {
      return dateTimeStr;
    }
  };

  return (
    <Container maxWidth="md" className="book-flight-container">
      <Typography variant="h4" gutterBottom>
        Book Your Flight
      </Typography>

      {flightDetails ? (
        <Card className="flight-details-card" elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Flight Information
            </Typography>
            <Divider style={{ margin: "16px 0" }} />
            
            <div className="flight-info-grid">
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Airline</Typography>
                <Typography variant="body1">{flightDetails.airline}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Flight Number</Typography>
                <Typography variant="body1">{flightDetails.flight_number}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">From</Typography>
                <Typography variant="body1">{flightDetails.departure_airport || flightDetails.origin}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">To</Typography>
                <Typography variant="body1">{flightDetails.arrival_airport || flightDetails.destination}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Departure</Typography>
                <Typography variant="body1">{formatDateTime(flightDetails.departure_time)}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Arrival</Typography>
                <Typography variant="body1">{formatDateTime(flightDetails.arrival_time)}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Price</Typography>
                <Typography variant="h6" color="primary">Kes{flightDetails.price}</Typography>
              </div>
              
              <div className="flight-info-item">
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Typography variant="body1">{flightDetails.status || "Scheduled"}</Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <CircularProgress />
      ) : (
        <Alert severity="error">Flight details not available</Alert>
      )}

      <Card className="seat-selection-card" elevation={3} style={{ marginTop: '20px' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Select Your Seat
          </Typography>
          <Divider style={{ margin: "16px 0" }} />
          
          {loading ? (
            <CircularProgress />
          ) : (
            <>
              <Select
                value={selectedSeat}
                onChange={(e) => setSelectedSeat(e.target.value)}
                fullWidth
                displayEmpty
              >
                <MenuItem value="" disabled>Select a seat</MenuItem>
                {availableSeats.length > 0 ? (
                  availableSeats.map((seat, index) => (
                    <MenuItem key={index} value={seat}>
                      Seat {seat}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No seats available</MenuItem>
                )}
              </Select>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleBooking}
                fullWidth
                sx={{ marginTop: 2 }}
                disabled={loading || !selectedSeat}
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default BookFlight;