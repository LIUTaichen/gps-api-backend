var express = require('express')
var app = express()
let request = require('request');
request = request.defaults({jar: true});
const cheerio = require('cheerio');
require('dotenv').config()

var rootUrl = 'https://portal.fleetagent.co.nz';
var cookie;
var formAction = '/Login?ReturnUrl=https://portal.fleetagent.co.nz';
var formToken;
let $ = null;;
let timestamp;
let vehicles;
function test(){
    console.log('test test test');
    console.log(vehicles);
    vehicles = '123';
}



app.get('/', function(req, res) {
    test();
  res.send('default.htm');
})
// respond with "hello world" when a GET request is made to the homepage
app.get('/track', function (req, res) {
    console.log(vehicles);
    request(rootUrl, function(error,response, body){
        var newCookie = response.headers['set-cookie'];
        $ = cheerio.load(body);
        formAction = $('form').attr('action');
        formToken=$('form input').attr('name', '__RequestVerificationToken').val();
        request.post({
            url:rootUrl+formAction,
            form:{
                __RequestVerificationToken : formToken,
                CompanyId: 2971,
                ReturnUrl:'http://portal.fleetagent.co.nz',
                UserName : process.env.userName,
                Password : process.env.password,
                'Config.Company.Name': 'Online Portal',
                'Config.Company.LoginImageLink':'img/500/300/2193B2F0-40C1-4873-9812-B9337C7CE34D/image.svg',
                'Config.Company.SecondaryColour':'#0db14b',
                'Config.Company.FooterContent':'&copy; 2016 - FleetAgent',
                'EnableAutoLogin':'True',
                'ApplicationId':'279EEA55-9497-4DC5-887E-EF61DA455E56',
                'Config.Company.UseWhiteForLoginPage':'False',
                'AllowSignup':'True',
                'ShowTerms':'True',
                RememberMe:false
    
            }
        }, function(error, response, body){
            //console.log(response.headers);
           // console.log("body :: " + body);
           request.get('https://portal.fleetagent.co.nz/Vehicle/SearchVehicles?search=&groupId=&_=1519088446852', function(error, response, body){
                console.log(error);
                //console.log(body);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Credentials', true);
                res.send(body);
            });
        } )
    })
});

app.get('/new', function(req, res){
    fetchVehicles()
    .then(function(body){
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.send(body);
    }, function(error){
        console.log("on error, getting login form token");
        getLoginFormToken()
        .then(function(newToken){
            console.log("logging in with new form token");
            return login(newToken);
        })
        .then(function(){
            console.log("fetching vehicles after login");
            return fetchVehicles();
            }
        )
        .then(function(body){
            console.log("sending body");
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.send(body)
        })
        .catch(function(error){
            console.log("error in between");
            console.log(error);
        });
    });
})

function fetchVehicles(){
    
    return new Promise(function(resolve, reject) {
        request.get('https://portal.fleetagent.co.nz/Vehicle/SearchVehicles?search=&groupId=&_=1519088446852', function(error, response, body){
            
            console.log(response.statusCode);
            if(error){  
                console.log("there is error returned");
                console.log(error);
                reject(Error(response.statusText));
            }
            else if(response==='false'){
                console.log("response is false");
                reject(Error(response.statusText));
            }
            else if(response.statusCode !== 200){
                console.log("response status is not 200");
                console.log("response status is " + response.statusCode);
                reject(Error(response.statusText));
            }
            else if(body === 'false'){
                console.log("returned body is false when fetching vehicle");
                reject(Error(response.statusText));
            }else{
                console.log("vehicles fetched");
                console.log(body.length)
                resolve(body);
            }
        });     
      });
}

function getLoginFormToken(){
    return new Promise(function(resolve, reject) {
        request(rootUrl, function(error,response, body){
            if(error || response==='false' || response.statusCode !== 200){
                console.log("error when getting login form");
                console.log('body');
                console.log(body);
                console.log(error);
                console.log(response);
                console.log(body);
                console.log(response.statusCode);
                reject(Error(response.statusText));
            }else{
                console.log("resolving login form token");
                $ = cheerio.load(body);
                formToken=$('form input').attr('name', '__RequestVerificationToken').val();
                resolve(formToken);
            }
           
      });
    });
}

function login(token){
    return new Promise(function(resolve, reject) {
        request.post({
            url:rootUrl+formAction,
            form:{
                __RequestVerificationToken : token,
                CompanyId: 2971,
                ReturnUrl:'http://portal.fleetagent.co.nz',
                UserName : process.env.userName,
                Password : process.env.password,
                'Config.Company.Name': 'Online Portal',
                'Config.Company.LoginImageLink':'img/500/300/2193B2F0-40C1-4873-9812-B9337C7CE34D/image.svg',
                'Config.Company.SecondaryColour':'#0db14b',
                'Config.Company.FooterContent':'&copy; 2016 - FleetAgent',
                'EnableAutoLogin':'True',
                'ApplicationId':'279EEA55-9497-4DC5-887E-EF61DA455E56',
                'Config.Company.UseWhiteForLoginPage':'False',
                'AllowSignup':'True',
                'ShowTerms':'True',
                RememberMe:false
    
            }
        }, function(error,response, body){
            if(error || body==='false'){
                console.log("error when logging in");
                console.log(body);
                //console.log(response);
                console.log(error);
                reject(Error(response.statusText));
            }else{
                console.log("login success!");
                resolve(response);
            }
      });
    });
}

app.listen(3001, () => console.log('Example app listening on port 3001!'))



