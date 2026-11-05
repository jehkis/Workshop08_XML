// Oma OpenWeatherMap-API-avain.
const apiKey = "150ffdf1b50f6ca5cb00e7a5f4c9296a";

// HTML-elementit, joita käytetään.
const tulos = document.getElementById("weatherdata");
const raakaXml = document.getElementById("raakaxml");
const nakyma = document.getElementById("nakyma");

// Valinnainen testiparametri osoitteessa: ?saa=aurinko|puolipilvi|pilvinen|sade|ukkonen|lumi|sumu|yo|yopilvi
const testiSaa = new URLSearchParams(location.search).get("saa");


// ---------- Datan haku ja XML:n parsiminen ----------

// Hakee kaupungin säätiedot XML-muodossa, parsii ne ja näyttää ne sivulla.
// async mahdollistaa await-sanan käytön funktion sisällä.
async function haeSaa(kaupunki) {
    tulos.classList.add("ladataan");

    try {
        // mode=xml pyytää datan XML-muodossa, units=metric celsiusasteina,
        // lang=fi suomenkielisen säätilan kuvauksen.
        const vastaus = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(kaupunki)}` +
            `&units=metric&mode=xml&lang=fi&appid=${apiKey}`
        );

        // 404 = kaupunkia ei löytynyt. Muut virhekoodit käsitellään yleisesti.
        if (vastaus.status === 404) {
            throw new Error(`kaupunkia "${kaupunki}" ei löytynyt`);
        }
        if (!vastaus.ok) {
            throw new Error("HTTP " + vastaus.status);
        }

        // Luetaan vastaus tekstinä ja näytetään se raakana "Näytä raaka-XML" -kohdassa.
        const xmlTeksti = await vastaus.text();
        raakaXml.textContent = xmlTeksti;

        // Parsitaan teksti XML-dokumentiksi (DOM-puuksi).
        const xml = new DOMParser().parseFromString(xmlTeksti, "application/xml");

        // Haetaan arvot tagien attribuuteista, esim. <temperature value="5.03" ...>.
        const saa = {
            nimi: xml.querySelector("city").getAttribute("name"),
            maa: xml.querySelector("country").textContent,
            lampotila: Number(xml.querySelector("temperature").getAttribute("value")),
            tuntuu: Number(xml.querySelector("feels_like").getAttribute("value")),
            pilvisyys: xml.querySelector("clouds").getAttribute("value"),
            kosteus: xml.querySelector("humidity").getAttribute("value"),
            tuuli: Number(xml.querySelector("wind speed").getAttribute("value")),
            kuvaus: xml.querySelector("weather").getAttribute("value"),
            koodi: Number(xml.querySelector("weather").getAttribute("number")),
            // Kuvakkeen nimi päättyy n-kirjaimeen yöllä (esim. "01n") ja d-kirjaimeen päivällä.
            yo: xml.querySelector("weather").getAttribute("icon").endsWith("n")
        };

        naytaSaa(saa);
        // Testausta varten animaation voi pakottaa osoitteella, esim. index.html?saa=sade
        piirraNakyma(testiSaa || saaTyyppi(saa.koodi, saa.yo));

    } catch (virhe) {
        tulos.innerHTML = "";
        const viesti = document.createElement("p");
        viesti.className = "virhe";
        viesti.textContent = "Säätietojen haku epäonnistui: " + virhe.message;
        tulos.appendChild(viesti);
    } finally {
        tulos.classList.remove("ladataan");
    }
}

// Tulostaa parsitut säätiedot diviin.
function naytaSaa(saa) {
    tulos.innerHTML = `
        <h1 class="kaupunki">${saa.nimi}, ${saa.maa}</h1>
        <p class="kuvaus">${saa.kuvaus}</p>
        <p class="lampo">${Math.round(saa.lampotila)}<span>°C</span></p>
        <dl class="tiedot">
            <div><dt>Tuntuu kuin</dt><dd>${Math.round(saa.tuntuu)} °C</dd></div>
            <div><dt>Pilvisyys</dt><dd>${saa.pilvisyys} %</dd></div>
            <div><dt>Ilmankosteus</dt><dd>${saa.kosteus} %</dd></div>
            <div><dt>Tuuli</dt><dd>${saa.tuuli.toFixed(1)} m/s</dd></div>
        </dl>
    `;
}


// ---------- Sääanimaatio ----------

// Muuttaa OpenWeatherMapin säätilakoodin animaation tyypiksi.
// Koodit: https://openweathermap.org/weather-conditions
function saaTyyppi(koodi, yo) {
    if (koodi >= 200 && koodi < 300) return "ukkonen";
    if (koodi >= 300 && koodi < 600) return "sade";      // tihku (3xx) ja sade (5xx)
    if (koodi >= 600 && koodi < 700) return "lumi";
    if (koodi >= 700 && koodi < 800) return "sumu";
    if (koodi === 800) return yo ? "yo" : "aurinko";
    if (koodi <= 802) return yo ? "yopilvi" : "puolipilvi"; // vähän tai hajanaisia pilviä
    return "pilvinen";
}

// Luo yhden elementin taustanäkymään. CSS-muuttujat (--x, --viive...) satunnaistavat
// sijainnin ja ajoituksen, jotta pisarat ja pilvet eivät liiku samassa tahdissa.
function lisaa(luokka, muuttujat = {}) {
    const elementti = document.createElement("div");
    elementti.className = luokka;
    for (const nimi in muuttujat) {
        elementti.style.setProperty("--" + nimi, muuttujat[nimi]);
    }
    nakyma.appendChild(elementti);
}

// Satunnaisluku väliltä min–max.
function satunnainen(min, max) {
    return Math.random() * (max - min) + min;
}

function lisaaPilvia(maara, tumma) {
    for (let i = 0; i < maara; i++) {
        lisaa("pilvi" + (tumma ? " tumma" : ""), {
            y: satunnainen(2, 35) + "vh",
            koko: satunnainen(0.7, 1.6),
            kesto: satunnainen(45, 90) + "s",
            viive: -satunnainen(0, 90) + "s" // negatiivinen viive = pilvi on heti valmiiksi matkalla
        });
    }
}

function lisaaPutoavia(luokka, maara, nopeusMin, nopeusMax) {
    for (let i = 0; i < maara; i++) {
        lisaa(luokka, {
            x: satunnainen(0, 100) + "vw",
            kesto: satunnainen(nopeusMin, nopeusMax) + "s",
            viive: -satunnainen(0, nopeusMax) + "s",
            koko: satunnainen(0.6, 1.2)
        });
    }
}

// Tyhjentää taustanäkymän ja rakentaa uuden säätyypin mukaan.
function piirraNakyma(tyyppi) {
    document.body.dataset.saa = tyyppi; // vaihtaa taustavärin CSS:ssä
    nakyma.innerHTML = "";

    switch (tyyppi) {
        case "aurinko":
            lisaa("aurinko");
            break;
        case "yo":
            lisaa("kuu");
            lisaaTahtia();
            break;
        case "puolipilvi":
            lisaa("aurinko");
            lisaaPilvia(4, false);
            break;
        case "yopilvi":
            lisaa("kuu");
            lisaaTahtia();
            lisaaPilvia(4, true);
            break;
        case "pilvinen":
            lisaaPilvia(8, true);
            break;
        case "sade":
            lisaaPilvia(6, true);
            lisaaPutoavia("pisara", 110, 0.5, 0.9);
            break;
        case "ukkonen":
            lisaaPilvia(7, true);
            lisaaPutoavia("pisara", 140, 0.4, 0.7);
            lisaa("salama");
            break;
        case "lumi":
            lisaaPilvia(5, false);
            lisaaPutoavia("hiutale", 80, 6, 12);
            break;
        case "sumu":
            for (let i = 0; i < 5; i++) {
                lisaa("sumuvyo", { y: i * 20 + "vh", kesto: satunnainen(20, 40) + "s", viive: -satunnainen(0, 40) + "s" });
            }
            break;
    }
}

function lisaaTahtia() {
    for (let i = 0; i < 60; i++) {
        lisaa("tahti", {
            x: satunnainen(0, 100) + "vw",
            y: satunnainen(0, 60) + "vh",
            viive: -satunnainen(0, 4) + "s"
        });
    }
}


// ---------- Tapahtumat ----------

// Hakukenttä: lomakkeen lähetys (Hae-painike tai Enter).
document.getElementById("hakulomake").addEventListener("submit", function (tapahtuma) {
    tapahtuma.preventDefault(); // estetään sivun uudelleenlataus
    const hakusana = document.getElementById("citysearch").value.trim();
    if (hakusana !== "") {
        haeSaa(hakusana);
    }
});

// Kun sivu avataan, näytetään heti valikon ensimmäisen kaupungin sää.
haeSaa(document.getElementById("city").value);
