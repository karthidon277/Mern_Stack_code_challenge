const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/your-database-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a schema for your data
const seedDataSchema = new mongoose.Schema({
  // Define your schema fields
  // Example: name: String,
});

const SeedData = mongoose.model('SeedData', seedDataSchema);

// Define your API endpoint to initialize the database
app.get('/initialize-database', async (req, res) => {
  try {
    // Fetch JSON data from a third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product transaction.json');
    const jsonData = response.data;

    // Insert seed data into the database
    await SeedData.insertMany(jsonData);

    res.status(200).json({ message: 'Database initialized with seed data.' });
  } catch (error) {
    console.error('Error initializing database:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
