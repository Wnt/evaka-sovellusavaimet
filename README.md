<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# eVakan sovellusavaimet

Kuntalainen voi antaa valitsemalleen ohjelmalle rajatun, määräaikaisen ja peruutettavan pääsyn omiin eVaka-tietoihinsa luovuttamatta eVaka-tunnuksiaan. Tämä repositorio kokoaa hyväksyntämateriaalin, jonka kunta tarvitsee ominaisuudesta päättäessään, sekä esimerkkisovelluksen. Toteutus elää [eVakan ydinrepositoriossa](https://github.com/espoon-voltti/evaka); täällä ei ole tuotantokoodia.

Aineisto kertoo suoraan, mitä avain tavoittaa: myös lapsen toisen huoltajan viestit ja merkinnät sekä lapsen sairauspoissaolot kulkevat avaimen kautta. Rajausta ei ole kavennettu dokumenttien helpottamiseksi vaan ohjelman tarpeen mukaan, ja samat tiedot kerrotaan kuntalaiselle avainta luotaessa ja toiselle huoltajalle sähköpostilla.

## Dokumentit

| Dokumentti | Kenelle | Sisältö |
| --- | --- | --- |
| [Päätösesitys](paatosesitys.md) | Ohjausryhmä, päättävä viranhaltija | Ongelma, ratkaisu, kustannus, vaihtoehdot ja allekirjoitettava päätösluonnos |
| [DPIA-aineisto](dpia-aineisto.md) | Tietosuojavastaava, DPIA-kokous | Tuotetason vaikutustenarviointi: kenttätason tietoluettelo, oikeudellinen arvio, kunnan täydennettävä sivu |
| [Tietoturva-arvio](tietoturva-arvio.md) | Tietoturvasta vastaava | Kannattaako muutos: vertailukohta, luottamusmalli, mitä avain paljastaa, jäljelle jäävät riskit |
| [Uhkamalli](uhkamalli.md) | Tietoturvakatselmoija | Hyökkääjäasemat, kontrollit ja jäännösriskit koodista luettuna |
| [Integraattorin opas](integraattorin-opas.md) | Kuntalainen, joka kirjoittaa ohjelman | Avaimen luonti, pyynnön muoto, oikeudet kenttätasolla, virheet, vastuu |
| [Lokikyselyt](lokikyselyt/) | Kunnan lokeista vastaava, päätösesityksen valmistelija | Valmiit CloudWatch- ja OpenSearch-kyselyt, joilla kunta mittaa omista lokeistaan, kuinka suuri osa kuntalaisrajapinnan liikenteestä tulee ohjelmilta |

Lukemisjärjestys ensi kertaa: **päätösesitys** antaa kokonaiskuvan viidessä minuutissa, **DPIA-aineisto** oikeudellisen perustan ja **uhkamalli** tekniset yksityiskohdat. Ydinrepositoriossa pysyvät [tekninen tiivistelmä](https://github.com/espoon-voltti/evaka/blob/master/docs/sovellusavaimet/tekninen-tiivistelma.md) ja [vuototilanne ja avainkierto](https://github.com/espoon-voltti/evaka/blob/master/docs/sovellusavaimet/vuototilanne-ja-avainkierto.md).

## Esimerkkisovellus

[`evaka-integration-demo/`](evaka-integration-demo/) on toimiva esimerkkisovellus, joka lukee kalenterin ja viestit sovellusavaimella. Käynnistysohjeet ovat sen omassa [README-tiedostossa](evaka-integration-demo/README.md).
