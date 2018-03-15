const restify = require('restify');
const restifyPlugins = require('restify-plugins');
let request = require('request');
var FileCookieStore = require('tough-cookie-filestore');
var fs = require("fs");
var cookiepath = "cookies.json";
var responsePath = 'response.html';
var bodyPath = 'body.html';
const cheerio = require('cheerio');
const vehiclesAPI = require('./vehicles');
const historyAPI = require('./history');
const tripAPI = require('./trip');
const passport = require('passport')
, BearerStrategy = require('passport-azure-ad').BearerStrategy
, config = require('./config')
, authenticatedUserTokens = []
,serverPort = config.serverPort;
require('dotenv').config()

const authenticationStrategy = new BearerStrategy(config.credentials, (token, done) => {
    let currentUser = null;

    let userToken = authenticatedUserTokens.find((user) => {
        currentUser = user;
        user.sub === token.sub;
    });

    if(!userToken) {
        authenticatedUserTokens.push(token);
    }

    return done(null, currentUser, token);
});

passport.use(authenticationStrategy);


if(!fs.existsSync(cookiepath)){
    fs.closeSync(fs.openSync(cookiepath, 'w'));
}

if(!fs.existsSync(responsePath)){
    fs.closeSync(fs.openSync(responsePath, 'w'));
}

if(!fs.existsSync(bodyPath)){
    fs.closeSync(fs.openSync(bodyPath, 'w'));
}
var jar = request.jar(new FileCookieStore(cookiepath));
request = request.defaults({ jar : jar });

var rootUrl = 'https://portal.fleetagent.co.nz';
var cookie;
var formAction = '/Login?ReturnUrl=https://portal.fleetagent.co.nz';
var formToken;
let $ = null;;
let timestamp;
let vehicles;
var fleetAgentUsername = process.env.FLEETAGENT_USERNAME;
var fleetAgentPassword = process.env.FLEETAGENT_PASSWORD;

const server = restify.createServer({ name: 'Azure Active Directroy with Node.js Demo' });
server.use(restifyPlugins.authorizationParser());
server.use(passport.initialize());
server.use(passport.session());
server.use(restifyPlugins.queryParser());

server.get('/trip', function(req, res){
    console.log('/trip');
    console.log('fetching trip with tripId :' +  req.query.tripId);
    let tripId = req.query.tripId;
    tripAPI.fetchTrip(tripId)
        .then(response => {
            res.send(response);
        });


});

server.get('/position', function(req, res){
    console.log('/position');
    console.log('getting position for vehicle  :' +  req.query.vehicleId +" at : " + req.query.date);
    let vehicleId = req.query.vehicleId;
    let date = req.query.date;
    console.log(date);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if(vehicleId && date){historyAPI.getPosition(vehicleId, date)
        .then(response => {
            console.log("sending response");
            console.log(response);
            res.send(response);
        });
    }else{
        res.status(400);
        res.send('vehicleId and date are both required');
    }
    
});


server.get('/history', function(req, res){
    console.log('/history');
    console.log('fetching history for vehicle :' +  req.query.vehicleId);
    let vehicleId = req.query.vehicleId;
    historyAPI.fetchVehicles(vehicleId)
        .then(response => {
            res.send(response);
        });


});

server.get('/plants', function(req, res) {
    console.log("/plants");
    const plantsAPI = require('./plant-list');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    let plantsPromise = plantsAPI.getPlants();
    plantsPromise.then(response =>{
        res.send(response);
    })
   
})


server.get('/projects', function(req, res) {
    console.log("/projects");
    const plantsAPI = require('./plant-list');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    let projectsPromise = plantsAPI.getProjects();
    projectsPromise.then(response =>{
        res.send(response);
    })
   
})

server.get('/', function(req, res) {
    test();
  res.send('default.htm');
})
// respond with "hello world" when a GET request is made to the homepage
server.get('/track', function (req, res) {
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
                UserName : fleetAgentUsername,
                Password : fleetAgentPassword,
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

server.get('/new', function(req, res){
    vehiclesAPI
    .fetchVehicles()
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
            return vehiclesAPI.fetchVehicles();
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
                UserName : fleetAgentUsername,
                Password : fleetAgentPassword,
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
                console.log(response.headers);
                fs.writeFile(responsePath, response);
                fs.writeFile(bodyPath, body);
                resolve(response);
            }
      });
    });
}


server.listen(serverPort, console.log('listening on ' + serverPort));

