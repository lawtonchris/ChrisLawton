const http = require('http')
const fs = require('fs')
const express = require("express");

const app = express();


module.exports = app;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  fs.createReadStream('views/index.html').pipe(res)
})

//server.listen(process.env.PORT || 3000)