function PointNG(config) {
    
    this.config = config
    this.level = config.level
    this.api_key = config.api_key
    this.widgetPosition = config.widgetPosition
    this.privacyPolicyLink = config.privacyPolicyLink
}

PointNG.prototype = (function(document){
    
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
   var privacyPolicyLink;
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
    el = document.getElementById(id);
    if (!el) {     
        const script = document.createElement('script');
        script.src = url;
        script.id = id;
        document.body.appendChild(script);
       
        script.onload = async function () {
            if (callback) await callback(lat, lon, resolve, reject, loadDynamicScript);
        };
    } else {
        el.remove(); 
        const script = document.createElement('script');
        script.src = url;
        script.id = id;
        document.body.appendChild(script);
        
        script.onload = async function () {
            if (callback) await callback(lat, lon, resolve, reject, loadDynamicScript);
        };
    }


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
        document.getElementById("pointng-loader").style.opacity = 0;
        document.getElementById("pointng-loader").style['z-index'] = -1;
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
            document.getElementById("pointng-loader").style.opacity = 0;
            document.getElementById("pointng-loader").style['z-index'] = -1;
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
        document.getElementById("pointng-loader").style.opacity = 0;
        document.getElementById("pointng-loader").style['z-index'] = -1;
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
        document.getElementById("pointng-loader").style.opacity = 0;
        document.getElementById("pointng-loader").style['z-index'] = -1;
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
    console.log(this.config.widgetPosition)
    if (this.config.widgetPosition == 'left') {
        currentWidgetPosition = 'left'
    } else {
        currentWidgetPosition = 'right'
    }
    privacyPolicyLink = this.config.privacyPolicyLink
    appendToWidget("head", "style", "", `.pointng-open-button{color:#fff;border-radius: 5px;box-shadow: 0 2px 6px 0 rgba(0,0,0,.4);margin: 20px;border:none;cursor:pointer;position:fixed;bottom:5px;${currentWidgetPosition}:5px;width:35px}
    .pointng-header{
        padding: 0px;
        display: block;
        font-size: 1.17em;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        font-weight: bold;
    }
        .pointng-popup{
            display:none;
            position:fixed;
            bottom:0;
            margin-bottom: 70px;
            margin-right: 10px;
            ${currentWidgetPosition}:15px;
            border:2px solid #f1f1f1;
            z-index:9;
            border-radius: 5px;
            font-family: system-ui;
        }
        .pointng-form-container{max-width:300px;padding-left:20px;padding-right:20px;padding-bottom:20px;padding-top:20px;background-color:#fff}.pointng-form-container textarea{width:100%;padding:15px;margin:5px 0 22px 0;border:none;background:#f1f1f1;resize:none;min-height:200px}.pointng-form-container textarea:focus{background-color:#ddd;outline:0}
        .pointng-form-container .btn{
            background-color:#31b0d4 !important;border-radius:5px;font-size:1.1em;color:#fff;padding:16px 20px;border:none;cursor:pointer;width:100%;margin-bottom:10px;opacity:.8}.pointng-form-container .cancel{background-color:red}.form-container .btn:hover,.pointng-open-button:hover{opacity:1}.pointng-link {text-decoration: none;}
            
            .pointng-loader-wrapper {
                position: fixed;
                bottom: 0;
                ${currentWidgetPosition}: 0;
                padding: 10px;
                background: #fff;
                margin-bottom: 25px;
                margin-${currentWidgetPosition}: 25px;
                opacity: 1;
                z-index: 1;
                transition: opacity .3s;
                display: flex;
                align-items: center;
                border-radius: 6px;
                height: 15px;
                width: 15px;
              } 

              .ring-container {
                position: fixed;
                bottom: 0;
                ${currentWidgetPosition}: 0;
                padding: 10px;
                background: #fff;
                margin-bottom: 25px;
                margin-${currentWidgetPosition}: 25px;
                opacity: 0;
                z-index: -1;
                transition: opacity .3s;
                display: flex;
                align-items: center;
                border-radius: 6px;
                height: 35px;
                width: 35px;
            }
            
            .circle {
                width: 15px;
                height: 15px;
                background-color: #dddde8;
                border-radius: 50%;
                position: fixed;
                ${currentWidgetPosition}: 0;
                bottom: 0;
                margin-${currentWidgetPosition}: 35px;
                margin-bottom: 35px;
            }
            
            .ringring {
                border: 3px solid #dddde8;
                -webkit-border-radius: 30px;
                height: 25px;
                width: 25px;
                position: fixed;
                ${currentWidgetPosition}: 0;
                bottom: 0;
                margin-${currentWidgetPosition}: 30px;
                margin-bottom: 30px;
                -webkit-animation: pulsate 1s ease-out;
                -webkit-animation-iteration-count: infinite;
                opacity: 0.0;
            }
            @-webkit-keyframes pulsate {
                0% {-webkit-transform: scale(0.1, 0.1); opacity: 0.0;}
                50% {opacity: 1.0;}
                100% {-webkit-transform: scale(1.2, 1.2); opacity: 0.0;}
            }
            
            `);

    document.body.innerHTML += '<div class="pointng-widget"></div>';
    document.body.innerHTML += '<div id="pointng-loader" class="ring-container"><div class="ringring"></div><div class="circle"></div></div>'
    var widgets = document.querySelectorAll('.pointng-widget');
    for (var i = 0; i < widgets.length; i++) {
        var parentNode = widgets[i];
        parentNode.setAttribute("id", "pointng-widget" + i);
        appendToWidget("#pointng-widget" + i, "div", "", `<img class="pointng-open-button" src="https://cdn.pointng.io/pointng_widget.svg" alt="pointng" onclick="pointng.openForm()"><div class="pointng-popup" id="pointngForm"><form onsubmit="return false;" style="margin-bottom: 0px;"><div class="pointng-form-container"> <span class="pointng-header">pointNG location management</span><p>Choose the level that you allow this website to use your location.</p><input type="radio" id="pointng-continent" name="levels" value="continent" checked> <label for="continent">Continent</label><br><input type="radio" id="pointng-country" name="levels" value="country"> <label for="country">Country</label><br><input type="radio" id="pointng-state" name="levels" value="state"><label for="state"> State</label><br><input type="radio" id="pointng-city" name="levels" value="city"><label for="city"> City</label><br><div id="warning"></div><br><button type="submit" id="locateMe" class="btn" onclick="pointng.userLocate()">Locate me</button><button type="submit" id="locateMe" class="btn" onclick="pointng.savePreferences()">Save my preferences</button><br><a class="pointng-link" href="${privacyPolicyLink}">Read how this site uses your location &raquo;</a></div></form></div>`)
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
    document.getElementById("pointng-loader").style.opacity = 1;
    document.getElementById("pointng-loader").style['z-index'] = 1;
    predictionData.ready = false
    var radios = document.getElementsByName('levels');

    if (document.getElementById('pointng-continent').checked || document.getElementById('pointng-country').checked || document.getElementById('pointng-state').checked || document.getElementById('pointng-city').checked) {
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

    if (document.getElementById('pointng-continent').checked || document.getElementById('pointng-country').checked || document.getElementById('pointng-state').checked || document.getElementById('pointng-city').checked) {
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


})(document);

