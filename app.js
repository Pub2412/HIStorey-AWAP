const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve public files
app.use('/public', express.static(path.join(__dirname, 'public')))

// Basic root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'))
});

// API routes
const products = require('./routes/products')
const transactions = require('./routes/transactions')
const userRoutes = require('./routes/user')

app.use('/api/v1', products)
app.use('/api/v1', transactions)
app.use('/api/v1', userRoutes)

module.exports = app