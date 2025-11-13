const express = require('express');
const router = express.Router();
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const readline = require('readline');
const ejs = require('ejs');
const path = require('path');

const {getHighTides} = require('../jobs/getHighTides');

/* GET users listing. */
router.get('/', function(req, res, next) {

// RSS https://www.ndbc.noaa.gov/data/latest_obs/44007.rss
//https://www.ndbc.noaa.gov/data/realtime2/44007.txt

//Tides example: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=web_services&begin_date=20251001&end_date=20251002&datum=MLLW&station=8443970&time_zone=lst_ldt&units=english&interval=hilo&format=json

  // get buoy number from querystring (from the swimReport view form)
  // validate numeric, fall back to default '44007'
  const buoy = (req.query && req.query.buoy && /^\d+$/.test(req.query.buoy))
    ? req.query.buoy
    : '44007';

  // build data file path from buoy number
  const buoyDataPath = path.join(__dirname, '..', 'data', `${buoy}.txt`);
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
    console.log('Rendering swimReport with data:', data);
    res.render('swimReport',data);
    
  
  }
  i++;
});

});

module.exports = router;
