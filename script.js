const app = Vue.createApp({
    data() {
        return {
            description: "This is a website that shows the sunrise and sunset times for a given location.",
            presetLocations: {
                "Los Angeles": "34.0549,-118.2426",
                "New York": "40.7128,-74.0060",
                "London": "51.5074,-0.1278",
                "Tokyo": "35.6895,139.6917",
                "Moscow": "55.7558,37.6173",
            },
            selectedLocation: "",
            customLocation: "",
            results: [],
            // Add filter properties
            showSunrise: true,
            showSunset: true,
            showSolarNoon: true,
            showDayLength: true,
        };
    },
    computed: {
        filteredResults() {
            return this.results.map(result => {
                const content = [];
                if (this.showSunrise && result.sunrise) {
                    content.push(`<p>Sunrise: ${result.sunrise}</p>`);
                }
                if (this.showSunset && result.sunset) {
                    content.push(`<p>Sunset: ${result.sunset}</p>`);
                }
                if (this.showSolarNoon && result.solar_noon) {
                    content.push(`<p>Solar Noon: ${result.solar_noon}</p>`);
                }
                if (this.showDayLength && result.day_length) {
                    content.push(`<p>Day Length: ${result.day_length}</p>`);
                }

                return `<div class="results-day">
                    <h3>${result.day}</h3>
                    ${content.join('')}
                </div>`;
            });
        },
    },
    methods: {
        useCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    this.showPosition,
                    this.showError
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        },
        showPosition(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            this.fetchSunriseSunset(`${lat},${lng}`);
        },
        showError(error) {
            alert(`Geolocation error: ${error.message}`);
        },
        useCustomLocation() {
            if (!this.customLocation) {
                alert("Please enter coordinates in the format: lat,lng");
                return;
            }
            const [lat, lng] = this.customLocation.split(",");
            if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                this.fetchSunriseSunset(`${lat},${lng}`);
            } else {
                alert("Invalid coordinates. Use the format: lat,lng");
            }
        },
        fetchSunriseSunset(coords) {
            const [lat, lng] = coords.split(",");
            const urls = [
                `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=today&formatted=0`,
                `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=tomorrow&formatted=0`,
            ];

            Promise.all(urls.map(url => fetch(url).then(resp => resp.json())))
                .then(data => {
                    if (data[0].status === "OK" && data[1].status === "OK") {
                        this.results = [
                            this.processResults(data[0].results, "Today"),
                            this.processResults(data[1].results, "Tomorrow"),
                        ];
                    } else {
                        alert("Error retrieving sunrise/sunset data.");
                    }
                })
                .catch(() => alert("Failed to fetch sunrise/sunset times."));
        },
        processResults(data, day) {
            return {
                day,
                sunrise: this.convertToLocalTime(data.sunrise),
                sunset: this.convertToLocalTime(data.sunset),
                solar_noon: this.convertToLocalTime(data.solar_noon),
                day_length: this.formatDayLength(data.day_length),
            };
        },
        convertToLocalTime(utcTime) {
            if (!utcTime) return "Invalid Date"; // Handle missing input
        
            let date;
            if (utcTime.includes("T")) {
                // If utcTime is in full ISO format (e.g., "2023-12-01T06:45:00Z")
                date = new Date(utcTime);
            } else {
                // If utcTime is just a time string (e.g., "06:45:00")
                date = new Date(`1970-01-01T${utcTime}Z`);
            }
        
            // Return a formatted local time or "Invalid Date" if parsing failed
            if (isNaN(date)) return "Invalid Date";
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        },
        formatDayLength(dayLength) {
            const hours = Math.floor(dayLength / 3600);
            const minutes = Math.floor((dayLength % 3600) / 60);
            const seconds = dayLength % 60;
            return `${hours}h ${minutes}m ${seconds}s`;
        },
        onLocationChange() {
            if (this.selectedLocation) {
                this.fetchSunriseSunset(this.selectedLocation);
            }
        },
    },
});

app.mount("#app");
