<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# eVakan sovellusavaimet

Kuntalainen voi antaa valitsemalleen ohjelmalle rajatun, määräaikaisen ja peruutettavan pääsyn
**omiin** eVaka-tietoihinsa — ilman että hän luovuttaa eVaka-tunnuksiaan. Tämä repositorio
kokoaa hyväksyntämateriaalin, jonka kunta tarvitsee ominaisuudesta päättäessään, sekä
esimerkkisovelluksen, joka näyttää, mitä ominaisuus mahdollistaa. Perustelut: [päätösesitys](paatosesitys.md).

Itse toteutus elää [eVakan ydinrepositoriossa](https://github.com/espoon-voltti/evaka); tästä
repositoriosta löytyvät vain päätöksentekoon tarvittavat dokumentit ja esimerkki, ei tuotantokoodia.

## Dokumentit

| Dokumentti | Kenelle | Sisältö |
| --- | --- | --- |
| [Päätösesitys](paatosesitys.md) | Ohjausryhmä, budjetista päättävät | Ongelma, ratkaisu, kustannus, hyöty, päätösesitys |
| [Tietoturva-arvio](tietoturva-arvio.md) | Tietoturvasta vastaava | Uhkamalli, nykytila vs. muutoksen jälkeen, jäljelle jäävät riskit |
| [DPIA-aineisto](dpia-aineisto.md) | Tietosuojavastaava, DPIA-kokous | Käsiteltävät tiedot, oikeusperuste, rekisteröidyn oikeudet, säilytys |
| [Uhkamalli](uhkamalli.md) | Tietoturvakatselmoija, DPIA | Hyökkääjäasemat, kontrollit ja jäännösriskit taulukkona |
| [Integraattorin opas](integraattorin-opas.md) | Kuntalainen, joka kirjoittaa ohjelman | Avaimen luonti, pyynnön muoto, oikeudet, virheiden käsittely |

Lukemisjärjestys ensi kertaa: **päätösesitys** antaa kokonaiskuvan viidessä minuutissa,
**tietoturva-arvio** perustelut, ja **uhkamalli** yksityiskohdat.

eVakan ydinrepositoriossa pysyvät toteutusta ja ylläpitoa koskevat dokumentit:
[tekninen tiivistelmä](https://github.com/espoon-voltti/evaka/blob/master/docs/sovellusavaimet/tekninen-tiivistelma.md)
ja [vuototilanne ja avainkierto](https://github.com/espoon-voltti/evaka/blob/master/docs/sovellusavaimet/vuototilanne-ja-avainkierto.md).

## Esimerkkisovellus

[`evaka-integration-demo/`](evaka-integration-demo/) on toimiva esimerkkisovellus, joka käyttää
eVakan kansalaisrajapintaa sovellusavaimella. Katso sen oma
[README](evaka-integration-demo/README.md) käynnistysohjeineen.
