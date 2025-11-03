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

const fileStream = fs.createReadStream('./data/44007.txt');
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
  }
  if(i===2){
    console.log("Water Temp: " +parsed[14]);
    waterTemp = parsed[14]*9/5 + 32;
    airTemp = parsed[13]*9/5 + 32;
    windSpd = parsed[6];
    windDir = parsed[5];
    const data = {
      waterTemp: Math.round(waterTemp*10)/10,
      airTemp: Math.round(airTemp*10)/10,
      windSpd: windSpd,
      windDir: windDir
    };
  
    data.title="Swim Report";


    res.render('swimReport',data);
    
  
  }
  i++;
});

});

module.exports = router;
