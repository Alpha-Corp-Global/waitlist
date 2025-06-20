const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { PORT, MONGODB_URI } = require('./config');
const { z } = require('zod');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

// Define Waitlist schema
const waitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});
const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// POST endpoint
app.post('/api/waitlist', async (req, res) => {
  const emailSchema = z.object({ email: z.string().email() });
  const parseResult = emailSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  const { email } = parseResult.data;
  try {
    const entry = new Waitlist({ email });
    await entry.save();
    res.status(201).json({ message: 'Email added to waitlist!' });
  } catch (err) {
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
});