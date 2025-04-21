import axios from "axios";
export const API_BASE_URL = 'http://localhost:8000/api/flights';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  });
  
  export const getAuthToken = () => localStorage.getItem("token");
  
  // Helper function to handle errors
  const handleError = (error) => {
    console.error("API Error:", error);
    return { error: error.response?.data?.message || "An error occurred" };
  };
const api = {
    searchFlights: async (from, to) => {
      try {
        const token = getAuthToken();
        if (!token) {
          return { success: false, message: "User not authenticated. Please log in." };
        }
        const response = await apiClient.get(`/fetch-flights/`, {
            params: { dep_iata: from, arr_iata: to },
            headers: { Authorization: `Bearer ${token}` },
          });
          
  
        // Extract flights array from the response
        if (Array.isArray(response.data)) {
          return response.data.map((flight) => ({
            flight_number: flight.flight_number,
            airline: flight.airline,
            departure_airport: flight.departure_airport,
            arrival_airport: flight.arrival_airport,
            departure_time: flight.departure_time,
            arrival_time: flight.arrival_time,
            status: flight.status,
          }));
  
        } else {
          console.error("Unexpected response format:", response.data);
          return [];
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
        return handleError(error);
      }
    },
  
    // 🔹 Fetch Flights (Local API)
    fetchFlightsFromAviationStack: async (from, to) => {
      try {
        const response = await axios.get(`https://api.aviationstack.com/v1/flights`, {
          params: {
            access_key: import.meta.env.VITE_AVIATIONSTACK_API_KEY,
            dep_iata: from,
            arr_iata: to,
          },
        });
  
        console.log("Full API Response:", response.data);
  
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
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
        console.error("Error fetching flights:", error);
        return [];
      }
    },
  
  
    // 🔹 Fetch Flight Details
    fetchFlightDetails: async (flightId) => {
      try {
        const response = await apiClient.get(`/flights/${flightId}/`);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
  
    // 🔹 Create Flight Booking (with Authentication)
    bookFlight: async (flightNumber, seatNumber) => {
      try {
        const token = getAuthToken();
        if (!token) {
          return { success: false, message: "User not authenticated. Please log in." };
        }
  
        const response = await apiClient.post(
          `/book-flight/`,
          { flight_number: flightNumber, seat_number: seatNumber },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        return {
          success: true,
          booking: response.data,
          message: "Flight booked successfully",
        };
      } catch (error) {
        return { success: false, message: error.response?.data?.error || "Booking failed" };
      }
    },
    getAvailableSeats: async (flightNumber) => {
      try {
        const response = await apiClient.get(`/flights/${flightNumber}/available-seats/`);
        return response.data;
      } catch (error) {
        console.error("Error fetching available seats:", error);
        return { error: "Failed to fetch available seats." };
      }
    },
    getBookingDetails: async (bookingId) => {
      try {
        const token = getAuthToken();
        if (!token) return { error: "User not logged in" };
  
        const response = await apiClient.get(`/bookings/${bookingId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    getMyBookings: async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          return { error: "User not logged in" };
        }
  
        const response = await apiClient.get(`/my-bookings/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
   // api.js
  
   cancelBooking: async (bookingId) => {
    try {
        const response = await axios.patch(
            `http://127.0.0.1:8000/api/bookings/${bookingId}/cancel/`, // Ensure this matches your URL pattern
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            }
        );
        return response.data;
    } catch (err) {
        console.error("Error cancelling booking:", err);
        throw err; // Rethrow the error to be handled in the frontend
    }
  },
  
  };
  export default api;