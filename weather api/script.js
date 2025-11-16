const apiKey = "d1279ab3cfc4f57f6b088f1ec4b24c4a"; // Your API key

// 🕒 Live date and time
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  document.getElementById("dateTime").textContent =
    now.toLocaleString("en-IN", options);
}
setInterval(updateDateTime, 1000);
updateDateTime();

// 🌦 Fetch current weather
async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.cod !== 200) throw new Error(data.message);
  return data;
}

// 📅 Fetch 5-day forecast
async function fetchForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.cod !== "200") throw new Error(data.message);
  return data;
}

// 🔁 Show/hide loading spinner
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "flex" : "none";
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const weatherDiv = document.getElementById("weather");
  const forecastDiv = document.getElementById("forecast");
  const errorDiv = document.getElementById("error");
  const mapFrame = document.getElementById("mapFrame");
  const forecastTitle = document.getElementById("forecastTitle");

  weatherDiv.innerHTML = forecastDiv.innerHTML = errorDiv.textContent = "";
  forecastTitle.textContent = "";

  if (!city) {
    errorDiv.textContent = "Please enter a city name.";
    return;
  }

  showLoading(true);

  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeather(city),
      fetchForecast(city),
    ]);

    const icon = weatherData.weather[0].icon;
    const desc = weatherData.weather[0].description;

    const localTime = new Date((weatherData.dt + weatherData.timezone) * 1000);
    const timeString = localTime.toUTCString().replace("GMT", "Local Time");

    weatherDiv.innerHTML = `
      <div class="card">
        <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
        <p><b>🕓 ${timeString}</b></p>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p><b>🌡 Temp:</b> ${weatherData.main.temp}°C</p>
        <p><b>🌤 Weather:</b> ${desc}</p>
        <p><b>💧 Humidity:</b> ${weatherData.main.humidity}%</p>
        <p><b>🌬 Wind:</b> ${weatherData.wind.speed} m/s</p>
      </div>
    `;

    mapFrame.src = `https://maps.google.com/maps?q=${weatherData.coord.lat},${weatherData.coord.lon}&z=10&output=embed`;

    forecastTitle.textContent = "5-Day Forecast";

    const daily = forecastData.list.filter((item) =>
      item.dt_txt.includes("12:00:00")
    );

    forecastDiv.innerHTML = daily
      .map((day) => {
        const date = new Date(day.dt_txt).toLocaleDateString();
        return `
        <div class="card">
          <h3>${date}</h3>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="">
          <p><b>${day.weather[0].description}</b></p>
          <p>🌡 ${day.main.temp}°C</p>
        </div>`;
      })
      .join("");
  } catch (err) {
    errorDiv.textContent = "Error: " + err.message;
  } finally {
    showLoading(false);
  }
}

// 📍 User location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        showLoading(true);
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
          const res = await fetch(url);
          const data = await res.json();

          document.getElementById("cityInput").value = data.name;
          await getWeather();
        } finally {
          showLoading(false);
        }
      },
      () => {
        document.getElementById("error").textContent =
          "Location access denied.";
      }
    );
  } else {
    document.getElementById("error").textContent =
      "Geolocation not supported.";
  }
}