const express = require('express');
const router = express.Router();
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const readline = require('readline');
const ejs = require('ejs');
const path = require('path');

const {getHighTides} = require('../jobs/getHighTides');
const startBuoyDownload = require('../jobs/downloadBuoyData');

/* GET users listing. */
router.get('/', function(req, res, next) {

  // get buoy number from querystring (from the swimReport view form)
  // validate numeric, fall back to default '44007'
  const buoy = (req.query && req.query.buoy && /^\d+$/.test(req.query.buoy))
    ? req.query.buoy
    : '44007';

  // ensure a downloader is started for the requested buoy and trigger an immediate fetch
  try {
    const dl = startBuoyDownload(buoy, 6); // schedules downloads and returns { downloadNow, task }
    if (dl && typeof dl.downloadNow === 'function') {
      dl.downloadNow().catch(err => console.error('Manual buoy download failed:', err.message));
    }
  } catch (err) {
    console.error('Failed to start buoy download:', err.message);
  }

  // build data file path from buoy number
  const buoyDataPath = path.join(__dirname, '..', 'data', `${buoy}.txt`);
  
  // check if file exists; if not, handle gracefully
  if (!fs.existsSync(buoyDataPath)) {
    console.warn(`Buoy data file not yet available: ${buoyDataPath}`);
    // render page with default/empty data
    return res.render('swimReport', {
      title: 'Swim Report',
      buoy,
      waterTemp: 'N/A',
      airTemp: 'N/A',
      windSpd: 'N/A',
      windDir: 'N/A',
      buoyDateISO: '',
      buoyDateCompact: '',
      highTides: []
    });
  }

  const fileStream = fs.createReadStream(buoyDataPath);
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let i=0;
  let waterTemp;
  let windSpd;
  let airTemp;
  let windDir;

  rl.on('line', (line) => {
    const parsed = line.split(/\s+/); // Split each line by spaces
    //console.log(i++);
 
    if(i===0){
      console.log("Header: " +parsed);
    }
    if(i===1){
     console.log("Header 2: " +parsed);
    }
    if(i===2){
      console.log("Latest: " +parsed);
      console.log("Water Temp: " +parsed[14]);
      waterTemp = parsed[14]*9/5 + 32;
      airTemp = parsed[13]*9/5 + 32;
      windSpd = parsed[6];
      windDir = parsed[5];

      // helper to pad month/day
      const pad = n => n.toString().padStart(2, '0');

      // create date variables from the 3rd line (parsed[0]=YYYY, parsed[1]=MM, parsed[2]=DD)
      const buoyDateISO = `${parsed[0]}-${pad(parsed[1])}-${pad(parsed[2])}`; // e.g. 2025-11-06
      const buoyDateCompact = `${parsed[0]}${pad(parsed[1])}${pad(parsed[2])}`; // e.g. 20251106

      const data = {
        waterTemp: Math.round(waterTemp*10)/10,
        airTemp: Math.round(airTemp*10)/10,
        windSpd: windSpd,
        windDir: windDir,
        buoyDateISO,       // add to template data if desired
        buoyDateCompact
      };
  
      data.title="Swim Report";

      // Read highTides.json and attach to template data
      try {
        const highTidesPath = path.join(__dirname, '..', 'data', 'highTides.json');
        const htRaw = fs.readFileSync(highTidesPath, 'utf8');
        const highTides = JSON.parse(htRaw);
        data.highTides = highTides;
      } catch (err) {
        console.error('Could not read highTides.json:', err.message);
        data.highTides = []; // fallback
      }

      rl.close(); // stop reading further lines
      // ensure underlying file stream is closed so downloader can replace the file on Windows
      if (fileStream && typeof fileStream.close === 'function') {
        try { fileStream.close(); } catch (e) {}
      }
      if (fileStream && typeof fileStream.destroy === 'function') {
        try { fileStream.destroy(); } catch (e) {}
      }
      console.log('Rendering swimReport with data:', data);
      res.render('swimReport',data);
    
  
    }
    i++;
});

});

module.exports = router;
