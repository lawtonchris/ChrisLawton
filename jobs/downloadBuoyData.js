const express = require('express');
const fs = require('fs');
const https = require('https');
const cron = require('node-cron');

//const app = express();
//const PORT = 3000;

function downloadBuoyFile(){
// Function to download a file
const downloadFile = (url, destination) => {
  const file = fs.createWriteStream(destination);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('File downloaded successfully!');
    });
  }).on('error', (err) => {
    fs.unlink(destination, () => {}); // Delete the file if an error occurs
    console.error('Error downloading file:', err.message);
  });
};

// Schedule the file download at regular intervals (every 6 hours)
cron.schedule('0 * */6 * * *', () => { 
  console.log('Starting file download...');
  const fileUrl = 'https://www.ndbc.noaa.gov/data/realtime2/44007.txt'; // Replace with your file URL
  const destination = './44007.txt'; // Replace with your desired file path
  downloadFile(fileUrl, destination);
});

console.log("Buoy data file download cron job is scheduled.")
}

module.exports = downloadBuoyFile;

/*
// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
*/