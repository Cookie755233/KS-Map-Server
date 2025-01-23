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
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5002', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Import initial data if database is empty
const importInitialData = async () => {
  try {
    // Check if sample_data collection is empty
    const db = mongoose.connection.db;
    console.log('Connected to database, checking collections...');
    const collections = await db.listCollections().toArray();
    console.log('Database collections:', collections.map(c => c.name));

    const count = await db.collection('sample_data').countDocuments();
    console.log('Current count in sample_data:', count);

    if (count === 0) {
      console.log('No data found, starting import...');
      const csvFilePath = path.join(__dirname, '../data/locations_real.csv');
      console.log('Looking for CSV file at:', csvFilePath);

      if (!fs.existsSync(csvFilePath)) {
        console.error('CSV file not found:', csvFilePath);
        return;
      }

      const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
      console.log('CSV file loaded, parsing...');

      return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              if (!results.data || results.data.length === 0) {
                console.error('No data found in CSV file');
                reject(new Error('No data found in CSV file'));
                return;
              }

              console.log('Parsed CSV data, first record:', results.data[0]);
              console.log('Total records found:', results.data.length);

              const locations = results.data.map(record => ({
                parcel: record['地號'] || '',
                designer: record['設計人'] || '',
                constructionCompany: record['建設公司'] || '',
                landUseZone: record['土地使用分區'] || '',
                aboveGroundFloors: record['地上層數'] || '',
                undergroundFloors: record['地下層數'] || '',
                solarPower: record['太陽光電(kW)'] || record['太陽光電設施'] || '',
                universalBathroom: record['通用化浴廁(平方公尺)'] || record['通用化浴廁設計'] || '',
                universalCommonRoom: record['通用化交誼廳(平方公尺)'] || record['通用化交誼室'] || '',
                universalElevator: record['通用化昇降機(平方公尺)'] || record['通用化昇降設備'] || '',
                landscapeBalcony: record['景觀陽臺(平方公尺)'] || record['景觀陽台'] || '',
                rainwaterCollection: record['雨水貯集(立方公尺)'] || record['雨水回收'] || '',
                frontGreenEnergy: record['屋前綠能設施(平方公尺)'] || record['前院綠能設施'] || '',
                backGreenEnergy: record['屋後綠能設施(平方公尺)'] || record['後院綠能設施'] || '',
                latitude: parseFloat(record['latitude']),
                longitude: parseFloat(record['longitude'])
              }));

              console.log('Mapped data, attempting to insert...');
              await db.collection('sample_data').insertMany(locations);
              console.log(`Successfully imported ${locations.length} sample locations to sample_data collection`);
              resolve();
            } catch (error) {
              console.error('Error inserting locations:', error);
              reject(error);
            }
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            reject(error);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error during import process:', error);
    throw error;
  }
};

/* <--- Sample Data Upload Section, enable this if you want to upload sample data --->
const uploadSampleData = async () => {
  const sampleDataExists = await Location.exists({ type: 'sample' });
  if (!sampleDataExists) {
    try {
      const sampleData = JSON.parse(fs.readFileSync('data/sample-data.json', 'utf8'));
      await Location.insertMany(sampleData);
      console.log('Sample data uploaded successfully');
    } catch (error) {
      console.error('Error uploading sample data:', error);
    }
  }
};

uploadSampleData();
<--- End Sample Data Upload Section ---> */

// Routes
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

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