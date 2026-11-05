// Oma OpenWeatherMap-API-avain.
const apiKey = "150ffdf1b50f6ca5cb00e7a5f4c9296a";

// HTML-elementti, johon säätiedot näytetään.
const tulos = document.getElementById("weatherdata");

// Tämä funktio ajetaan, kun käyttäjä klikkaa "Hae data" -painiketta.
// async mahdollistaa await-sanan käytön funktion sisällä.
async function haeRaakaData() {
    // Näytetään latausviesti.
    tulos.textContent = "Ladataan…";

    // Yritetään hakea ja käsitellä säädata.
    try {
        // Lähetetään GET-pyyntö sää-API:lle ja odotetaan vastausta.
        // q=Helsinki valitsee kaupungin.
        // units=metric antaa lämpötilan celsiusasteina.
        // mode=xml pyytää datan XML-muodossa.
        // ${apiKey} lisää API-avaimen osoitteeseen.
        const vastaus = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=Helsinki&units=metric&mode=xml&appid=${apiKey}`
        );

        // Tarkistetaan, palauttiko API onnistuneen HTTP-tilan (200–299).
        if (!vastaus.ok) {
            // Luodaan virhe, jolloin suoritus hyppää catch-lohkoon.
            throw new Error("HTTP " + vastaus.status);
        }

        // Luetaan vastauksen sisältö tekstinä ja odotetaan, että se on valmis.
        const xmlTeksti = await vastaus.text();

        // Näytetään XML sivulla tavallisena tekstinä (tagit näkyvät).
        tulos.textContent = xmlTeksti;

    // Käsitellään pyynnön tai yllä olevan koodin virheet.
    } catch (virhe) {
        // Valitaan virheviesti sivun kielen mukaan.
        const viesti = document.documentElement.lang === "fi"
            ? "Säätietojen haku epäonnistui: "
            : "Failed to fetch weather data: ";

        // Näytetään viesti ja virheen tiedot.
        tulos.textContent = viesti + virhe.message;
    }
}

// Kytketään funktio "Hae data" -painikkeeseen.
document.getElementById("fetchWeather").addEventListener("click", haeRaakaData);
