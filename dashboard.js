import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Cloud, Droplets, Wind, Eye, Gauge, TrendingUp, Search, MapPin } from 'lucide-react';

export default function WeatherDashboard() {
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    fetchWeatherData(city);
  }, []);

  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      // Using Open-Meteo API (no key required)
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      
      setCurrentWeather({
        city: `${name}, ${country}`,
        temp: Math.round(weatherData.current.temperature_2m),
        feelsLike: Math.round(weatherData.current.apparent_temperature),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        windDir: weatherData.current.wind_direction_10m,
        pressure: Math.round(weatherData.current.pressure_msl),
        precipitation: weatherData.current.precipitation
      });
      
      const dailyForecast = weatherData.daily.time.slice(0, 7).map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        high: Math.round(weatherData.daily.temperature_2m_max[i]),
        low: Math.round(weatherData.daily.temperature_2m_min[i]),
        precipitation: weatherData.daily.precipitation_sum[i],
        windSpeed: Math.round(weatherData.daily.wind_speed_10m_max[i])
      }));
      setForecast(dailyForecast);
      
      const hourly = weatherData.hourly.time.slice(0, 24).map((time, i) => ({
        time: new Date(time).getHours() + ':00',
        temp: Math.round(weatherData.hourly.temperature_2m[i]),
        humidity: weatherData.hourly.relative_humidity_2m[i],
        precipProb: weatherData.hourly.precipitation_probability[i],
        windSpeed: Math.round(weatherData.hourly.wind_speed_10m[i])
      }));
      setHourlyData(hourly);
      
      setCity(name);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeatherData(searchInput);
      setSearchInput('');
    }
  };

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-8 h-8 ${color}`} />
        <span className="text-slate-400 text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {value}<span className="text-lg text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Weather Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-lg">Real-time weather data visualization and forecasting</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search city..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'hourly', 'forecast', 'analytics'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : currentWeather ? (
          <>
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Current Weather */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-1">{currentWeather.city}</h2>
                      <p className="text-blue-200">Current Conditions</p>
                    </div>
                    <Cloud className="w-16 h-16 text-blue-200" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-7xl font-bold">{currentWeather.temp}</span>
                    <span className="text-4xl text-blue-200 mb-2">°C</span>
                  </div>
                  <p className="text-blue-200 mt-2">Feels like {currentWeather.feelsLike}°C</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={Droplets}
                    label="Humidity"
                    value={currentWeather.humidity}
                    unit="%"
                    color="text-cyan-400"
                  />
                  <StatCard
                    icon={Wind}
                    label="Wind Speed"
                    value={currentWeather.windSpeed}
                    unit="km/h"
                    color="text-emerald-400"
                  />
                  <StatCard
                    icon={Gauge}
                    label="Pressure"
                    value={currentWeather.pressure}
                    unit="hPa"
                    color="text-purple-400"
                  />
                  <StatCard
                    icon={Cloud}
                    label="Precipitation"
                    value={currentWeather.precipitation}
                    unit="mm"
                    color="text-blue-400"
                  />
                </div>
              </div>
            )}

            {activeView === 'hourly' && (
              <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  24-Hour Forecast
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} name="Temperature (°C)" />
                    <Line type="monotone" dataKey="precipProb" stroke="#06b6d4" strokeWidth={2} name="Precip. Probability (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeView === 'forecast' && (
              <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-6">7-Day Forecast</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="high" fill="#ef4444" name="High Temp (°C)" />
                    <Bar dataKey="low" fill="#3b82f6" name="Low Temp (°C)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeView === 'analytics' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold mb-6">Weekly Weather Pattern</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={forecast}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="date" stroke="#94a3b8" />
                      <PolarRadiusAxis stroke="#94a3b8" />
                      <Radar name="High Temp" dataKey="high" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Radar name="Wind Speed" dataKey="windSpeed" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold mb-6">Precipitation Forecast</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="precipitation" fill="#06b6d4" name="Precipitation (mm)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}