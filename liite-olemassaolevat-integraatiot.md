<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Liite: olemassa olevat kolmannen osapuolen eVaka-integraatiot

Kartoitus tehty 8.–9.9.2026. Tarkoitus on todentaa väite "kuntalaiset rakentavat jo integraatioita omilla salasanoillaan".

## Yhteenveto

**Julkisesti löydettäviä, toimivaa koodia sisältäviä kolmannen osapuolen eVaka-integraatioita on viisi.** Lisäksi yksi on tekijän itsensä raportoima mutta julkaisematon, ja yksi on suunnitelma ilman koodia. Luku on pieni, ja se kannattaa sanoa ääneen. Olennaista ei kuitenkaan ole määrä vaan se, *miten* nämä on tehty: neljä viidestä kirjautuu kuntalaisen sähköposti–salasana-tunnuksilla (heikko kirjautuminen), tallentaa salasanan omaan konfiguraatioonsa ja matkii selainta (kiinteä `x-evaka-csrf`-otsake, istuntokeksi, uudelleenkirjautuminen 401-vastaukseen). Kaikki viisi on tehty viimeisen 12 kuukauden aikana (9/2025–8/2026), eri tekijöiden toimesta ja kolmen eri kunnan eVakaa vasten.

## Todennetut integraatiot

Todennettu = lähdekoodi luettu. Tähdet/haarat 8.9.2026. Yhdelläkään ei ole haaroja eikä avoimia issueita.

