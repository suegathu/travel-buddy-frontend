import React, { useState } from "react";
import api from "../api/api";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Box,
  Alert,
  Snackbar
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Generate a random price between $100 and $1000
const generatePrice = () => {
  return (Math.floor(Math.random() * 900) + 100).toFixed(2);
};

const FlightList = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState({ from: "", to: "", date: "" });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const navigate = useNavigate();

  const fetchFlights = async () => {
    setLoading(true);
    setError("");
    setFlights([]);

    if (!search.from || !search.to) {
      setError("Please enter departure and destination airports.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.searchFlights(
        search.from,
        search.to,
        search.date
      );
      
      console.log("API Response:", response);
      
      // Check if the response is an error object
      if (response && response.error) {
        setError(response.error);
        setLoading(false);
        return;
      }
      
      // Check if we have flight data to process
      if (Array.isArray(response) && response.length > 0) {
        // Inject a generated price if it's missing
        const flightsWithPrices = response.map((flight) => ({
          ...flight,
          price: flight.price ?? generatePrice(),
        }));

        setFlights(flightsWithPrices);
        console.log("Processed flights:", flightsWithPrices);
      } else {
        setError("No flights found for the selected route. Try different airports.");
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError(
        err.message || "Error fetching flights. Please check your internet connection."
      );
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate to booking page with flight data
  const navigateToBooking = (flight) => {
    const flightId = flight.id ?? flight.flight_number;
    
    if (!flightId) {
      setError("Flight ID is missing. Unable to book.");
      setShowSnackbar(true);
      return;
    }
    
    // Pass the entire flight object as state to the booking page
    navigate(`/book-flight/${flightId}`, { 
      state: { flightData: flight } 
    });
  };

  // Format date for better display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr || dateTimeStr === "Unknown Time") return "Not available";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (err) {
      return dateTimeStr;
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Flights
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <TextField
          label="From (Airport Code)"
          variant="outlined"
          value={search.from}
          onChange={(e) => setSearch({ ...search, from: e.target.value.toUpperCase() })}
          placeholder="e.g. LAX"
          fullWidth
          size="small"
        />
        <TextField
          label="To (Airport Code)"
          variant="outlined"
          value={search.to}
          onChange={(e) => setSearch({ ...search, to: e.target.value.toUpperCase() })}
          placeholder="e.g. JFK"
          fullWidth
          size="small"
        />
        <TextField
          type="date"
          label="Date"
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          value={search.date}
          onChange={(e) => setSearch({ ...search, date: e.target.value })}
          fullWidth
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={fetchFlights}
          disabled={loading}
          sx={{ minWidth: '120px', height: '40px' }}
        >
          {loading ? <CircularProgress size={24} /> : "Search Flights"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {flights.length > 0 ? (
          flights.map((flight, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {flight.airline || "Airline"} ({flight.flight_number})
                  </Typography>
                  <Typography variant="body1">
                    <strong>From:</strong> {flight.origin || flight.departure_airport}
                  </Typography>
                  <Typography variant="body1">
                    <strong>To:</strong> {flight.destination || flight.arrival_airport}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Departure:</strong> {formatDateTime(flight.departure_time)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Arrival:</strong> {formatDateTime(flight.arrival_time)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Seats Available:</strong> {flight.available_seats ?? "Not Available"}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    Price: ${flight.price}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigateToBooking(flight)}
                  >
                    Book Now
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          !loading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  No flights available. Try searching with different airports.
                </Typography>
              </Box>
            </Grid>
          )
        )}
      </Grid>
      
      <Snackbar 
        open={showSnackbar} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FlightList;