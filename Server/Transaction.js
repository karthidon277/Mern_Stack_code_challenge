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
  // Other fields in your schema
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

app.get('/statistics/:month', async (req, res) => {
  try {
    const requestedMonth = req.params.month;

    // Validate if the input month is valid
    if (!moment(requestedMonth, 'MMMM', true).isValid()) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const startOfMonth = moment(requestedMonth, 'MMMM').startOf('month');
    const endOfMonth = moment(requestedMonth, 'MMMM').endOf('month');

    // Total sale amount of selected month
    const totalSaleAmount = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' },
        },
      },
    ]);

    // Total number of sold items of selected month
    const totalSoldItems = await Transaction.countDocuments({
      dateOfSale: {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate(),
      },
    });

    // Total number of not sold items of selected month
    const totalNotSoldItems = await Transaction.countDocuments({
      dateOfSale: {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate(),
      },
      // Customize this condition based on your schema for not sold items
      // Example: { sold: false }
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
