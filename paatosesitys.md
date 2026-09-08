<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Sovellusavaimet: päätösesitys

## Päätösesitys

Ohjausryhmää pyydetään päättämään, että

1. kuntalaisen sovellusavaimet viimeistellään tuotantokuntoon (jäljellä oleva työ alla),
2. ominaisuus julkaistaan kuntakohtaisen asetuksen takana, oletuksena pois päältä,
3. kukin kunta päättää käyttöönotosta oman DPIA-käsittelynsä jälkeen.

Kysymys ei ole "avataanko rajapinta". Kuntalaiset käyttävät rajapintaa jo omilla ohjelmillaan ja omilla tunnuksillaan. Kysymys on, annetaanko heille **kapeampi vaihtoehto sille, mitä he jo tekevät leveämmällä valtuudella**.

## Nykytila ja ratkaisu

Kuntalaiset rakentavat integraatioita eVakaan jo nyt. Koska tuettua tapaa ei ole, ohjelmalle annetaan kuntalaisen eVaka-salasana. Sovellusavain on kuntalaisen itse luoma, rajattu ja määräaikainen tunnus, jonka hän näkee ja voi perua eVakan asetuksissa. Avaimella tavoittaa vain erikseen luetellut 25 toimintoa 116:sta: ei hakemuksia, päätöksiä, tuloselvityksiä, lapsen asiakirjoja eikä tunnusten hallintaa, ja muutoksia se voi tehdä kaksi (viestin ja ilmoituksen kuittaus luetuksi). Kumpikaan tunnus ei mahdollista tilin haltuunottoa; ero on laajuudessa, kestossa, näkyvyydessä ja peruutettavuudessa.

| | Salasana (nykytila) | Sovellusavain |
| --- | --- | --- |
| Laajuus | Kaikki 27 heikon tunnistautumisen toimintoa | Vain myönnetyt oikeudet 11:stä; esimerkkisovellus (kalenteri ja viestit) tarvitsee 4 |
| Vanheneminen | Ei koskaan | Pakollinen, enintään 180 vrk |
| Peruutus | Salasanan vaihto vahvasti tunnistautuneena; katkaisee oman kirjautumisen | Yksi avain pois, muu jatkaa |
| Näkyy kuntalaiselle | Ei mitenkään | Lista, oikeudet ja "viimeksi käytetty" |

Tietoturvaperustelut ja jäljelle jäävät riskit: [tietoturva-arvio](tietoturva-arvio.md). Tietosuoja: [DPIA-aineisto](dpia-aineisto.md).

## Kustannus

| | |
| --- | --- |
| Tehty | Toimiva toteutus ja esimerkkisovellus: **noin 1 400 riviä ylläpidettävää ydinkoodia** (api-gw ja service) ja yksi tietokantataulu; lisäksi käyttöliittymä (noin 750 riviä) ja testit (noin 2 100 riviä). Sallittujen toimintojen luettelo on yksi taulukko koodissa; siitä generoitua luetteloa (noin 560 riviä) ei ylläpidetä käsin, ja CI hylkää muutoksen, jos luettelo ei vastaa koodia. Hallintanäkymä, kutsurajoitus, kuntakohtainen asetus, häiriökytkin, siivousajo, servicen toinen valvontakerros ja rajapintamanifesti ovat valmiit. |
| Ylläpito | Uusi eVakan toiminto ei ole avainten ulottuvilla ennen kuin joku lisää sen luetteloon tarkoituksella. Vain tietoinen avaaminen maksaa rivin, ja se näkyy katselmoinnissa. |
| Jäljellä | E2E-testien ensimmäinen ajo ja sen paljastamat korjaukset; katselmointipalautteen käsittely. Lapsikohtaista rajausta ei tehdä ensimmäiseen versioon (uhkamalli, kohta 2). |
| Työmäärä | **1–2 henkilötyöviikkoa kehitystyötä.** Arvio, ei mittaus: rakennettavia osia ei ole jäljellä, vaan yhden kehittäjän testiajo- ja korjauskierros sekä katselmoinnin löydösten käsittely, jolle on varattu toinen viikko. Ei sisällä tietoturvakatselmointia itseään, DPIA-käsittelyä eikä kuntien käyttöönottoa. |

## Vaihtoehdot

- **Ei tehdä mitään:** integraatiot jatkuvat salasanoilla, joista jokainen antaa kaikki 27 toimintoa ilman vanhenemista, näkyvyyttä tai erillistä peruutusta.
- **Täysi OAuth-valtuutuspalvelin:** tarvitaan vasta, kun sovellukset haluavat pääsyn *muiden ihmisten* tietoihin; vaatii asiakasrekisterin, suostumusnäytön ja paljon suuremman DPIA-pinnan. Sovellusavain on sen kanssa yhteensopiva askel.

## Käyttöönotto

1. **Kehitys:** jäljellä oleva työ 1–2 henkilötyöviikkoa päätöksestä, sen jälkeen katselmointi.
2. **Julkaisu:** kuntakohtainen asetus oletuksena pois päältä. Kunnille, jotka eivät ota ominaisuutta käyttöön, mikään ei muutu.
3. **Kunta:** oma DPIA-käsittely, asetus päälle, viestintä kuntalaisille. Kunnan aikataulu, ei tuotekehityksen.
