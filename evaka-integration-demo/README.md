<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# eVaka-integraatiodemo

Esimerkkisovellus, joka käyttää eVakan kansalaisrajapintaa **sovellusavaimella**
(citizen API token). Demo on tarkoitettu näytettäväksi: se havainnollistaa, mitä
rajatuilla oikeuksilla voi ja mitä ei voi tehdä.

Sovellus on tarkoituksella pieni ja riippuvuuksiltaan kevyt: Node + TypeScript,
Express, ja selainpuolella pelkkää HTML:ää, CSS:ää ja JavaScriptiä. Käännösvaihetta
ei ole — Node ajaa `.ts`-tiedostot suoraan.

## Mitä tämä demonstroi

1. **Sovellusavain riittää — käyttäjätunnuksia ei tarvita.** Demo ei tunne
   eVaka-salasanaa eikä istuntoevästeitä. Se lähettää tavallisen HTTP-pyynnön,
   jossa on `Authorization: Bearer evaka_pat_…`.
2. **Oikeudet ovat rajattuja ja tarkistettavissa.** Käyttöönotto-näkymä kokeilee
   jokaista pyydettyä oikeutta oikealla rajapintakutsulla ja kertoo, mitkä niistä
   todella toimivat.
3. **Avain on aina heikompi kuin tunnukset.** Avaimella ei pääse vaihtamaan
   salasanaa, hallitsemaan passkey-tunnisteita eikä luomaan uusia avaimia — nämä
   ovat api-gw:n ei-myönnettävien polkujen listalla.
4. **eVaka ei tarvitse omaa iCal-rajapintaa.** Kalenteri-näkymän .ics-tiedosto
   syntyy kokonaan tässä demossa kahdesta tavallisesta kutsusta
   (`GET /citizen/calendar-events` ja `GET /citizen/reservations`). Kun rajapinta on
   yleiskäyttöinen ja oikeudet rajattuja, erikoistarkoituksiin tehtyjä rajapintoja
   ei tarvitse rakentaa, versioida eikä suojata erikseen.
5. **Kirjoitusoikeus on eri asia kuin lukuoikeus.** Viestin merkitseminen luetuksi
   (`PUT /citizen/messages/threads/{id}/read`) vaatii oikeuden `messages:mark-read`.
6. **Puuttuva oikeus näkyy heti.** Painike *Kokeile ilman oikeutta* kutsuu
   lasten tietojen rajapintaa `GET /citizen/children`, jota demo ei pyytänyt. Rajapinta on
   olemassa ja toimisi oikealla oikeudella (`children:read`) — tämä avain vain ei sitä saanut —
   ja demo näyttää raa'an `403 INSUFFICIENT_SCOPE` -vastauksen sellaisenaan.
7. **Arkaluonteinen sisältö pysyy piilossa.** Sovellusavain tunnistautuu heikosti
   tunnistautuneena kansalaisena, joten eVaka palauttaa arkaluonteiset viestiketjut
   vain redaktoituna.

## Tarvittavat oikeudet

Luo avain, jolle myönnät täsmälleen nämä oikeudet:

| Oikeus | Mihin demo käyttää sitä |
| --- | --- |
| `calendar:read` | Kalenteritapahtumat ja keskusteluajat |
| `reservations:read` | Hoitoajat ja poissaolot |
| `messages:read` | Saapuneiden viestiketjujen listaus ja lukeminen |
| `messages:mark-read` | Viestiketjun merkitseminen luetuksi |

Demo toimii myös vajailla oikeuksilla: puuttuva oikeus näkyy varoituksena eikä
kaada näkymää. Näin kannattaa jokaisen integraation toimia.

## Avain säilyy vain demopalvelimella

Liitetty avain kirjoitetaan tiedostoon `.token` tämän hakemiston juureen
(oikeuksin `0600`). Tiedosto on `.gitignore`ssa.

**Selain ei koskaan näe avainta.** Selainpuoli kutsuu ainoastaan tämän demon omia
osoitteita (`/api/...`), eikä avain kulje niissä missään muodossa. Näin avain ei ole
luettavissa `localStorage`sta, selaimen muistista eikä kehitystyökaluista, eikä
XSS-haavoittuvuus riitä sen varastamiseen. Sama pätee oikeaan integraatioon: avain
kuuluu palvelimelle, ei selaimeen.

Kun lopetat demon käytön, poista avain painikkeella *Poista avain* ja **mitätöi se
myös eVakassa** kohdasta Omat tiedot → Sovellusavaimet. Avaimen poistaminen
demopalvelimelta ei mitätöi sitä eVakassa.

## Käynnistys

