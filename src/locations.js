function PointNG(config) {
    
    this.config = config
    this.level = config.level
    this.api_key = config.api_key
    this.widgetPosition = config.widgetPosition
}

PointNG.prototype = (function(){
    
    var baseurl = "https://cdn.pointng.io/networks/"

   var ERROR_TYPE_CODES = [
       'Unknown error',
       'Permission denied by user',
       'Position is not available',
       'Request timed out'
   ];

   var predictionData = {
      continent: null,
       sub_region: null,
       country: null,
       country_id: 0,
       capital: null,
       currency: null,
       phone_code: null,
       iso2: null,
       iso3: null,
       state: null,
       state_id: null,
       state_code: null,
       city: null,
       city_id: null,
       latitude: 0,
       longitude: 0,
       ready: null
   }
   var id = 'pointng_script'
   var currentLevel;
   var currentKey;
   var currentWidgetPosition;
   function getLocation(level) {
       if(level) {
        currentLevel=level
       } else {
        currentLevel = this.config.level;
       }
        
        currentKey = this.config.api_key;
        var locationPromise = new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(
    
                async function resolveLocation(position) {
    
                    var prediction = await getCurrentLocation(position.coords.latitude, position.coords.longitude)
    
                    resolve(prediction);
    
                },
    
                function resolveError(error) {
                    var errorMessage = ERROR_TYPE_CODES[error.code];
    
                    if (error.code === 0 || error.code === 2) {
                        errorMessage += ' ' + error.message;
                    }
                resolve(predictionData)
    
            });
    
        });
        locationPromise.catch((error) => {
        return predictionData
    });
        return locationPromise
    
    };
 
   async function getCurrentLocation (lat, lon) {
    
        return new Promise(function(resolve, reject) {  
            // var predictedSubRegion = getSubRegion(lat, lon, resolve, reject, loadDynamicScript)   
            var predictedSubRegion = loadDynamicScript(lat, lon, id,baseurl + 'sub_region.js?api_key=' + currentKey, resolve, reject, getSubRegion)           
        })
        
    }

    function latLonLocate (lat, lon) {
        currentLevel = this.config.level;
        currentKey = this.config.api_key;
        return new Promise(function(resolve, reject) {  
            var predictedSubRegion = loadDynamicScript(lat, lon, id,baseurl + 'sub_region.js?api_key=' + currentKey, resolve, reject, getSubRegion)            
        })
        
    }

async function loadDynamicScript (lat, lon, id, url, resolve, reject, callback, level) {
    if (level) {
        currentLevel = level
    }
    const script = document.createElement('script');
    script.src = url;
    // script.async = false
    script.id = id;
    document.body.appendChild(script);
    
    script.onload = async function () {
        if (callback) await callback(lat, lon, resolve, reject, loadDynamicScript);
    };

};
function getSubRegion(lat, lon, resolve, reject, cb) {

    var dataSub = netJsonSub.sub_region
    var jsonNet = dataSub
    var net = new brain.NeuralNetwork();
    net.fromJSON(jsonNet);
    net.toFunction();
    var result = maxKey(net.run(generateInputData(lat, lon, 5)))
    predictionData.continent = result.split('&')[0];
    predictionData.sub_region = result.split('&')[1].replace(/_/g," ");
    console.log(currentLevel)
    if (currentLevel == 'continent' || !currentLevel || currentLevel == null || currentLevel == undefined || currentLevel == false || currentLevel == '') {
        predictionData.ready = true
        resolve(predictionData)
    } else if (currentLevel == 'country' || currentLevel == 'state' || currentLevel == 'city') {

        cb(lat, lon, id,baseurl + 'iso2/' + decodeURIComponent(predictionData.sub_region).replace(/ /g,"_").toLowerCase() + '_iso2.js?api_key=' + currentKey, resolve, reject, getCountry)
    }
     else
    {    
        reject(new Error("Unable to return location information due to invalid level-configuration."))
    }
}

function getCountry(lat, lon, resolve, reject, cb) {
 
    if (!netJson) {
        reject(new Error("Unable to return location information. Make sure you provided a valid API key."))
    } else {
        var data = netJson[`${predictionData.sub_region.replace(/ /g,"_").toLowerCase()+'_iso2'}`]
        var jsonNet = data
        var net = new brain.NeuralNetwork();
        net.fromJSON(jsonNet);
        net.toFunction();
        var result = maxKey(net.run(generateInputData(lat, lon, 5)))
        predictionData.country = result.split('&')[0].replace(/_/g," ")
        predictionData.iso2 = result.split('&')[1];
        predictionData.iso3 = result.split('&')[2];
        predictionData.phone_code = result.split('&')[3]
        predictionData.capital = result.split('&')[4]
        predictionData.currency = result.split('&')[5]

        if (currentLevel == 'country') {
            predictionData.ready = true
            resolve(predictionData)
        } else if (currentLevel == 'state' || currentLevel == 'city') {
            cb(lat, lon, id,baseurl + 'state/' + decodeURIComponent(predictionData.iso2).replace(/ /g,"_").toLowerCase() + '_state.js?api_key=' + currentKey, resolve, reject, getState)
        }
         else
        {    
            reject(new Error("Unable to return location information due to invalid level-configuration."))
        }
      
    }     
}

