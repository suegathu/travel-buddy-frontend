import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Paper,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';

const FlightPayment = () => {
  const { authTokens, user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get flight booking details from the state
  const { bookingId, flightDetails, selectedSeat, amount } = location.state || {};

  const [email, setEmail] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('card');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (!bookingId || !flightDetails) {
      navigate('/flights');
      return;
    }

    if (user?.email) {
      setEmail(user.email);
    }

    if (amount) {
      setPaymentAmount(amount);
    }
  }, [user, amount, bookingId, flightDetails, navigate]);

  useEffect(() => {
    const generateReference = () => {
      const date = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `flight-${date}-${randomStr}`;
    };
    setReference(generateReference());

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  // Display flight booking details
  const renderBookingDetails = () => {
    if (flightDetails) {
      return (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="h6" gutterBottom>Booking Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Booking ID</Typography>
              <Typography variant="body1">{bookingId}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Flight Number</Typography>
              <Typography variant="body1">{flightDetails.flight_number}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">From</Typography>
              <Typography variant="body1">{flightDetails.departure_airport || flightDetails.origin}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">To</Typography>
              <Typography variant="body1">{flightDetails.arrival_airport || flightDetails.destination}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Departure</Typography>
              <Typography variant="body1">{formatDateTime(flightDetails.departure_time)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Seat</Typography>
              <Typography variant="body1">{selectedSeat}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Amount Due</Typography>
              <Typography variant="h6" color="primary">${paymentAmount}</Typography>
            </Grid>
          </Grid>
        </Box>
      );
    }
    return null;
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardExpiry(value);
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/\D/g, '');
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    setCardNumber(parts.join(' ').trim());
  };

  const initiatePaystackPayment = () => {
    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_3f5891c7c1997586f49bd3a16a7ea1a5951a8979',
        email: email,
        amount: parseFloat(paymentAmount) * 100,
        ref: reference,
        currency: "KES",
        metadata: {
          booking_id: bookingId,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: bookingId
            }
          ]
        },
        callback: function(response) {
          verifyPayment(response.reference);
        },
        onClose: function() {
          setIsLoading(false);
          setStatus('Payment cancelled. You can try again.');
        }
      });
      handler.openIframe();
    } else {
      setStatus('Payment gateway not available. Please try again later.');
      setIsLoading(false);
    }
  };

  const processDirectCardPayment = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`,
        'Content-Type': 'application/json',
      };
      
      const initRes = await axios.post('/api/paystack/initialize/', {
        email,
        amount: paymentAmount,
        reference,
        booking_id: bookingId
      }, { headers });
      
      if (initRes.status === 200) {
        initiatePaystackPayment();
      } else {
        setStatus('Could not initiate payment. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setStatus(`Payment failed: ${err.response?.data?.message || 'Please try again'}`);
      setIsLoading(false);
    }
  };

  const processMpesaPayment = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`,
        'Content-Type': 'application/json',
      };
      
      const res = await axios.post('/api/paystack/mpesa/', {
        phone,
        email,
        amount: paymentAmount,
        reference,
        booking_id: bookingId
      }, { headers });
      
      if (res.status === 200) {
        setStatus('STK Push sent to your phone. Please complete the payment.');
        startPolling(reference);
      } else {
        setStatus('Failed to initiate M-Pesa payment. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('M-Pesa payment error:', err);
      setStatus(`M-Pesa payment failed: ${err.response?.data?.message || 'Please try again'}`);
      setIsLoading(false);
    }
  };

  const verifyPayment = async (ref) => {
    try {
      const headers = {
        Authorization: `Bearer ${authTokens?.access}`
      };
      
      const response = await axios.get(`/api/status/${ref}/`, { headers });
      
      if (response.data.status === 'success') {
        setPaymentStatus('success');
        setStatus('Payment completed successfully!');
        setTimeout(() => {
          navigate('/checkin');
        }, 2000);
      } else if (response.data.status === 'failed') {
        setPaymentStatus('failed');
        setStatus('Payment verification failed. Please try again.');
      } else {
        setStatus('Payment is being processed. We will update you once completed.');
        startPolling(ref);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('Error verifying payment. Please check your payment status in your account.');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (ref) => {
    const pollInterval = setInterval(async () => {
      try {
        const headers = {
          Authorization: `Bearer ${authTokens?.access}`
        };
        
        const response = await axios.get(`/api/status/${ref}/`, { headers });
        
        if (response.data.status === 'success') {
          clearInterval(pollInterval);
          setPaymentStatus('success');
          setStatus('Payment completed successfully!');
          setIsLoading(false);
          setTimeout(() => {
            navigate('/my-bookings');
          }, 2000);
        } else if (response.data.status === 'failed') {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          setStatus('Payment failed. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);

    setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
      if (paymentStatus !== 'success') {
        setStatus('Payment verification timed out. Please check your payment status in your account.');
      }
    }, 120000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Processing payment...');

    if (!paymentAmount || !email) {
      setStatus('Please provide email and amount.');
      setIsLoading(false);
      return;
    }
    
    if (method === 'mpesa' && !phone) {
      setStatus('Please provide a phone number for M-Pesa payment.');
      setIsLoading(false);
      return;
    }
    
    if (method === 'mpesa') {
      processMpesaPayment();
    } else if (method === 'card') {
      processDirectCardPayment();
    } else {
      setStatus('This payment method is not yet implemented.');
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Flight Payment
        </Typography>
        
        {/* Display booking details */}
        {renderBookingDetails()}
        
        <form onSubmit={handlePayment}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Amount (KES)"
                type="number"
                fullWidth
                variant="outlined"
                value={paymentAmount}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Payment Method
                </Typography>
                <RadioGroup
                  row
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <FormControlLabel value="card" control={<Radio />} label="Credit/Debit Card" />
                  <FormControlLabel value="mpesa" control={<Radio />} label="M-Pesa" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {method === 'mpesa' && (
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  variant="outlined"
                  placeholder="254XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  helperText="Format: 254XXXXXXXXX (with country code)"
                  required={method === 'mpesa'}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Complete Payment'}
              </Button>
            </Grid>
          </Grid>
        </form>
        
        {status && (
          <Alert 
            severity={
              status.includes('success') ? 'success' : 
              status.includes('failed') || status.includes('error') ? 'error' : 
              'info'
            }
            sx={{ mt: 3 }}
          >
            {status}
          </Alert>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <img 
            src="/api/placeholder/200/40" 
            alt="Secured by Paystack" 
          />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Payments are securely processed by Paystack
          </Typography>
        </Box>

        {import.meta.env.MODE !== 'production'  && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Test Mode Active - For test cards, use:</Typography>
            <ul>
              <li>Success: 4084 0840 8408 4081</li>
              <li>Failed: 4084 0840 8408 4040</li>
              <li>Any expiry date (MM/YY) and CVV</li>
            </ul>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default FlightPayment;