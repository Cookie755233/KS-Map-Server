require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const locationRoutes = require('./routes/locations');
const authRoutes = require('./routes/auth');
const Papa = require('papaparse');

// const csv = require('csv-parse');
// const Location = require('./models/Location');

const app = express();

// Update the CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow all Vercel preview deployments and production URL
    if (origin && (
      origin.includes('cookie755233s-projects.vercel.app') ||  // Any preview deployment
      origin === 'https://ks-map.vercel.app' ||               // Production URL
      origin.startsWith('http://localhost:')                  // Local development
    )) {
      callback(null, true);
      return;
    }

    console.log('Incoming origin:', origin);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5002;

// Remove the standalone app.listen and keep it only in the init function
const init = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Start server
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      try {
        await importInitialData();
      } catch (error) {
        console.error('Failed to import initial data:', error);
      }
    });
  } catch (err) {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
  }
};

init(); 