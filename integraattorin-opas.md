<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Integraattorin opas: omien eVaka-tietojen lukeminen sovellusavaimella

Tämä opas on sinulle, joka haluat ohjelman lukevan **omia** eVaka-tietojasi: esimerkiksi viedä lasten hoitoajat kalenteriin tai saada ilmoituksen uudesta viestistä. Toimiva esimerkkisovellus on hakemistossa [`evaka-integration-demo`](evaka-integration-demo/), ja sen HTTP-asiakas [`src/evaka-client.ts`](evaka-integration-demo/src/evaka-client.ts) on tämän oppaan malliratkaisu.

## 1. Mitä sovellusavain on

Sovellusavain on merkkijono, jonka luot itse eVakassa ja jolla ohjelmasi tunnistautuu sinuna heikosti tunnistautuneena kuntalaisena, samaan tapaan kuin sähköposti ja salasana. Se antaa vain valitsemasi oikeudet, vanhenee valitsemanasi päivänä ja on peruttavissa milloin tahansa. Avaimella pääsee vain erikseen lueteltuihin päätepisteisiin (luku 4); kaikki muu on sen ulottumattomissa. Sovellusavain **ei** ole tapa antaa kolmannen osapuolen sovellukselle pääsyä muiden ihmisten tietoihin, eikä eVaka ole OAuth-valtuutuspalvelin: avaimella pääsee vain sen luoneen kuntalaisen näkymään. Huomaa kuitenkin, että oma näkymäsi sisältää muidenkin ihmisten tietoja: lapsesi, lapsen toisen huoltajan ja henkilöstön (luku 9).

## 2. Avaimen luonti

1. Kirjaudu eVakaan **vahvalla tunnistautumisella** (Suomi.fi).
2. Avaa **Omat tiedot → Sovellusavaimet**, anna avaimelle nimi, valitse oikeudet ja voimassaoloaika, ja luo avain.
3. Kopioi avain talteen heti — **se näytetään vain kerran**.

Rajat: enintään **10 avainta** kuntalaista kohti, voimassaolo enintään **180 vuorokautta**, vanhenemispäivä on pakollinen. Kun luot avaimen, jokaiselle yhteisen lapsen toiselle huoltajalle lähetetään sähköposti, jossa kerrotaan, että ohjelmalla on nyt pääsy lapsen tietoihin. Säilytä avain palvelimen puolella (ympäristömuuttuja tai tiedosto oikeuksin `0600`), älä koskaan versionhallinnassa tai selaimessa: esimerkkisovellus tallentaa avaimen `.token`-tiedostoon, ja selain kutsuu vain sovelluksen omaa palvelinta.

## 3. Pyynnön muoto

Avain kulkee `Authorization`-otsakkeessa. Evästeitä tai CSRF-otsaketta ei tarvita eikä kannata lähettää: jos pyynnössä on sekä avain että istuntoeväste, avain ratkaisee. Avain on aina muotoa `evaka_pat_` + 43 merkkiä; väärän muotoinen avain hylätään heti.

```sh
curl -H "Authorization: Bearer evaka_pat_<43 merkkiä>" \
     -H "Accept: application/json" \
     "https://<kunnan-evaka>/api/citizen/reservations?from=2026-09-01&to=2026-09-30"
```

## 4. Oikeudet

Oikeudet ovat kiinteä sanasto, jota ei voi päätellä osoitteesta: jokainen oikeus kattaa täsmälleen alla luetellut päätepisteet, eikä avaimella pääse mihinkään muuhun, valitsit mitä tahansa. Polkumuuttuja (`{childId}`) vastaa yhtä osoitteen osaa. Ajossa olevan version luettelon saa manifestista (luku 6). Sarake "Kenen tietoja" kertoo, keiden henkilötietoja vastauksessa on.

