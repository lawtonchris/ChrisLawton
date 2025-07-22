const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const readline = require('readline');
const ejs = require('ejs');
const express = require('express');
const path = require('path');
const app = express();
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

  /*
  // Write the rendered HTML to a file
  fs.writeFile(outputPath, str, 'utf8', (err) => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {
      console.log('HTML file generated successfully!');
    }
  });
  */
});

}
i++;
});

app.get('/swimReport', (req, res) => {

    // The render method takes the name of the HTML
    // page to be rendered as input.
    // This page should be in views folder in
    // the root directory.
    // We can pass multiple properties and values
    // as an object, here we are passing the only name
    res.sendFile(path.join(__dirname,'./swimReport.html'));
});

app.get('/', (req, res) => {

    // The render method takes the name of the HTML
    // page to be rendered as input.
    // This page should be in views folder in
    // the root directory.
    // We can pass multiple properties and values
    // as an object, here we are passing the only name
    res.sendFile(path.join(__dirname,'./index.html'));
});

const server = app.listen(4000, function () {
    console.log('listening to port 4000')
});





//axios.get('https://www.ndbc.noaa.gov/data/latest_obs/44007.rss')


if(false){
axios({method:'get',url:'https://www.ndbc.noaa.gov/data/realtime2/44007.txt',responseType:'stream'})
//axios.get('https://surftruths.com/api/buoys/44007/readings/current')
  .then(response => {
  //  console.log('Raw:',response.data);
    const parsed = response.data.split(/\s+/);  //delimited by one or more spaces
//console.log(parsed);
    //const parser = new XMLParser(); XML
    //const result = parser.parse(response.data); XML

//console.log('Parsed XML:', result.rss.channel.item).DESCRIPTION;
  })
  .catch(error => {
    console.error('Error:', error.message);
  });


axios({method:'get',url:'https://www.ndbc.noaa.gov/data/realtime2/44007.txt',responseType:'stream'})
//axios.get('https://surftruths.com/api/buoys/44007/readings/current')
  .then(response => {
//const fileStream = fs.createReadStream('44007.txt');
const rl = readline.createInterface({
  input: response.data,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const parsed = line.split(/\s+/); // Split each line by spaces
  console.log(parsed[0][0]);
});

  });
}
