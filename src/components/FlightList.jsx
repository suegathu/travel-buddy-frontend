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
  const navigate = useNavigate();

  const fetchFlightsFromAviationStack = async () => {
    setLoading(true);
    setError("");

    if (!search.from || !search.to || !search.date) {
      setError("Please enter departure, destination, and date.");
      setLoading(false);
      return;
    }

    try {
      const flightsData = await api.searchFlights(
        search.from,
        search.to,
        search.date
      );
      console.log("Fetched Flights:", flightsData);

      // Inject a generated price if it's missing
      const flightsWithPrices = flightsData.map((flight) => ({
        ...flight,
        price: flight.price ?? generatePrice(),
      }));

      setFlights(flightsWithPrices);
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError(
        err.response?.data?.message ||
          "Error fetching flights. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate to booking page with flight data
  const navigateToBooking = (flight) => {
    const flightId = flight.id ?? flight.flight_number;
    
    if (!flightId) {
      setError("Flight ID is missing. Unable to book.");
      return;
    }
    
    // Pass the entire flight object as state to the booking page
    navigate(`/book-flight/${flightId}`, { 
      state: { flightData: flight } 
    });
  };

  // Format date for better display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "Not available";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (err) {
      return dateTimeStr, err;
    }
  };

  return (
    <div>
      <h1>Search Flights</h1>
      <TextField
        label="From"
        variant="outlined"
        value={search.from}
        onChange={(e) => setSearch({ ...search, from: e.target.value })}
        style={{ marginRight: "10px" }}
      />
      <TextField
        label="To"
        variant="outlined"
        value={search.to}
        onChange={(e) => setSearch({ ...search, to: e.target.value })}
        style={{ marginRight: "10px" }}
      />
      <TextField
        type="date"
        variant="outlined"
        value={search.date}
        onChange={(e) => setSearch({ ...search, date: e.target.value })}
        style={{ marginRight: "10px" }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={fetchFlightsFromAviationStack}
      >
        Search Flights
      </Button>

      {loading && <CircularProgress style={{ marginTop: "20px" }} />}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <Grid container spacing={2} style={{ marginTop: "20px" }}>
        {flights.length > 0 ? (
          flights.map((flight, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {flight.airline} ({flight.flight_number})
                  </Typography>
                  <Typography>From: {flight.departure_airport}</Typography>
                  <Typography>To: {flight.arrival_airport}</Typography>
                  <Typography>Departure: {formatDateTime(flight.departure_time)}</Typography>
                  <Typography>Arrival: {formatDateTime(flight.arrival_time)}</Typography>
                  <Typography>
                    Seats Available: {flight.available_seats ?? "Not Available"}
                  </Typography>
                  <Typography>Price: ${flight.price}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigateToBooking(flight)}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          !loading && <p>No flights available.</p>
        )}
      </Grid>
    </div>
  );
};

export default FlightList;