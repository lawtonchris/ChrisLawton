const express = require('express');
const router = express.Router();
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const readline = require('readline');
const ejs = require('ejs');
const path = require('path');

/* GET users listing. */
router.get('/', function(req, res, next) {

// RSS https://www.ndbc.noaa.gov/data/latest_obs/44007.rss
//https://www.ndbc.noaa.gov/data/realtime2/44007.txt

const templatePath = './views/swimReport.ejs';
const outputPath = './swimReport.html';
const fileStream = fs.createReadStream('44007.txt');
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
  ejs.renderFile(templatePath, data, (err, str) => {
    if (err) {
      console.error('Error rendering the template:', err);
      return;
    }

  
  // Write the rendered HTML to a file
  fs.writeFile(outputPath, str, 'utf8', (err) => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {
      console.log('HTML file generated successfully!');
    }
  });
  
  });

  }
  i++;
});

});

module.exports = router;
