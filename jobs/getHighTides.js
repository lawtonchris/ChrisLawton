const axios = require('axios');
 const fs = require("fs");
// NOAA station ID for Boston, MA (you can change this)
const stationId = '8443970';

// Date range in YYYYMMDD format
//const beginDate = '20251105';
//const endDate = '20251105';

// Date range in YYYYMMDD format (use today's date)
const pad = n => n.toString().padStart(2, '0');
const today = new Date();
const yyyy = today.getFullYear();
const mm = pad(today.getMonth() + 1);
const dd = pad(today.getDate());
const beginDate = `${yyyy}${mm}${dd}`;
const endDate = beginDate;

// NOAA API URL
const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`;

async function getHighTides() {
  try {
    const response = await axios.get(url, {
      params: {
        product: 'predictions',
        application: 'web_services',
        begin_date: beginDate,
        end_date: endDate,
        datum: 'MLLW',
        station: stationId,
        time_zone: 'lst_ldt',
        units: 'english',
        interval: 'hilo',
        format: 'json'
      }
    });

    const predictions = response.data.predictions;

    const highTides = predictions.filter(p => p.type === 'H');

const jsonData = JSON.stringify(highTides, null, 2);

fs.writeFile("./data/highTides.json", jsonData, 'utf8', (err) => {
    if (err) {
        console.error('Error writing to file', err);
    } else {
        console.log('Data written to file');
    }
});

    console.log(`High tide times for station ${stationId}:`);
    highTides.forEach(tide => {
      console.log(`- ${tide.t} → ${tide.v} ft`);
    });
  } catch (error) {
    console.error('Error fetching tide data:', error.message);
  }
}


//getHighTides();
module.exports = getHighTides;