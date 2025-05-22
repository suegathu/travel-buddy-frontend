// api.js
import axios from "axios";

// Set the base URL to the provided render.com URL
const API_BASE_URL = "https://travel-buddy-backend-8kf4.onrender.com";

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL + "/api/flights",
  timeout: 10000, // Increased timeout for potentially slow responses
  headers: {
    "Content-Type": "application/json",
  },
});

// Handle errors
const handleError = (error) => {
  console.error("API Error:", error);
  if (error.response) {
    return { error: error.response.data.detail || error.response.data.error || "Something went wrong" };
  } else if (error.request) {
    return { error: "Server didn't respond. Please try again later." };
  } else {
    return { error: "Network error. Please try again." };
  }
};

// This function will be used to get the auth token
const getAuthHeaders = () => {
  const authTokens = localStorage.getItem("authTokens");
  if (authTokens) {
    const tokens = JSON.parse(authTokens);
    return {
      Authorization: `Bearer ${tokens.access}`
    };
  }
  return {};
};

// Main API methods
const api = {
  searchFlights: async (from, to, date) => {
    try {
      console.log(`Searching flights from ${from} to ${to} on ${date}`);
      const response = await apiClient.get("/fetch-flights/", {
        params: { dep_iata: from, arr_iata: to },
      });

      console.log("Raw API response:", response.data);
      
      // If the response is an object with a 'results' property, use that
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // If the response is directly an array, use it
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // If the response is an object but not in the expected format
      else if (typeof response.data === 'object' && response.data !== null) {
        // Return as an array with the single object
        return [response.data];
      } else {
        console.error("Unexpected response format:", response.data);
        return [];
      }
    } catch (error) {
      return handleError(error);
    }
  },

  fetchFlightsFromAviationStack: async (from, to) => {
    try {
      const response = await axios.get("https://api.aviationstack.com/v1/flights", {
        params: {
          access_key: import.meta.env.VITE_AVIATIONSTACK_API_KEY,
          dep_iata: from,
          arr_iata: to,
        },
      });

      if (!response.data?.data || !Array.isArray(response.data.data)) {
        console.error("Unexpected API response format:", response.data);
        return [];
      }

      return response.data.data.map((flight) => ({
        flight_number: flight.flight?.iata || "N/A",
        airline: flight.airline?.name || "Unknown Airline",
        departure_airport: flight.departure?.airport || "Unknown Airport",
        arrival_airport: flight.arrival?.airport || "Unknown Airport",
        departure_time: flight.departure?.estimated || "Unknown Time",
        arrival_time: flight.arrival?.estimated || "Unknown Time",
        status: flight.flight_status || "Unknown",
      }));
    } catch (error) {
      return handleError(error);
    }
  },

  fetchFlightDetails: async (flightId) => {
    try {
      const response = await apiClient.get(`/flight-details/${flightId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  bookFlight: async (flightNumber, seatNumber) => {
    try {
      const response = await apiClient.post("/book-flight/", {
        flight_number: flightNumber,
        seat_number: seatNumber,
      }, {
        headers: getAuthHeaders() // Add auth headers to the request
      });

      return {
        success: true,
        booking_id: response.data.id, // Make sure your response includes an ID
        booking: response.data,
        message: "Flight booked successfully"
      };
    } catch (error) {
      console.error("Booking error:", error);
      return { 
        success: false, 
        message: error.response?.data?.error || "Booking failed" 
      };
    }
  },

  getAvailableSeats: async (flightNumber) => {
    try {
      const response = await apiClient.get(`/flights/${flightNumber}/available-seats/`, {
        headers: getAuthHeaders() // Add auth headers to the request
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return { error: "Failed to fetch available seats."};
    }
  },

  getBookingDetails: async (bookingId) => {
    try {
      const response = await apiClient.get(`/booking-details/${bookingId}/`, {
        headers: getAuthHeaders() // Add auth headers to the request
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getMyBookings: async () => {
    try {
      const response = await apiClient.get("/my-flight-bookings/", {
        headers: getAuthHeaders() // Add auth headers to the request
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const response = await apiClient.patch(`/cancel-flight-booking/${bookingId}/`, {}, {
        headers: getAuthHeaders() // Add auth headers to the request
      });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return { 
        success: false,
        message: error.response?.data?.error || "Failed to cancel booking" 
      };
    }
  },
};

export default api;