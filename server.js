'use strict';

const express = require('express');
const path = require('path');
const app = express();

// Set the view engine (if needed)
app.set('view engine', 'html');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit routes
app.get('/', (req, res) => {
    // Render the homepage
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    // Render the admin page
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});