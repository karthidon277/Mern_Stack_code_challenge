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
  // Other fields in your schema
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

app.get('/bar-chart/:month', async (req, res) => {
  try {
    const requestedMonth = req.params.month;

    // Validate if the input month is valid
    if (!moment(requestedMonth, 'MMMM', true).isValid()) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const startOfMonth = moment(requestedMonth, 'MMMM').startOf('month');
    const endOfMonth = moment(requestedMonth, 'MMMM').endOf('month');

    // Define price ranges
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
      { min: 901, max: Infinity }, // 'Infinity' represents anything above 900
    ];

    // Calculate the number of items in each price range
    const barChartData = await Promise.all(
      priceRanges.map(async ({ min, max }) => {
        const count = await Transaction.countDocuments({
          dateOfSale: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
          price: { $gte: min, $lte: max },
        });

        return { range: `${min}-${max === Infinity ? 'above' : max}`, count };
      })
    );

    res.status(200).json(barChartData);
  } catch (error) {
    console.error('Error fetching bar chart data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
