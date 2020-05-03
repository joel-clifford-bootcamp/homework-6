// api key for openweather api
const apiKey = "bd44ff52569ab5f912ce2dae809c84c0";

// collection of previously searched cities, used to rpevent duplicates from
// being added to list
const searchHistory = [];

// holds name of currently displayed city and is used prevents trivial 
// api calls
let currentCity = "";

// Override default when pressing enter in form control and 
// call getWeatherForCity
$(".form-control").keypress(event => {
    if (event.which === 13 /* Enter */) {
    event.preventDefault();
    getWeatherForCity();
    }
});

// Get weather for city, selected from list
$(".search").click(() => {
    getWeatherForCity();
})

function getWeatherForCity(){

    event.preventDefault();

    const city = $(".city-search").val().trim();

    if(city === currentCity) return;

    if(city.length > 0){
        getCurrentWeather(city, true);
        getForecast(city);
        currentCity = city;
    }
}

// Await user approval for page to get current position
// If user allows, get weather for current location
// If not print that location could not be obtained
$(document).ready(() => {

    const coords = navigator.geolocation.getCurrentPosition(
        pos => {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            getCurrentWeatherFromCoords(lat,lon,true);
            getForecastFromCoords(lat,lon);

        },
        err =>{
            const cityAndDateEl = $("#cityAndDate");

            cityAndDateEl.text("Unable to Retrieve Current Location");

            const imgEl = $("#currentImg");
        });
});

// Add a city to search history, if not there already
function addCityToHistory(cityName)
{
    if(searchHistory.includes(cityName)) return;

    const listGroupEl = $(".list-group");

    const listGroupItemEl = $("<a>");

    $(".list-group-item").removeClass("active");

    listGroupItemEl.addClass("list-group-item list-group-item-action active");
    listGroupItemEl.attr("data-city",cityName);
    listGroupItemEl.text(cityName);

    listGroupItemEl.click( function(event) {

        event.preventDefault();

        $(".list-group-item").removeClass("active");
    
        $(this).addClass("active");
    
        const city = $(this).attr("data-city");
    
        if(city === currentCity) return;

        getCurrentWeather(city);
    
        getForecast(city);
    });

    listGroupEl.append(listGroupItemEl);

    searchHistory.push(cityName);
}

// Get current weather for city
function getCurrentWeather(city, addToHistory = false)
{
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    $.ajax({
        type: "GET",
        url: weatherUrl,
        dataType: "json",
        success: response => {

            const iconUrl = `https://openweathermap.org/img/w/${response.weather[0].icon}.png`;

            const cityAndDateEl = $("#cityAndDate");
            const imgEl = $("#currentImg");
            const currentTempEl = $("#currentTemp");
            const currentHumidityEl = $("#currentHumidity");
            const currentWindSpeedEl = $("#currentWindSpeed");
            const currentUvIndexEl = $("#currntUvIndex");

            var today = moment().format("DD/MM/YY");

            cityAndDateEl.text(`${response.name} (${today})`);
            imgEl.attr("src",iconUrl);

            currentTempEl.text(`${(response.main.temp - 273.15).toFixed(1)}\xB0C`);
            currentHumidityEl.text(response.main.humidity + "%");
            currentWindSpeedEl.text((response.wind.speed * 3.6).toFixed(1) + "km/h");
            //currentUvIndexEl.text(reponse.main.temp);

            if(addToHistory){
                addCityToHistory(response.name);
            }
        }
    });
}

// get current weather for location
function getCurrentWeatherFromCoords(lat, lon, currentLocation = false)
{
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    $.ajax({
        type: "GET",
        url: weatherUrl,
        dataType: "json",
        success: response => {

            const iconUrl = `https://openweathermap.org/img/w/${response.weather[0].icon}.png`;

            const cityAndDateEl = $("#cityAndDate");
            const imgEl = $("#currentImg");
            const currentTempEl = $("#currentTemp");
            const currentHumidityEl = $("#currentHumidity");
            const currentWindSpeedEl = $("#currentWindSpeed");
            const currentUvIndexEl = $("#currntUvIndex");

            var today = moment().format("DD/MM/YY");

            if(currentLocation){
                cityAndDateEl.text(`Current Location - ${response.name} (${today})`);
                addCityToHistory(response.name);
            }
            else
                cityAndDateEl.text(`${response.name} (${today})`);

            imgEl.attr("src",iconUrl);

            currentTempEl.text(`${(response.main.temp - 273.15).toFixed(1)}\xB0C`);
            currentHumidityEl.text(response.main.humidity + "%");
            currentWindSpeedEl.text((response.wind.speed * 3.6).toFixed(1) + "km/h");
            //currentUvIndexEl.text(reponse.main.temp);

        }
    });
}

// get noon forecast for selected city
function getForecast(city)
{
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    $.ajax({
        type: "GET",
        url: forecastUrl,
        dataType: "jsonp",
        success: response => {

            const forecastEl = $(".forecast");

            forecastEl.empty();

            let forecastsPrinted = 0;

            for(i = 0; i < response.list.length && forecastsPrinted < 5; i++){
                
                if(isNoonForecast(response.list[i].dt_txt)){
                    var card = renderDailyForecast(response.list[i]);

                    forecastEl.append(card);

                    forecastsPrinted++;
                }
            }
        }
    });
}

// get noon forecast for location
function getForecastFromCoords(lat, lon)
{
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    $.ajax({
        type: "GET",
        url: forecastUrl,
        dataType: "jsonp",
        success: response => {

            const forecastEl = $(".forecast");

            forecastEl.empty();

            let forecastsPrinted = 0;

            for(i = 0; i < response.list.length && forecastsPrinted < 5; i++){
                
                if(isNoonForecast(response.list[i].dt_txt)){

                    var card = renderDailyForecast(response.list[i]);

                    forecastEl.append(card);

                    forecastsPrinted++;
                }
            }
        }
    });
}

// draw card for daily forecast
function renderDailyForecast(dailyWeather)
{
    const date = moment(dailyWeather.dt_txt).format("DD/MM/YY");

    const card = `<div class="col forecast-col">
<div class="card">      
<div class="card-body day-card">
<h5 class="card-title">${date}</h5>
<img alt="weather thumbnail" class="daily-weather-icon" src=https://openweathermap.org/img/w/${dailyWeather.weather[0].icon}.png>
<h5 class="daily-temp">${(dailyWeather.main.temp - 273.15).toFixed(1)}\xB0C</h5>
<h6>${dailyWeather.main.humidity}% Humidity</h6>
</div>
</div>
</div>` 
    return card;
}


function isNoonForecast(dateText){

    const hour = moment(dateText).format("HH");

    return hour === "12";
}
