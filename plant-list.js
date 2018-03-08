let request = require('request');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
let privatekey = require("./client_secret.json");

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN_PATH =  'client_secret.json';

var CLIENT_ID = '676408930964-2pvbodm5bmn2ehdq54ilsg6r10lvukb7.apps.googleusercontent.com';
//var CLIENT_ID ='676408930964-1lkbkp4ri2k3p3shv1daa71b7rvbvh6m.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDYeRC_Z2a9UrBLHaQ6yfgUilQZukYiYrA';
//var API_KEY = '1ZfA3O9hBD9jN2_uOF1cD01G';


exports.getPlants =  () => {
    return new Promise(function(resolve, reject){
        let jwtClient = new google.auth.JWT(
            privatekey.client_email,
            null,
            privatekey.private_key,
            SCOPES);
        jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            console.log("Successfully connected!");
            resolve(readPlantSheet(jwtClient));
        }
        });
    }); 
}
function readPlantSheet(auth){
    return new Promise(function(resolve, reject){
        console.log("reading plants sheet");
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

exports.getProjects = () =>{
    return new Promise(function(resolve, reject){
        let jwtClient = new google.auth.JWT(
            privatekey.client_email,
            null,
            privatekey.private_key,
            SCOPES);
        jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            console.log("Successfully connected!");
            resolve(readProjectsSheet(jwtClient));
        }
        });
    }); 
}

function readProjectsSheet(auth){
    return new Promise(function(resolve, reject){
        console.log("reading projects sheet");
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: '16VdfZZNiHPtd9f6MkXjOhXMrvXtTBRZ2wazjracgYkw',
        range: 'Projects!A1:AN',
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