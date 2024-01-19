const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/your-database-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TransactionSchema = new mongoose.Schema({
  dateOfSale: Date,
  productTitle: String,
  price: Number,
  category: String,
  sold: Boolean,
  // Other fields in your schema
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// Function to calculate bar chart data
async function calculateBarChartData(startOfMonth, endOfMonth) {
  const priceRanges = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: Infinity },
  ];

  const barChartData = await Promise.all(
    priceRanges.map(async ({ min, max }) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        price: { $gte: min, $lte: max },
      });

      return { range: `${min}-${max === Infinity ? 'above' : max}`, count };
    })
  );

  return barChartData;
}

// API for pie chart
app.get('/pie-chart/:month', async (req, res) => {
  try {
    const requestedMonth = req.params.month;

    if (!moment(requestedMonth, 'MMMM', true).isValid()) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const startOfMonth = moment(requestedMonth, 'MMMM').startOf('month');
    const endOfMonth = moment(requestedMonth, 'MMMM').endOf('month');

    // Get unique categories and count of items for the selected month
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(categoryData);
  } catch (error) {
    console.error('Error fetching pie chart data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to fetch data from all three APIs and combine responses
app.get('/combined-data/:month', async (req, res) => {
  try {
    const requestedMonth = req.params.month;

    if (!moment(requestedMonth, 'MMMM', true).isValid()) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const startOfMonth = moment(requestedMonth, 'MMMM').startOf('month');
    const endOfMonth = moment(requestedMonth, 'MMMM').endOf('month');

    // Get data from the three APIs
    const totalSaleAmount = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' },
        },
      },
    ]);

    const totalSoldItems = await Transaction.countDocuments({
      dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      sold: true,
    });

    const totalNotSoldItems = await Transaction.countDocuments({
      dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      sold: false,
    });

    const barChartData = await calculateBarChartData(startOfMonth, endOfMonth);

    const pieChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // Combine responses
    const combinedData = {
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
      barChartData,
      pieChartData,
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
