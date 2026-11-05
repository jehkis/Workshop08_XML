// Oma OpenWeatherMap-API-avain.
const apiKey = "150ffdf1b50f6ca5cb00e7a5f4c9296a";

// HTML-elementti, johon säätiedot näytetään.
const tulos = document.getElementById("weatherdata");

// Onko sivu suomenkielinen? (workshop08.html = fi, workshop08_ENG.html = en)
const suomeksi = document.documentElement.lang === "fi";

// Hakee kaupungin säätiedot XML-muodossa, parsii ne ja näyttää ne sivulla.
// async mahdollistaa await-sanan käytön funktion sisällä.
async function haeSaa(kaupunki) {
    // Näytetään latausviesti.
    tulos.textContent = suomeksi ? "Ladataan…" : "Loading…";

    // Yritetään hakea ja käsitellä säädata.
    try {
        // Lähetetään GET-pyyntö sää-API:lle ja odotetaan vastausta.
        // q= valitsee kaupungin (encodeURIComponent muuttaa esim. välilyönnin muotoon %20).
        // units=metric antaa lämpötilan celsiusasteina.
        // mode=xml pyytää datan XML-muodossa.
        // lang=fi/en kääntää säätilan kuvauksen (esim. "selkeää").
        // ${apiKey} lisää API-avaimen osoitteeseen.
        const vastaus = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(kaupunki)}` +
            `&units=metric&mode=xml&lang=${suomeksi ? "fi" : "en"}&appid=${apiKey}`
        );

        // 404 = API ei löytänyt kaupunkia.
        if (vastaus.status === 404) {
            throw new Error(suomeksi ? `kaupunkia "${kaupunki}" ei löytynyt` : `city "${kaupunki}" not found`);
        }

        // Tarkistetaan, palauttiko API onnistuneen HTTP-tilan (200–299).
        if (!vastaus.ok) {
            // Luodaan virhe, jolloin suoritus hyppää catch-lohkoon.
            throw new Error("HTTP " + vastaus.status);
        }

        // Luetaan vastauksen sisältö tekstinä ja odotetaan, että se on valmis.
        const xmlTeksti = await vastaus.text();

        // Parsitaan teksti XML-dokumentiksi (DOM-puuksi), jota voi tutkia kuten HTML:ää.
        const xml = new DOMParser().parseFromString(xmlTeksti, "application/xml");

        // Haetaan arvot. XML:ssä ne ovat tagien attribuuteissa, esim. <temperature value="5.03" ...>.
        const nimi = xml.querySelector("city").getAttribute("name");
        const maa = xml.querySelector("country").textContent;
        const lampotila = Number(xml.querySelector("temperature").getAttribute("value"));
        const pilvisyys = xml.querySelector("clouds").getAttribute("value");
        const kosteus = xml.querySelector("humidity").getAttribute("value");
        const kuvaus = xml.querySelector("weather").getAttribute("value");

        // Näytetään parsitut tiedot sivulla.
        tulos.innerHTML = `
            <h3>${nimi}, ${maa}</h3>
            <p>${suomeksi ? "Lämpötila" : "Temperature"}: ${lampotila.toFixed(1)} °C</p>
            <p>${suomeksi ? "Pilvisyys" : "Cloudiness"}: ${pilvisyys} % (${kuvaus})</p>
            <p>${suomeksi ? "Ilmankosteus" : "Humidity"}: ${kosteus} %</p>
        `;

    // Käsitellään pyynnön tai yllä olevan koodin virheet.
    } catch (virhe) {
        // Valitaan virheviesti sivun kielen mukaan.
        const viesti = suomeksi ? "Säätietojen haku epäonnistui: " : "Failed to fetch weather data: ";

        // Näytetään viesti ja virheen tiedot.
        tulos.textContent = viesti + virhe.message;
    }
}

// "Hae data" -painike: haetaan pudotusvalikossa valittuna olevan kaupungin sää.
document.getElementById("fetchWeather").addEventListener("click", function () {
    haeSaa(document.getElementById("city").value);
});

// Hakukenttä: haetaan kirjoitetun kaupungin sää.
function haeHakusanalla() {
    const hakusana = document.getElementById("citysearch").value.trim();
    if (hakusana === "") {
        tulos.textContent = suomeksi ? "Kirjoita ensin kaupungin nimi." : "Type a city name first.";
        return;
    }
    haeSaa(hakusana);
}

// Haku käynnistyy "Hae"-painikkeesta tai Enter-näppäimellä.
document.getElementById("search").addEventListener("click", haeHakusanalla);
document.getElementById("citysearch").addEventListener("keydown", function (tapahtuma) {
    if (tapahtuma.key === "Enter") {
        haeHakusanalla();
    }
});
