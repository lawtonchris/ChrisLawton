const express = require('express');
const fs = require('fs');
const https = require('https');
const cron = require('node-cron');
const path = require('path');

/**
 * Start downloading buoy data for a given buoy number.
 * @param {string|number} buoyNumber - NOAA buoy id (digits only)
 * @param {number} hours - interval in hours between scheduled downloads (default 6)
 * @returns {{downloadNow: function():Promise, task: object}} scheduled task and manual download function
 */
function startBuoyDownload(buoyNumber, hours = 6) {
  if (!buoyNumber) throw new Error('buoyNumber is required');
  buoyNumber = String(buoyNumber).trim();
  if (!/^\d+$/.test(buoyNumber)) throw new Error('buoyNumber must be numeric');

  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const destination = path.join(dataDir, `${buoyNumber}.txt`);
  const tmpDestination = destination + '.tmp';
  const fileUrl = `https://www.ndbc.noaa.gov/data/realtime2/${buoyNumber}.txt`;

  function downloadFile() {
    return new Promise((resolve, reject) => {
      const req = https.get(fileUrl, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} while fetching ${fileUrl}`));
        }

        const fileStream = fs.createWriteStream(tmpDestination);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            const tryRename = (attemptsLeft = 5, delayMs = 200) => {
              fs.rename(tmpDestination, destination, (err) => {
                if (!err) {
                  console.log(`Buoy ${buoyNumber} data saved to ${destination}`);
                  return resolve(destination);
                }
                if (err.code === 'EPERM' && attemptsLeft > 0) {
                  // likely file locked by reader or OneDrive — retry after delay
                  setTimeout(() => tryRename(attemptsLeft - 1, delayMs * 2), delayMs);
                  return;
                }
                // other errors or retries exhausted
                return reject(err);
              });
            };
            tryRename();
          });
        });

        fileStream.on('error', (err) => {
          fileStream.close(() => {
            fs.unlink(tmpDestination, () => {});
            reject(err);
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      // safety timeout (optional)
      req.setTimeout(30_000, () => {
        req.abort();
        reject(new Error('Request timed out'));
      });
    });
  }

  // Download once immediately
  downloadFile().catch(err => console.error('Initial buoy download failed:', err.message));

  // Schedule repeated downloads every N hours (runs at second=0 minute=0)
  const scheduleExpr = `0 0 */${Math.max(1, Math.floor(hours))} * * *`;
  const task = cron.schedule(scheduleExpr, () => {
    console.log(`Scheduled download for buoy ${buoyNumber} starting...`);
    downloadFile().catch(err => console.error('Scheduled buoy download failed:', err.message));
  }, {
    scheduled: true
  });

  console.log(`Buoy data file download scheduled for buoy ${buoyNumber} every ${hours} hour(s).`);

  return { downloadNow: downloadFile, task };
}

module.exports = startBuoyDownload;