Tämä demo on omassa repositoriossaan, erillään eVakan ydinrepositoriosta
([espoon-voltti/evaka](https://github.com/espoon-voltti/evaka)). Se on tarkoitettu
ajettavaksi eVakan paikallista kehitysympäristöä vasten, joten tarvitset molemmat
repositoriot koneellasi vierekkäin (tai muualla — polku ei ole tärkeä, kunhan tiedät
sen).

### 1. Käynnistä eVakan paikallinen kehitysympäristö

Kloonaa [espoon-voltti/evaka](https://github.com/espoon-voltti/evaka) ja seuraa
ohjeita [`compose/README.md`](https://github.com/espoon-voltti/evaka/blob/master/compose/README.md).
Kun ympäristö on pystyssä, api-gw kuuntelee portissa `3000` ja kansalaiskäyttöliittymä
portissa `9099`.

### 2. Käynnistä demo

```sh
cd evaka-integration-demo
npm install
npm start
```

Demo avautuu osoitteeseen <http://localhost:3100>.

Vaatii Node 22.18+ tai 24+ (Node ajaa `.ts`-tiedostot ilman käännösvaihetta).

### 3. Luo sovellusavain eVakassa

1. Kirjaudu eVakaan osoitteessa <http://localhost:9099>
2. Avaa **Omat tiedot**
3. Valitse **Sovellusavaimet**
4. Luo uusi avain ja myönnä sille yllä luetellut neljä oikeutta
5. Kopioi avain — eVaka näyttää sen vain kerran
6. Liitä avain demon Käyttöönotto-näkymään

### Ympäristömuuttujat

| Muuttuja | Oletus | Merkitys |
| --- | --- | --- |
| `PORT` | `3100` | Demon oma portti |
| `EVAKA_API_URL` | `http://localhost:3000/api` | eVakan api-gw:n kansalaisrajapinnan osoite |
| `EVAKA_CITIZEN_URL` | `http://localhost:9099` | Kansalaiskäyttöliittymä, johon käyttöönotto-ohje linkittää |

## Näkymät

### 1. Käyttöönotto

Kertoo suomeksi, mitä sovellus tekee ja mitä oikeuksia se tarvitsee, ja opastaa
avaimen luomisessa. Liitetty avain tarkistetaan kutsumalla eVakan oikeita
rajapintoja, ja jokaisen oikeuden tulos näytetään taulukossa kutsuosoitteineen.

Kirjoitusoikeus `messages:mark-read` tarkistetaan kutsumalla viestiketjua, jota ei ole
olemassa. Oikeustarkistus tapahtuu api-gw:ssä ennen kuin pyyntö etenee eVakan
palveluun, joten kutsu vastaa kysymykseen "olisiko tämä sallittu" ilman mitään
sivuvaikutusta.

Samassa näkymässä on painike **Kokeile ilman oikeutta**, joka kutsuu tarkoituksella
rajapintaa `GET /citizen/children` ja näyttää vastauksen sellaisenaan. Rajapinta on
kansalaisrajapinnan sallittulistalla (`children:read`), mutta tämä demo ei ole koskaan
pyytänyt sitä oikeutta, joten kutsu osoittaa aidon, puuttuvasta oikeudesta johtuvan eston —
ei sitä, että rajapintaa ei olisi lainkaan avattu sovelluksille.

### 2. Kalenteri

Kuukausinäkymä hoitoajoista, poissaoloista ja kalenteritapahtumista, sekä
.ics-lataus. Kuukautta vaihdetaan nuolipainikkeilla.

### 3. Viestit

Saapuneet viestiketjut, ketjun avaaminen ja sen merkitseminen luetuksi. Vastaus
`PUT`-kutsuun näytetään sellaisenaan, jotta kirjoitusoikeuden käyttö on nähtävissä.

## Virhetilanteet

| Tilanne | Miten demo käyttäytyy |
| --- | --- |
| eVaka ei ole käynnissä | Selkeä virheilmoitus osoitteineen; sovellus ei kaadu |
| Avain on väärän muotoinen | Hylätään heti, ilman kutsua eVakaan |
| Avain on mitätöity tai vanhentunut (HTTP 401) | Avain poistetaan demopalvelimelta ja käyttäjä palautetaan käyttöönottoon selkeällä viestillä |
| Oikeutta ei ole myönnetty (HTTP 403) | Näkymä kertoo, mikä oikeus puuttuu, ja jatkaa muilta osin |

## Kehitys

```sh
npm run typecheck   # tsc --noEmit
npm run dev         # node --watch
```

## Rakenne

```
src/config.ts        asetukset ja pyydetyt oikeudet
src/token-store.ts   avaimen tallennus .token-tiedostoon
src/evaka-client.ts  HTTP-asiakas eVakan kansalaisrajapintaan
src/api-types.ts     käytettyjen rajapintavastausten tyypit
src/ics.ts           .ics-kalenterin muodostus (RFC 5545)
src/server.ts        Express-palvelin ja demon oma rajapinta
public/              selainkäyttöliittymä (HTML, CSS, JS)
```

Demo ei ole osa eVakan tuotantokoodia eikä sitä rakenneta CI:ssä.
