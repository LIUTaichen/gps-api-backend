let request = require('request');
var FileCookieStore = require('tough-cookie-filestore');
var fs = require("fs");
var cookiepath = "cookies.json";
var jar = request.jar(new FileCookieStore(cookiepath));
request = request.defaults({ jar : jar });

exports.fetchHistory = (vehicleId) =>{
    
    return new Promise(function(resolve, reject) {
        request.post('https://portal.fleetagent.co.nz/Map/AssetHistory/GetVehicleHistory?vehicleId='+vehicleId +'&startDate=&endDate=', 
        function(error, response, body){
            
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
                console.log("returned body is false when fetching vehicle history");
                reject(Error(response.statusText));
            }else{
                console.log("vehicles history fetched");
                console.log(body.length)
                resolve(body);
            }
        });     
      });
}

exports.getPosition = (vehicleId, date) => {
    let dateObject = new Date(date);
    let startDate = new Date(date);
    startDate.setHours(startDate.getHours() -12);
    let endDate = new Date(date);
    endDate.setHours(dateObject.getHours() + 12);
    console.log('input date to ISO', dateObject.toISOString());
    console.log('start date', startDate);
    console.log('end date', endDate);
    return new Promise(function(resolve, reject){
        request.post('https://portal.fleetagent.co.nz/Map/AssetHistory/GetVehicleHistory?vehicleId='+vehicleId, 
            {
                form:{
                    startDate: startDate,
                    endDate:  endDate,
                }
            }, 
            function(error, response, body){
                //fs.writeFile('trips.json',body );
                
                let trips = JSON.parse(body);
                console.log(trips['tripHistory'].length + " trips returned");
                //fs.writeFile('trips.json',body );
                if(trips['tripHistory'].length){
                    resolve(trips);
                }else{
                    resolve(new Promise(function(resolve, reject){
                        console.log("fetching all records");
                        request.post('https://portal.fleetagent.co.nz/Map/AssetHistory/GetVehicleHistory?vehicleId='+vehicleId, 
                        {
                            form:{
                                startDate: new Date(0),
                                endDate:  endDate,
                            }
                        }, 
                        function(error, response, newbody){
                            let alltrips = JSON.parse(newbody);
                            //console.log(response);
                           
                            console.log(alltrips['tripHistory'].length + " all trips returned");
                            resolve(alltrips);
                        });
                    }));
                }
                        
            }
        );
    }).then(trips =>{
        
        console.log('object ' + dateObject);
        
        
        let result;
       
        if(trips['historyType'] === 'assetbased'){
            console.log('handling oyester');
            return getPositionOfOyster(trips, dateObject);
        }
        console.log('handling gps tracker');
        return getPositionOfGPSTracker(trips, dateObject);
       
        console.log("end of execution");
        return{
            status: 'Unable to find position'
        }
    });
}
function getPositionOfOyster(trips, dateObject){
    let nextEventTimestamp;
    let nextEvent; 
    for(let i = 0; i < trips['tripHistory'].length; i++){
        let trip = trips['tripHistory'][i];
        let timestamp = new Date(Number(trip['DeviceTimeStamp'].substring(6,19)));
        if(timestamp < dateObject){
            console.log("query time", dateObject);
            console.log("found ping before query time", timestamp);
            if(dateObject - timestamp <  nextEventTimestamp - dateObject){
                console.log("next ping is closer", nextEventTimestamp);
                timestamp = nextEventTimestamp;
            }
            return {
                lat: trip['Latitude'],
                lng: trip['Longitude'],
                status: trip['TripStatus'],
                info: 'Address: ' + trip['Address'],
                isTravelling: false,
                timestamp: timestamp
            }
        }else{
            nextEventTimestamp = timestamp;
            nextEvent = trip;
        }

    }
}
function getPositionOfGPSTracker(trips, dateObject){
    for(let i = 0; i < trips['tripHistory'].length; i++){

            

        let trip = trips['tripHistory'][i];

       
        //console.log(trip['StoppedTrip']['StartTime'].substring(6,19));
        //console.log(new Date(Number(trip['StoppedTrip']['StartTime'].substring(6,19))));
        if(trip['StoppedTrip']){
            let stoppedTripStartTime = new Date(Number(trip['StoppedTrip']['StartTime'].substring(6,19)));
            let stoppedTripEndTime = new Date(Number(trip['StoppedTrip']['EndTime'].substring(6,19)));

            if(stoppedTripStartTime <= dateObject && dateObject <= stoppedTripEndTime){
                console.log('Vehile is stopped at the time');
                console.log('returning point ', JSON.stringify(trip['StoppedTrip']));
                console.log('returning point ' + JSON.stringify(trip['StoppedTrip']['StoppedPoint']));
                return {
                    lat: trip['StoppedTrip']['StoppedPoint']['Lat'],
                    lng: trip['StoppedTrip']['StoppedPoint']['Long'],
                    speed: 0,
                    status: 'Stopped',
                    info: 'Duration '+ trip['StoppedTrip']['Duration'],
                    isTravelling: false,
                    stopStartTime: stoppedTripStartTime,
                    stopEndTime: stoppedTripEndTime
                };
            }

        }
      
        if(trip['TravelledTrip']){
            let travelledTripStartTime = new Date(Number(trip['TravelledTrip']['Summary']['StartTime'].substring(6,19)));
            let travelledTripEndTime = new Date(Number(trip['TravelledTrip']['Summary']['EndTime'].substring(6,19)));

            if(travelledTripStartTime <= dateObject && dateObject <= travelledTripEndTime){
                //console.log('Vehile is moving at the time');
                console.log("found trip");
                console.log(trip['Id']);
                let tripId =  trip['Id'];
                return new Promise(function(resolve, reject){
                    console.log('fetching travelling info with tripId ' + tripId);
                    request.post('https://portal.fleetagent.co.nz/Map/AssetHistory/GetTripWaypoints?tripId='+tripId +'&_=1520541903144', 
                    function(error, response, body){
                        //fs.writeFile('waypoints.json', body);
                        resolve(JSON.parse(body));
                    });
                }).then(trip => {
                    let latlng;
                    let tripData = trip['routeInformation'];
                    let previousEvent;
                    for(var i = 0; i<tripData.length; i++){
                        var event = tripData[i];
                        let eventTime = new Date(Number(event['DateRecorded'].substring(6,19)));

                        if(eventTime <= dateObject){
                            previousEvent = event;
                        }
                        if(eventTime > dateObject){
                            let previousEventTime = new Date(Number(previousEvent['DateRecorded'].substring(6,19)));
                            console.log("data found");
                            if(eventTime - dateObject > dateObject - previousEventTime){
                                console.log('timestamp for last event ', previousEventTime );
                                console.log('input time is closer to the previous event');
                                console.log('returning previous point', previousEvent);
                                return {
                                    lat: previousEvent.Lat,
                                    lng: previousEvent.Lon,
                                    speed: previousEvent.Speed,
                                    status: previousEvent.TripStatus,
                                    info: previousEvent.TripInfo,
                                    timestamp: previousEventTime,
                                    isTravelling: true
                                };
                            }else{
                                console.log("next event is at", eventTime);
                                console.log('input time is closer to the next event');
                                console.log('returning next point', event);
                                return {
                                    lat: event.Lat,
                                    lng: event.Lon,
                                    speed: event.Speed,
                                    status: event.TripStatus,
                                    info: event.TripInfo,
                                    timestamp: eventTime,
                                    isTravelling: true
                                };
                            }
                        }
                    }
                });
            };

        }
       
        // console.log(trip['StoppedTrip']['StartTime']);
        // console.log(trip['StoppedTrip']['EndTime']);
        // console.log(trip['TravelledTrip']['Summary']['StartTime']);
         //console.log(trip['TravelledTrip']['Summary']['EndTime']);
        //  console.log('stoppedTripStartTime  ', stoppedTripStartTime);
        //  console.log('stoppedTripEndTime  ', stoppedTripEndTime);
        //  console.log('travelledTripStartTime  ', travelledTripStartTime);
        //  console.log('travelledTripEndTime  ', travelledTripEndTime);
        // console.log(stoppedTripStartTime +' is before : ' + (stoppedTripStartTime <= dateObject) + "  " + dateObject);
        // console.log(stoppedTripEndTime + ' is after : ' + (dateObject <= stoppedTripEndTime) + "  " + dateObject);
        // console.log(travelledTripStartTime + 'is before : ' + (travelledTripStartTime <= dateObject) + "  " + dateObject);
        // console.log(travelledTripEndTime + 'is after : ' + (dateObject <= travelledTripEndTime) + "  " + dateObject);
    };
}