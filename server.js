const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { PORT, MONGODB_URI, Vercel_URL, LOCAL_URL, PRODUCTION_URL } = require('./config');
const { z } = require('zod');

const app = express();
app.use(express.json());

// CORS configuration for production
const allowedOrigins = [Vercel_URL, LOCAL_URL, PRODUCTION_URL];
app.use(cors({  
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Waitlist schema
const waitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// POST endpoint
app.post('/api/waitlist', async (req, res) => {
  console.log('Received waitlist request:', req.body);
  
  const emailSchema = z.object({ email: z.string().email() });
  const parseResult = emailSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('Invalid email format:', req.body.email);
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  const { email } = parseResult.data;
  
  try {
    const entry = new Waitlist({ email });
    await entry.save();
    console.log('Email added to waitlist:', email);
    res.status(201).json({ message: 'Email added to waitlist!' });
  } catch (err) {
    console.error('Error saving email:', err);
    if (err.code === 11000) {
      res.status(409).json({ error: 'Email already on waitlist.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});