| # | Projekti | Mitä tekee | Tunnistautuminen | Kutsutut rajapinnat (`/api/citizen/…`) | Aktiivisuus | Tila |
|---|---|---|---|---|---|---|
| 1 | [cerkkuz/evaka-homeassistant](https://github.com/cerkkuz/evaka-homeassistant) | Home Assistant -lisäosa (HACS-mukautettu repo): päiväkodin kalenteritapahtumat HA-kalenteriin ja sensoreiksi (mm. e-paperinäyttöä varten). Tukee Espoota, Oulua, Tamperetta ja Turkua. | Heikko kirjautuminen; salasana HA:n konfiguraatiossa | `auth/weak-login`, `auth/status`, `calendar-events`, `children`, `messages/received`, `messages/unread-count` | 5 commitia 22.–25.1.2026; 1 tähti | Käytetyt reitit ovat yhä olemassa; ei testattu |
| 2 | [pexea12/evaka-forwarder](https://github.com/pexea12/evaka-forwarder) | Pollaa saapuneet viestit 10 min välein ja välittää ne Telegramiin (Docker, Raspberry Pi). Merkitsee tavalliset viestit luetuiksi. | Heikko kirjautuminen; salasana SOPS/age-salatussa tiedostossa | `auth/weak-login`, `messages/received`, `messages/unread-count`, `messages/threads/{id}/read` | 55 commitia 20.7.–11.8.2026; 1 tähti; MIT | Toimiva; tunnistaa arkaluonteisten viestien `Redacted`-muodon |
| 3 | [JuhaniS/eInk](https://github.com/JuhaniS/eInk) | Kodin e-paperinäyttö (Pi Zero 2 W): sää, HSL, sähkö, kalenteri ja "PÄIVÄKOTI"-paneeli eVakasta. | Heikko kirjautuminen; salasana `config.yaml`:ssa; istunto- ja laitekeksi tallennetaan levylle | `auth/weak-login`, `calendar-events` | 22 commitia 16.3.–6.8.2026; 27 tähteä, 10 haaraa (koko näyttöprojektille) | Toimiva; toistaa laitekeksin, jotta "uusi selain" -sähköposti ei lähde |
| 4 | [TommiJarvenpaa/evaka_oulu](https://github.com/TommiJarvenpaa/evaka_oulu) | Epävirallinen Flutter-mobiilisovellus Oulun eVakaan: viestit (luku, vastaus, lähetys liitteineen), varaukset, poissaolot, massailmoitus, kalenteri, keskusteluajat, lomakysely. | Heikko kirjautuminen; salasana puhelimen `flutter_secure_storage`ssa; automaattinen uudelleenkirjautuminen | n. 25 reittiä, mm. `reservations` (GET/POST), `absences` (POST), `messages` (POST), `calendar-events`, `holiday-period/*`; dokumentoitu selaimen HAR-tallenteesta | 16 commitia 25.4.–22.5.2026; 0 tähteä | Toimiva; ainoa, joka myös **kirjoittaa** (varaukset, poissaolot, viestit) |
| 5 | [latenssi/evaka-assistant](https://github.com/latenssi/evaka-assistant) | Selainlaajennus (MV3) `evaka.turku.fi`:lle: lisää läsnäolonäkymään ennusteen "toteutuvat tunnit vs. sopimustunnit". | Selaimen oma istunto (`credentials: include`) – ei tallenna salasanaa | `reservations` | 9 commitia 24.9.2025; 0 tähteä | Toimiva; ei salasanariskiä, mutta rikkoutuu `data-qa`-attribuuttien muuttuessa |

**Raportoitu, ei julkaistu:** joonas-fi kertoo issuessa [#9739](https://github.com/espoon-voltti/evaka/issues/9739) (2.9.2026) tehneensä sovittimen, joka hakee `calendar-events`-JSONin ja työntää tapahtumat CalDAV-palvelimelle (Baïkal). Kirjautumistapaa ei sanota; heikko kirjautuminen on päätelmä.

**Suunnitelma ilman koodia (ei lasketa):** [Mokkatrukki/paikallinen-kalenteribot](https://github.com/Mokkatrukki/paikallinen-kalenteribot) (8/2026) listaa eVaka-integraation vaiheeseen V6 ja kirjaa avoimen kysymyksen: *"Wilma/eVaka-pääsytapa tuntematon (API? scrape? sähköposti-ilmoitus?)"*.

**Ei lasketa:** eVakan ytimen kopiot (flameboy128/evaka, aleksiJM/evaka – Petäjäveden käyttöönotto), kuntien infra- ja ylläpitorepot, reaktor/enivel (DigiOne-spesifikaatio), Fabezi/family-tools (päiväkotivertailu julkisilta sivuilta), tämän hankkeen omat repot.

## Kuntalaisten omat sanat

- joonas-fi, [#9739](https://github.com/espoon-voltti/evaka/issues/9739): *"Vibe-koodasin oman synkka-adapterin joka käy hakeen JSON:in `/api/citizen/calendar-events` endpointista ja työntää kalenteri-eventit CalDAV-yhteensopivalle palvelimelle – – Tämä on kuitenkin kaukana ideaalista, koska mikäli kirjautumis-rajapinta tai toi JSON rajapinta muuttuu, täytyy omaa softaa aina muokkailla. Standardi ratkaisu olisi kiva."*
- pexea12, README: *"As a parent using eVaka for daycare communication, you normally receive email notifications saying 'you have a new message' but must log in via suomi.fi to read the actual content. This tool automates that process."* – ja rajoitteesta: *"because this tool uses weak (email/password) login, eVaka returns sensitive threads in a redacted form with no readable content."*
- JuhaniS, CLAUDE.md ja commit 5.8.2026 *"Replay eVaka device cookie on login to stop new-browser emails"*: *"The signed 90-day device cookie – – MUST be persisted and replayed on every login — eVaka emails the user about a 'login from a new browser' whenever a weak login arrives without it."* Toisin sanoen turvakontrolli (uuden laitteen ilmoitus) koetaan automaatiossa häiriöksi ja kierretään.
- cerkkuz, README: *"API may change - Evaka's API is undocumented and may break at any time"* ja *"your credentials are stored locally in Home Assistant; review the code if concerned"*.
- TommiJarvenpaa, README: *"Epävirallinen Flutter-asiakas Oulun varhaiskasvatuksen eVaka-palvelulle – – henkilökohtainen harrastusprojekti."* API-muistiinpanot: *"Perustuu Firefox DevToolsin HAR-vientiin 2026-04-24."*
- latenssi, README kokonaisuudessaan: *"Trying to make eVaka usable for people."*
- Chupee, [#6485](https://github.com/espoon-voltti/evaka/issues/6485) (3/2025): *"Is there already a public API for Evaka, where parents to authenticate with their credentials account?"*
- onion@tal.org, Mastodon 26.8.2025: *"Oh how I hate systems that sends you an email that you have a message, but can't put the damn message in the blody email. Looking at you #wilma #evaka #turku"*

Huomio: kolmessa viidestä repositoriosta on `CLAUDE.md`/`AGENTS.md`, ja joonas-fi kuvaa työtään vibe-koodaukseksi. Tekoälyavusteinen koodaus on laskenut kynnystä tehdä oma integraatio, joten määrä todennäköisesti kasvaa.

## Sama ilmiö vastaavissa järjestelmissä

| Järjestelmä | Epävirallisia integraatioita | Huomio |
|---|---|---|
| **Wilma** (FI) | [OpenWilma](https://github.com/OpenWilma) (10 kirjastoa, JS 23 tähteä), [developerfromjokela/wilma_api](https://github.com/developerfromjokela/wilma_api) (19), Wilma Plus, OtaWilma | OpenWilman oauth-repo perustelee itsensä: *"This way developers have no need to store anyone's password."* Syyskuussa 2022 Visman rajapintavirhe näytti Wilma Plus -käyttäjille muiden oppilaiden nimiä; Visma sulki kolmansien osapuolten rajapinnat 12.9.2022 alkaen ([Kauppalehti 15.9.2022](https://www.kauppalehti.fi/uutiset/wilma-plus-sovellus-on-vuotanut-oppilaiden-tietoja/f6b1a722-7905-42c5-bf81-7c94dd4538d5)). Keväällä 2026 Visma Aquila kertoi käyttäjien luoneen tekoälyagentteja, jotka hyödyntävät Wilman tietoja (IS, fi.wikipedian mukaan). |
| **Aula** (DK) | [scaarup/aula](https://github.com/scaarup/aula): 119 tähteä, 35 haaraa, HACS-oletuslistalla, aktiivinen 9/2026 | Huoltajan Unilogin/MitID-tunnus ja salasana HA:n konfiguraatiossa: *"when your password expires, the integration must be deleted and added again."* |
| **Skolplattformen** (Stockholm) | [kolplattformen/skolplattformen](https://github.com/kolplattformen/skolplattformen): 811 tähteä, 170 haaraa | *"We are parents who got fed up – – We reverse-engineered the platform's API."* Kaupunki yritti obfuskointia, joka murrettiin tunneissa; syksyllä 2021 suunta kääntyi yhteistyöhön (sv.wikipedia). |
| **Infomentor** (SE) | [anlu85/home-assistant-infomentor](https://github.com/anlu85/home-assistant-infomentor), [Pochtli137/infomentor-digest](https://github.com/Pochtli137/infomentor-digest), kolplattformen/dementor.net, m42e/infomentor, lnd3/im-tools, MMM-Infomentor | infomentor-digest (8/2026): *"InfoMentor har inget publikt API. Klienten loggar in på samma sätt som deras egen app."* |
| **SchoolSoft** (SE) | [Blatzar/schoolsoft-api-app](https://github.com/Blatzar/schoolsoft-api-app) (13 tähteä) + n. 8 muuta (Python, Node, Rust, PHP) | *"Reverse engineered schoolsoft api the app uses."* |
| **Unikum** (SE) | Renen12/unikum_tools + uuf-asiakas, lindehoff/unikum-image-grabber | Vähäisempi; BankID-kirjautuminen käsin ja sen jälkeen skreippaus. |

Kaava on sama joka maassa: vanhemmat purkavat selain- tai mobiilisovelluksen liikenteen, tallentavat tunnuksensa ja rakentavat sen päälle. Toimittajan reaktio on vaihdellut sulkemisesta (Wilma 2022) yhteistyöhön (Tukholma 2021).

## Menetelmä ja mistä etsittiin

- **GitHub:** repohaku nimestä, kuvauksesta ja README:stä sanoilla evaka, trevaka, evakaturku, evakaoulu, varhaiskasvatus, päiväkoti ja yhdistelmillä (home assistant, calendar, ical, caldav, telegram, scraper, bot); koodihaku merkkijonoilla `api/citizen/auth/weak-login`, `api/citizen/calendar-events`, `x-evaka-csrf`, `evaka.eugw.session`, `__Host-evaka-device-user`, `weakLoginUsername` ja kuntien eVaka-domaineilla. Vain yllä listatut löytyivät. Discussions ei ole käytössä espoon-voltti/evakassa; issue-haku 20 hakusanalla tuotti kolme relevanttia issueta (#6485, #7446, #9739).
- **Ei löytynyt mitään:** GitLab.com ja Codeberg (repohaku), npm, PyPI, crates.io, pkg.go.dev (ei yhtään evaka-pakettia), HACS-oletuslista (eVakaa ei ole; vain mukautettu repo), Home Assistant -yhteisöfoorumi (0 ketjua), Hacker News (Algolia, 0 osumaa), Mastodon-tunnistehaku neljältä instanssilta (2 postausta yhdeltä käyttäjältä).
- **Rajoitteet:** Redditin API esti pyynnöt (403); Brave-haun kautta löytyi vain yksi ohimenevä maininta r/Finlandissa. Bing ja DuckDuckGo palauttivat CAPTCHAn tai roskaa; Brave-hakua käytettiin muutamaan suomen- ja englanninkieliseen kyselyyn ("eVaka rajapinta", "eVaka kalenteri synkronointi", "evaka weak login script"). Twitter/X, Facebook-ryhmät, Discord ja suomalaiset keskustelufoorumit (io-tech, Suomi24) jäivät kattamatta – vanhempien FB-ryhmät ovat todennäköinen katvealue. Kauppalehden, Tivin ja IS:n artikkelit eivät auenneet; niistä on käytetty vain hakukoneen näyttämää katkelmaa.
- Integraatioiden toimivuutta ei testattu tuotantoa vasten; "toimiva" tarkoittaa, että koodi on kokonainen ja sen käyttämät reitit ovat eVakan nykyisessä lähdekoodissa.

## Mitä näyttö tukee ja mitä ei

**Tukee:** (1) Väite pitää paikkansa: vähintään viisi toisistaan riippumatonta kuntalaista on rakentanut julkisen, toimivan integraation, ja neljä niistä tallentaa eVakan salasanan omaan järjestelmäänsä. (2) Integraatiot eivät rajoitu lukemiseen – Oulun sovellus tekee varauksia, poissaoloja ja lähettää viestejä täysillä tilin oikeuksilla. (3) Ne kopioivat selaimen käytöksen niin tarkasti, että eVakan omat turvakontrollit (uuden laitteen ilmoitus, arkaluonteisten viestien piilotus) joko kierretään tai koetaan ongelmaksi. (4) Tekijät itse pyytävät vakaata, tokenpohjaista rajapintaa (#6485, #9739). (5) Ilmiö on rakenteellinen: sama toistuu Wilmassa, Aulassa, Infomentorissa, SchoolSoftissa ja Skolplattformenissa, ja Wilman 2022 tapaus näyttää, mitä tapahtuu, kun rajapintaa ei ole suunniteltu kolmansille osapuolille.

**Ei tue:** Näyttö ei kerro käyttäjämääristä – tähtiä on 0–1 projektia kohden, eikä yhtään haaraa. Ei ole näyttöä kaupallisista kolmansista osapuolista, tietovuodosta eVakassa tai siitä, kuinka monta julkaisematonta skriptiä on olemassa. Luku "viisi" on alaraja julkiselle koodille, ei arvio ilmiön koosta.