| Oikeus | Päätepisteet | Mitä sisältää | Kenen tietoja |
| --- | --- | --- | --- |
| `PERSONAL_DATA_READ` | `GET /citizen/personal-data/email-verification`, `GET /citizen/personal-data/notification-settings` | Sähköpostiosoite ja sen vahvistustila; mistä viestityypeistä saat sähköpostia (vain luku) | Sinun |
| `CHILDREN_READ` | `GET /citizen/children`, `GET /citizen/children/{childId}/attendance-summary/{yearMonth}`, `GET /citizen/children/{childId}/service-needs` | Lapset nimineen, ryhmineen ja yksiköineen, sijoitusmuoto ja sallitut toiminnot; läsnäolopäivien määrä; palveluntarpeet | Lasten |
| `CALENDAR_READ` | `GET /citizen/calendar-events`, `GET /citizen/calendar-events/{eventId}/ics`, `GET /citizen/calendar-event-times/{eventTimeId}/ics`, `GET /citizen/units?type=…`, `POST /citizen/preschool-operational-dates` | Tapahtumat otsikoineen ja kuvauksineen, keskusteluajat (myös .ics), yksiköt, esiopetuksen toimintapäivät (kysely, vaikka POST) | Lasten; henkilöstön kirjoittama teksti; keskusteluaika näkyy, vaikka toinen huoltaja varasi sen |
| `RESERVATIONS_READ` | `GET /citizen/reservations?from=…&to=…` | Läsnäolovaraukset, toteutuneet läsnäolot ja poissaolot lajeineen päivittäin (`absence.type`, mm. `SICKLEAVE`); varauksen muokkaajan nimi (`modifiedBy`) | Lasten, myös **sairauspoissaolot**; toisen huoltajan tai työntekijän nimi |
| `ABSENCES_READ` | `GET /citizen/absence-application?childId=…` | Poissaolohakemukset: jakso, vapaa perustelu, tekijän nimi, tila, päättäjän nimi, hylkäyksen perustelu | Lasten; toisen huoltajan (tekijä); työntekijän (päättäjä); vapaata tekstiä |
| `HOLIDAY_PERIODS_READ` | `GET /citizen/holiday-period`, `GET /citizen/holiday-period/questionnaire` | Loma-ajat ja avoin lomakysely aiempine vastauksineen | Lasten; vastauksen voi olla antanut toinen huoltaja |
| `NOTIFICATIONS_READ` | `GET /citizen/daily-service-time-notifications`, `GET /citizen/child-documents/unread-count`, `GET /citizen/pedagogical-documents/unread-count` | Hoitoaikailmoitusten tunnisteet ja lukemattomien asiakirjojen lukumäärät lapsittain (ei asiakirjojen nimiä tai tyyppejä) | Lasten (lukumäärät) |
| `NOTIFICATIONS_DISMISS` | `POST /citizen/daily-service-time-notifications/dismiss` | Hoitoaikailmoituksen kuittaus (kirjoitus) | – |
| `MESSAGES_READ` | `GET /citizen/messages/my-account`, `GET /citizen/messages/received`, `GET /citizen/messages/recipients`, `GET /citizen/messages/unread-count` | Viestiketjut sisältöineen, lähettäjineen ja liitteiden nimineen; vastaanottajat ja henkilöstön poissaolojaksot; lukemattomien määrä. Arkaluonteiseksi merkitty ketju tulee ilman sisältöä | Sinun; **toisen huoltajan** (kaikki huoltajat ovat samassa ketjussa); lasten; henkilöstön |
| `MESSAGES_MARK_READ` | `PUT /citizen/messages/threads/{threadId}/read` | Ketjun merkitseminen luetuksi (kirjoitus). Sammuttaa lukematon-merkin ja sähköposti-ilmoituksen | – |
| `ATTACHMENTS_READ` | `GET /citizen/attachments/{attachmentId}/download/{requestedFilename}` | Viestien liitteiden lataus | Kenen tahansa ketjun osapuolen |

Pyydä vain ne oikeudet, joita ohjelmasi käyttää: esimerkkisovellus pyytää neljä (`CALENDAR_READ`, `RESERVATIONS_READ`, `MESSAGES_READ`, `MESSAGES_MARK_READ`). Kaksi kirjoitusoikeutta ovat kuittauksia: mitään ei luoda, peruta, lähetetä tai arkistoida. `PUT …/last-received-message/read` ei kuulu `MESSAGES_MARK_READ`-oikeuteen, koska se merkitsee viestin *lukemattomaksi*.

**Mitä avain ei voi koskaan tehdä**, myönnetyistä oikeuksista riippumatta: kaikkea, mitä taulukossa ei ole. Muun muassa hakemukset, päätökset, tuloselvitykset, lapsen asiakirjat ja niiden luettelo, perheenjäsenten tiedot, lasten kuvat, varausten ja poissaolojen teko, viestien lähetys ja arkistointi, henkilötietojen muutokset, salasanan, passkeyn ja sovellusavainten hallinta sekä kirjautuminen vastaavat aina 403. Tunnistautumista vaatimattomat `/citizen/public/*`-osoitteet toimivat avaimen kanssa ja ilman.

Avain tunnistautuu aina heikosti, ja taulukkoon otetaan vain päätepisteitä, jotka palvelin hyväksyy heikolta tunnistautumiselta: jos oikeus on myönnetty, sen päätepisteet myös vastaavat. Yksi poikkeus on `ATTACHMENTS_READ`, ja se on pysyvä: liitteen lataus tarkistaa oikeuden liitteen *kohteen* mukaan, ja kaikki muut kohteet kuin viesti — hakemus, tuloselvitys, pedagoginen dokumentti — vaativat vahvan tunnistautumisen. Avaimella voi siis ladata vain viestien liitteet; muut vastaavat 403 riippumatta myönnetyistä oikeuksista. Ne ovat kuitenkin aineistoja, joita avain ei muutenkaan tavoita.

## 5. Virheiden käsittely

