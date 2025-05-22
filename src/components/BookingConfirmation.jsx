import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const confirmationRef = useRef();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://travel-buddy-backend-8kf4.onrender.com/api/bookings/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBooking(response.data);
      } catch (error) {
        setError('Error fetching booking details. Please try again later.');
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const downloadPDF = () => {
    const element = confirmationRef.current;
    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`booking_${id}.pdf`);
    });
  };

  if (loading) return <div className="text-center py-10 text-gray-600 text-lg">Loading booking details...</div>;
  if (error) return <div className="text-center py-10 text-red-600 text-lg">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div ref={confirmationRef} className="bg-white shadow-md rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-green-600">Booking Confirmed</h1>
          <div className="text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {booking ? (
          <>
            <div className="flex flex-col md:flex-row items-start gap-4">
              {booking.hotel_details?.image_url && (
                <img
                  src={booking.hotel_details.image_url}
                  alt={booking.hotel_details.name}
                  className="w-full md:w-48 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">{booking.hotel_details?.name || 'N/A'}</h2>
                <p className="text-gray-500">{booking.hotel_details?.address || 'N/A'}</p>

                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.564-.955L10 0l2.948 5.955 6.564.955-4.756 4.635 1.122 6.545z" />
                  </svg>
                  <p className="text-sm text-gray-600">Rating: {booking.hotel_details?.rating || 'No rating available'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-blue-800">Check-in</p>
                <p className="text-lg font-semibold">{booking.check_in_date}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-purple-800">Check-out</p>
                <p className="text-lg font-semibold">{booking.check_out_date}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Price:</span>
                <span className="font-semibold text-green-600">${booking.total_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-block bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full capitalize">
                  {booking.status}
                </span>
              </div>
            </div>

            {booking.qr_code_url && (
              <div className="text-center mt-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Scan this QR Code at check-in</p>
                <img src={booking.qr_code_url} alt="QR Code" className="mx-auto w-32 h-32" />
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-4">No booking details available.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
        <button onClick={downloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
        <button onClick={() => navigate('/my-bookings')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Bookings
        </button>
        <button onClick={() => navigate('/')} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
