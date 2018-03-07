let request = require('request');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
let privatekey = require("./client_secret.json");

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH =  'client_secret.json';

var CLIENT_ID = '676408930964-2pvbodm5bmn2ehdq54ilsg6r10lvukb7.apps.googleusercontent.com';
//var CLIENT_ID ='676408930964-1lkbkp4ri2k3p3shv1daa71b7rvbvh6m.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDYeRC_Z2a9UrBLHaQ6yfgUilQZukYiYrA';
//var API_KEY = '1ZfA3O9hBD9jN2_uOF1cD01G';

// Load client secrets from a local file.


// exports.getPlants = async () => {
//     console.log("getting plants from google sheet");
//     fs.readFile('client_secret.json', function processClientSecrets(err, content) {
//         if (err) {
//           console.log('Error loading client secret file: ' + err);
//           return;
//         }
//         // Authorize a client with the loaded credentials, then call the
//         // Google Sheets API.
//         console.log("before authorizing");
//         return authorize(JSON.parse(content), readSheet);
//       });
// }
exports.getPlants =  () => {
    return new Promise(function(resolve, reject){
        let jwtClient = new google.auth.JWT(
            privatekey.client_email,
            null,
            privatekey.private_key,
            ['https://www.googleapis.com/auth/spreadsheets'
             ]);
        jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            console.log("Successfully connected!");
            resolve(readSheet(jwtClient));
        }
        });
    }); 
}
function readSheet(auth){
    return new Promise(function(resolve, reject){
        console.log("reading sheet");
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: '16VdfZZNiHPtd9f6MkXjOhXMrvXtTBRZ2wazjracgYkw',
        range: 'Plants!A1:AQ',
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          reject(err);
        }
        console.log(response.data.values.length);
        var rows = response.data.values;
        resolve(rows) ;
      });
    });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    console.log("authorize");
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        return getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        return callback(oauth2Client);
      }
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }
  
  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }
  