import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

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
      setFlights(flightsData);
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Search Flights</h1>
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="From"
          className="border border-gray-300 rounded-md px-4 py-2 w-48"
          value={search.from}
          onChange={(e) => setSearch({ ...search, from: e.target.value })}
        />
        <input
          type="text"
          placeholder="To"
          className="border border-gray-300 rounded-md px-4 py-2 w-48"
          value={search.to}
          onChange={(e) => setSearch({ ...search, to: e.target.value })}
        />
        <input
          type="date"
          className="border border-gray-300 rounded-md px-4 py-2 w-48"
          value={search.date}
          onChange={(e) => setSearch({ ...search, date: e.target.value })}
        />
        <button
          onClick={fetchFlightsFromAviationStack}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Search Flights
        </button>
      </div>

      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {flights.length > 0 ? (
          flights.map((flight, index) => {
            const flightId = flight.id ?? flight.flight_number ?? null;

            return (
              <div key={index} className="bg-white shadow rounded-xl p-4">
                <h2 className="text-lg font-semibold mb-2">
                  {flight.airline} ({flight.flight_number})
                </h2>
                <p>From: {flight.departure_airport}</p>
                <p>To: {flight.arrival_airport}</p>
                <p>Departure: {flight.departure_time}</p>
                <p>Arrival: {flight.arrival_time}</p>
                <p>
                  Seats Available:{" "}
                  {flight.available_seats ?? "Not Available"}
                </p>
                <p>Price: ${flight.price ?? "TBD"}</p>
                <button
                  disabled={!flightId}
                  onClick={() => {
                    if (!flightId) {
                      setError("Flight ID is missing. Unable to book.");
                    } else {
                      navigate(`/book-flight/${flightId}`);
                    }
                  }}
                  className={`mt-4 w-full px-4 py-2 rounded-md text-white ${
                    flightId
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  } transition`}
                >
                  Book Now
                </button>
              </div>
            );
          })
        ) : (
          !loading && <p className="text-gray-600">No flights available.</p>
        )}
      </div>
    </div>
  );
};

export default FlightList;
