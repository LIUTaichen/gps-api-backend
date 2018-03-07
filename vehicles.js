let request = require('request');
var FileCookieStore = require('tough-cookie-filestore');
var fs = require("fs");
var cookiepath = "cookies.json";
var jar = request.jar(new FileCookieStore(cookiepath));
request = request.defaults({ jar : jar });
exports.fetchVehicles = () =>{
    
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