function getState(lat, lon,resolve, reject, cb) {
    var data = netJson[`${predictionData.iso2.replace(/ /g,"_").toLowerCase()+'_state'}`]
    var jsonNet = data
    var net = new brain.NeuralNetwork();
    net.fromJSON(jsonNet);
    net.toFunction();
    var result = maxKey(net.run(generateInputData(lat, lon, 5)))
    predictionData.state = result.split('&')[0].replace(/_/g," ")
    if (currentLevel == 'state') {
        predictionData.ready = true
        resolve(predictionData)
    } else {
        cb(lat, lon, id,baseurl + 'city/' + predictionData.iso2.toLowerCase() + '_' + decodeURIComponent(predictionData.state).replace(/ /g,"_").toLowerCase() + '_city.js?api_key=' + currentKey,resolve, reject, getCity)
    }
}

function getCity(lat, lon, resolve, reject) {
    var data = netJson[`${predictionData.iso2.toLowerCase() + '_' + predictionData.state.replace(/ /g,"_").toLowerCase()+'_city'}`]
    var jsonNet = data
    var net = new brain.NeuralNetwork();
    net.fromJSON(jsonNet);
    net.toFunction();
    var result = maxKey(net.run(generateInputData(lat, lon, 5)))
    predictionData.city = result.split('&')[0].replace(/_/g," ")
    predictionData.latitude = parseFloat(result.split('&')[1])
    predictionData.longitude = parseFloat(result.split('&')[2])
    if (!predictionData.sub_region || !predictionData || !predictionData.city) {
        reject(new Error("Unable to return location information"))
    } else {
        predictionData.ready = true
        resolve(predictionData)
    }
    
}

function generateInputData (lat, lon, precision) {

   var inputData = {}
   var hash = geohash(lat, lon, precision)
   
   var first = hash.charAt(0);
   var second = hash.charAt(1);
   var third = hash.charAt(2);
   var fourth = hash.charAt(3);
   var fifth = hash.charAt(4);
   var sixth = hash.charAt(5);

   inputData[`${'first_'.concat(first)}`] = 1
   inputData[`${'second_'.concat(second)}`] = 1
   inputData[`${'third_'.concat(third)}`] = 1
   inputData[`${'fourth_'.concat(fourth)}`] = 1
   inputData[`${'fifth_'.concat(fifth)}`] = 1
   inputData[`${'sixth_'.concat(sixth)}`] = 1

   return inputData
}

function maxKey(o) { 
   var sortable = [];
   for (var key in o) {
       sortable.push([key, o[key]]);
   }
   
   sortable.sort(function(a, b) {
       return b[1] - a[1];
   })

   return sortable[0][0]
}

function geohash (latitude, longitude, numberOfChars) {
   var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
   var BASE32_CODES_DICT = {};
   for (var i = 0; i < BASE32_CODES.length; i++) {
       BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
   }
   
   var ENCODE_AUTO = 'auto';
   
   var MIN_LAT = -90;
   var MAX_LAT = 90;
   var MIN_LON = -180;
   var MAX_LON = 180;
   var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
   if (numberOfChars === ENCODE_AUTO) {
       if (typeof(latitude) === 'number' || typeof(longitude) === 'number') {
           throw new Error('string notation required for auto precision.');
       }
       var decSigFigsLat = latitude.split('.')[1].length;
       var decSigFigsLong = longitude.split('.')[1].length;
       var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
       numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
   } else if (numberOfChars === undefined) {
       numberOfChars = 10;
   }
   
   var chars = [],
   bits = 0,
   bitsTotal = 0,
   hash_value = 0,
   maxLat = MAX_LAT,
   minLat = MIN_LAT,
   maxLon = MAX_LON,
   minLon = MIN_LON,
   mid;
   while (chars.length < numberOfChars) {
       if (bitsTotal % 2 === 0) {
               mid = (maxLon + minLon) / 2;
           if (longitude > mid) {
               hash_value = (hash_value << 1) + 1;
               minLon = mid;
           } else {
               hash_value = (hash_value << 1) + 0;
               maxLon = mid;
           }
       } else {
           mid = (maxLat + minLat) / 2;
           if (latitude > mid) {
               hash_value = (hash_value << 1) + 1;
               minLat = mid;
           } else {
               hash_value = (hash_value << 1) + 0;
               maxLat = mid;
           }
       }
   
       bits++;
       bitsTotal++;
       if (bits === 5) {
       var code = BASE32_CODES[hash_value];
       chars.push(code);
       bits = 0;
       hash_value = 0;
       }
   }
   return chars.join('');
}