| Tilanne | HTTP | Vastaus | Mitä ohjelman pitää tehdä |
| --- | --- | --- | --- |
| Avain vanhentunut, peruttu, tuntematon tai väärän muotoinen | 401 | `{ "error": "INVALID_TOKEN" }` | **Lopeta.** Poista avain käytöstä ja pyydä käyttäjältä uusi. Älä yritä uudelleen. |
| Oikeutta ei ole myönnetty tai päätepiste ei ole avaimella käytettävissä | 403 | `{ "error": "INSUFFICIENT_SCOPE", "requiredScope": "MESSAGES_MARK_READ" }` | Kerro puuttuva oikeus (`requiredScope`; puuttuu, jos päätepiste ei ole lainkaan avainten tavoitettavissa). Älä yritä uudelleen samalla avaimella. |
| Liian monta pyyntöä (oletus 60/min avainta kohti) | 429 | `{ "error": "RATE_LIMITED" }` + `Retry-After`-otsake | Odota `Retry-After`-sekunnit ja harvenna pollausta. |
| Sovellusavaimet eivät ole käytössä tässä kunnassa | 401 avainpyynnöissä, 404 avainten hallinnassa | `{ "error": "INVALID_TOKEN" }` | Ominaisuus on kytketty pois; avainpyyntö ei erota tätä perutusta avaimesta. Tarkista manifesti ja ota yhteys kuntaan. |
| Sovellusavaimet pysäytetty häiriön ajaksi | 503 | `{ "error": "API_TOKENS_DISABLED" }` | Tilapäistä; yritä myöhemmin uudelleen kasvavalla viiveellä. |
| Palvelinvirhe tai yhteysongelma | 5xx / – | vaihtelee | Yritä uudelleen kasvavalla viiveellä, enintään muutaman kerran. |

401 tarkoittaa aina, että **avain itse** on kelvoton eikä uudelleenyritys koskaan korjaa sitä. Esimerkkisovellus poistaa avaimen palvelimelta heti ensimmäisen 401:n jälkeen ja palauttaa käyttäjän käyttöönottonäkymään.

## 6. Ajossa olevan version selvittäminen

Jokainen kunta ajaa omaa eVaka-versiotaan omaan tahtiinsa, eikä kuntalaisen rajapinta ole vakaa sopimus. Kysy siksi instanssilta itseltään: tunnistautumista vaatimaton `GET /api/citizen/public/api-manifest` palauttaa ajossa olevan version (`apiVersion`), avaimen etuliitteen (`tokenPrefix`), myönnettävät oikeudet (`scopes`), jokaisen oikeuden päätepisteet (`scopeEndpoints`) ja jokaisen kuntalaisen päätepisteen oikeuksineen (`endpoints`; `null` tarkoittaa, ettei päätepiste ole minkään avaimen tavoitettavissa). Tarkista se käyttöönotossa ja aina, kun saat odottamattoman 403:n tai 404:n. Pelkän commit-tunnisteen saa myös osoitteesta `GET /api/version`.

## 7. Kohteliaisuussäännöt

Älä pollaa tiheämmin kuin tarpeen — 15 minuutin väli riittää useimpiin tarkoituksiin. Avain tarkistetaan palvelimella jokaisella pyynnöllä, joten peruutus ja vanheneminen tehoavat heti; "Viimeksi käytetty" -aika päivittyy 5 minuutin tarkkuudella. Anna ohjelmallesi kuvaava nimi jo avainta luodessasi: nimi on samalla ilmoitus siitä, mihin tarkoitukseen tietoja haet.

## 8. Jos avain vuotaa

1. Peru avain heti: **Omat tiedot → Sovellusavaimet → Peru** — vaikutus on välitön.
2. Luo uusi avain, mieluiten suppeammilla oikeuksilla.
3. Päivitä avain ohjelmaasi ja selvitä, mistä vanha pääsi vuotamaan.

Peruttu avain ei ole enää kenenkään käytettävissä, eikä sen peruminen vaadi salasanan vaihtoa. Jos et enää käytä ohjelmaa, peru avain silloinkin: pelkkä poistaminen ohjelmasta ei mitätöi sitä eVakassa.

## 9. Mistä vastaat

Kunta ei hyväksy, rekisteröi eikä valvo ohjelmaasi: se on sinun välineesi, ja kun tiedot ovat siirtyneet ohjelmalle, niiden käsittely on sinun ja ohjelman ylläpitäjän asia, ei kunnan. Muista, että mukana on muidenkin ihmisten tietoja: lastesi tiedot, mukaan lukien sairauspoissaolot ja hakemusten perustelut, lapsen toisen huoltajan viestit ja nimi sekä henkilöstön nimet ja poissaolot. Viesteissä ja perusteluissa on vapaata tekstiä, joka voi sisältää mitä tahansa kirjoittaja on halunnut kertoa. Mieti siksi ennen kuin syötät vastauksia pilvipalveluun tai tekoälyavustimeen, tallenna vain se, mitä ohjelmasi tarvitsee, ja poista tiedot, kun et enää tarvitse niitä. Jos jaat ohjelmasi muille, heidän avaimensa hakevat heidän näkymänsä, ja vastuu siirtyy heille samalla tavalla.
