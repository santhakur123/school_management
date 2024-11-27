const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const geolib = require('geolib');

dotenv.config();

const app = express();
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Add School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error adding school' });
        }
        res.status(201).json({ message: 'School added successfully', id: result.insertId });
    });
});

// // List Schools API (Sorted by proximity)
// app.get('/listSchools', (req, res) => {
//     const { userLatitude, userLongitude } = req.query;

//     if (!userLatitude || !userLongitude) {
//         return res.status(400).json({ error: 'User latitude and longitude are required.' });
//     }

//     const query = 'SELECT * FROM schools';
//     db.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: 'Error fetching schools' });

//         }

//         const schoolsWithDistance = results.map(school => {
//             const distance = geolib.getDistance(
//                 { latitude: userLatitude, longitude: userLongitude },
//                 { latitude: school.latitude, longitude: school.longitude }
//             );
//             return { ...school, distance };
//         });

//         schoolsWithDistance.sort((a, b) => a.distance - b.distance);

//         res.status(200).json(schoolsWithDistance);
//     });
// });
// List Schools API (Sorted by proximity)
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validate if userLatitude and userLongitude are provided
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'User latitude and longitude are required.' });
    }

    // Convert latitude and longitude to numbers
     const userLatitude = parseFloat(latitude);
   const  userLongitude = parseFloat(longitude);

    if (isNaN(userLatitude) || isNaN(userLongitude)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude values.' });
    }

    const query = 'SELECT * FROM schools';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching schools' });
        }

        // Map schools with distance
        const schoolsWithDistance = results.map(school => {
            console.log('User Latitude:', userLatitude, 'User Longitude:', userLongitude);

            const distance = geolib.getDistance(
                { latitude: userLatitude, longitude: userLongitude },
                { latitude: school.latitude, longitude: school.longitude }
            );
            return { ...school, distance };
        });

        // Sort by distance (ascending)
        schoolsWithDistance.sort((a, b) => a.distance - b.distance);

        // Send response
        res.status(200).json(schoolsWithDistance);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