function appendToWidget(parentSelector, tag, classes, html) {
    var parentNode = document.querySelector(parentSelector);
    var childNode = document.createElement(tag);
    childNode.innerHTML = html;
    if (parentSelector != 'head') {
        childNode.className += classes;
    }
    parentNode.appendChild(childNode);
}

function openWidget(fn) {
    return new Promise(function(resolve, reject) { 

        if (document.readyState != 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
        resolve('success')

    })

}

function start() {

    if (this.config.widgetPosition == 'left') {
        currentWidgetPosition = 'left'
    } else {
        currentWidgetPosition = 'right'
    }
    appendToWidget("head", "style", "", `.pointng-open-button{color:#fff;border-radius: 5px;box-shadow: 0 2px 6px 0 rgba(0,0,0,.4);margin: 20px;border:none;cursor:pointer;position:fixed;bottom:5px;${currentWidgetPosition}:5px;width:35px}.pointng-popup{display:none;position:fixed;bottom:70;${currentWidgetPosition}:15px;border:2px solid #f1f1f1;z-index:9;border-radius: 5px;font-family: system-ui;}.pointng-form-container{max-width:300px;padding-left:20px;padding-right:20px;padding-bottom:10px;padding-top:1px;background-color:#fff}.pointng-form-container textarea{width:100%;padding:15px;margin:5px 0 22px 0;border:none;background:#f1f1f1;resize:none;min-height:200px}.pointng-form-container textarea:focus{background-color:#ddd;outline:0}.pointng-form-container .btn{background-color:31b0d4;border-radius:5px;font-size:1.1em;color:#fff;padding:16px 20px;border:none;cursor:pointer;width:100%;margin-bottom:10px;opacity:.8}.pointng-form-container .cancel{background-color:red}.form-container .btn:hover,.pointng-open-button:hover{opacity:1}`);
    var widgets = document.querySelectorAll('.pointng-widget');
    for (var i = 0; i < widgets.length; i++) {
        var parentNode = widgets[i];
        parentNode.setAttribute("id", "pointng-widget" + i);
        appendToWidget("#pointng-widget" + i, "div", "", '<img class="pointng-open-button" src="https://cdn.pointng.io/pointng_widget.svg" alt="pointng" onclick="pointng.openForm()"><div class="pointng-popup" id="pointngForm"><div class="pointng-form-container"> <h3>pointNG location identification management</h3><p>Choose the level you allow to identify your location.</p><input type="radio" id="continent" name="levels" value="continent" checked> <label for="continent">Continent</label><br><input type="radio" id="country" name="levels" value="country"> <label for="country">Country</label><br><input type="radio" id="state" name="levels" value="state"><label for="state">State</label><br><input type="radio" id="city" name="levels" value="city"><label for="city">City</label><br><div id="warning"></div><br><button type="submit" id="locateMe" class="btn" onclick="pointng.userLocate()">Locate me</button><button type="submit" id="locateMe" class="btn" onclick="pointng.savePreferences()">Save my preferences</button></div></div>')

    }
}

function openForm() {
    if (document.getElementById("pointngForm").style.display == "block") {
        document.getElementById("pointngForm").style.display = "none";
    } else {
        document.getElementById("pointngForm").style.display = "block";
    }  
}

function userLocate() {
    document.getElementById("pointngForm").style.display = "none";
    predictionData.ready = false
    var radios = document.getElementsByName('levels');

    if (document.getElementById('continent').checked || document.getElementById('country').checked || document.getElementById('state').checked || document.getElementById('city').checked) {
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                console.log(radios[i].value)
              // do whatever you want with the checked radio
              this.getLocation(radios[i].value)
          
              // only one radio can be logically checked, don't check the rest
              break;
            }
          }
    } else {
        console.log("not checked")
        document.getElementById('warning').innerHTML = '<p>Select at least one</p>';
        return
    }
   
}

function savePreferences() {
    
    document.getElementById("pointngForm").style.display = "none";
    predictionData.ready = false
    var radios = document.getElementsByName('levels');

    if (document.getElementById('continent').checked || document.getElementById('country').checked || document.getElementById('state').checked || document.getElementById('city').checked) {
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                console.log(radios[i].value)
              // do whatever you want with the checked radio
              this.currentLevel = radios[i].value
              this.config.level = radios[i].value
              currentLevel = radios[i].value
          
              // only one radio can be logically checked, don't check the rest
              break;
            }
          }
    } else {
        console.log("not checked")
        document.getElementById('warning').innerHTML = '<p>Select at least one</p>';
        return
    }

}

return {
    getLocation: getLocation,
    latLonLocate: latLonLocate,
    predictionData: predictionData,
    userLocate: userLocate,
    openWidget: openWidget,
    start: start,
    openForm: openForm,
    savePreferences: savePreferences
};


})();

