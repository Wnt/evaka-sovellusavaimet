<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Sovellusavaimet: aineisto vaikutustenarviointiin

Kohdeyleisö: tietosuojavastaava ja kunnan DPIA-kokous. Tekninen tietoturva-arvio on erikseen ([tietoturva-arvio.md](tietoturva-arvio.md)); tähän sitä ei toisteta.

## 1. Mistä on kyse

Kuntalainen voi antaa valitsemalleen ohjelmalle (esimerkiksi kalenterisovellukselle) rajatun, määräaikaisen ja peruutettavan pääsyn omiin eVaka-tietoihinsa. Pääsy annetaan **sovellusavaimella**, jonka kuntalainen luo itse, jonka sisällön hän itse valitsee ja jonka hän voi milloin tahansa perua. Avaimella tavoitettavat tiedot on lueteltu nimenomaisesti, ja kaikki muu on sen ulottumattomissa riippumatta siitä, mitä kuntalainen valitsee. Avain ei koskaan yllä laajemmalle kuin kuntalainen itse, ja se voi lähes yksinomaan lukea: ainoat kaksi muutosta, jotka sillä voi tehdä, ovat viestin ja ilmoituksen kuittaaminen luetuksi. Kunta päättää itse, otetaanko ominaisuus käyttöön.

**Ominaisuus ei luo uutta henkilötietojen luovutusta.** Kuntalaisella on jo pääsy näihin tietoihin, ja moni luovuttaa ne ohjelmalle jo nyt antamalla sille koko eVaka-tunnuksensa. Se luovutus on rajaamaton, ikuinen, näkymätön ja peruttavissa vain salasanaa vaihtamalla. Sovellusavain kaventaa tämän olemassa olevan, hallitsemattoman luovutuksen rajatuksi, määräaikaiseksi ja peruutettavaksi. DPIA:n kysymys ei siis ole "saako näitä tietoja luovuttaa", vaan "onko rajattu avain paremmin hallittu tapa tehdä se, mitä jo tapahtuu".

## 2. Mitä avaimella voi nähdä ja mitä ei

| Avaimella voi nähdä (kuntalaisen valinnan mukaan) | Avaimella ei koskaan voi |
| --- | --- |
| Läsnäolovaraukset ja poissaolohakemukset | Nähdä hakemuksia, tuloselvityksiä, päätöksiä eikä maksupäätöksiä |
| Kalenterimerkinnät, yksiköiden tiedot ja lomakausikyselyt | Nähdä lapsen asiakirjoja, pedagogisia dokumentteja eikä valokuvia |
| Viestit henkilöstön kanssa ja niiden liitteet | Nähdä puolison tietoja |
| Lasten nimet, ryhmä ja yksikkö, palveluntarpeet ja läsnäoloyhteenvedot | Tehdä varauksia, lähettää viestejä, muuttaa henkilötietoja tai irtisanoa varhaiskasvatuspaikkaa |
| Ilmoitukset sekä lukemattomien viestien ja asiakirjojen lukumäärät | Vaihtaa salasanaa eikä kirjautumistapoja: tiliä ei voi ottaa haltuun |
| Omat ilmoitusasetukset ja sähköpostin vahvistustila | Luoda, muuttaa tai perua sovellusavaimia |

## 3. Lasten tiedot: dokumentin tärkein kohta

Ohjelman on voitava kertoa, **kenen lapsen** viestistä, kalenterimerkinnästä tai asiakirjailmoituksesta on kyse. Siksi avaimelle voi sallia lasten nimet, ryhmän ja yksikön sekä lapsikohtaiset lukumäärät ("kaksi täyttämätöntä asiakirjaa"). Raja on vedetty tähän: **lukumäärät ja nimet kyllä, asiakirjojen tyypit ja sisältö ei.** Pelkkä asiakirjan tyyppi voi paljastaa lapsesta arkaluonteista tietoa, esimerkiksi tuen suunnitelman olemassaolon, joten sitäkään ei näytetä. Lapsen valokuvat, arvioinnit ja asiakirjat sekä puolison tiedot eivät ole avaimen ulottuvilla lainkaan. Huoltaja käyttää lapsen puhevaltaa, mutta lapsen nimen ja hoitopaikan luovuttaminen ulkopuoliselle ohjelmalle on eri asia kuin niiden katsominen eVakassa. Emme väitä tietävämme, riittääkö huoltajan suostumus tässä: **asia on kokouksen ratkaistava.** Tekniikka rajaa luovutuksen näihin tietoihin, muttei ratkaise sitä, riittääkö suostumus.

## 4. Suostumus

| Kysymys | Vastaus |
| --- | --- |
| Kuka luovuttaa ja kenelle | Kuntalainen itse, valitsemalleen ohjelmalle, omista tiedoistaan |
| Miten suostumus annetaan | Kuntalainen tunnistautuu vahvasti (Suomi.fi-tunnistus), valitsee mitä sallii ja kuinka pitkäksi aikaa |
| Kuinka kauan | Kuntalainen valitsee, enintään puoli vuotta; sen jälkeen avain lakkaa toimimasta itsestään |
| Miten se näkyy jälkikäteen | Lista omista avaimista: nimi, sallitut tiedot, luonti- ja päättymispäivä sekä milloin avainta on viimeksi käytetty |
| Miten se perutaan | Yksi klikkaus, vaikutus välitön. Peruminen on helpompaa kuin antaminen |

Suostumus koskee luovuttamista ohjelmalle; kunnan oma käsittely ei muutu. Ohjelman tekemisistä vastaa sen ylläpitäjä, ei kunta. **Emme ota kantaa siihen, mikä tietosuoja-asetuksen oikeusperuste tähän soveltuu.** Kyse on lähempänä sitä, että rekisteröity käyttää omaa pääsyoikeuttaan valitsemallaan välineellä, kuin kunnan luovutusta kolmannelle, mutta sen vahvistaminen kuuluu kokoukselle.

**Suostumuksen laajuus ei kasva ajan myötä.** Jos eVakaan lisätään myöhemmin uusi toiminto, se ei tule avaimen ulottuville itsestään, vaikka se kuuluisi jo annetun luvan aihepiiriin: uusi toiminto on avaimilta suljettu, kunnes joku lisää sen luetteloon tarkoituksella, ja lisäys katselmoidaan. Kuntalaisen antama lupa tarkoittaa siis täsmälleen sitä, mitä se tarkoitti antohetkellä.

## 5. Mitä ominaisuus itse tallentaa

Kuntalaisen avaimelle antama nimi, sallitut tiedot, luonti- ja päättymisaika sekä viimeisin käyttöaika. **Itse avainta ei tallenneta**: se näytetään kuntalaiselle kerran, eikä sitä voi jälkikäteen lukea edes kunnan järjestelmästä. Uusia tietoja kuntalaisesta tai lapsista ei synny. Tiedot poistuvat kuntalaisen muiden tietojen mukana; peruutetun tai vanhentuneen avaimen tiedot poistetaan automaattisesti 90 vuorokauden kuluttua (kysymys 4). Rajoitus: "viimeksi käytetty" kertoo, milloin avainta käytettiin, ei mitä sillä luettiin. Sekin on enemmän kuin nykytilassa, jossa kuntalainen ei näe mitään.

## 6. Jäljitettävyys

Kunta näkee lokeistaan, että pyynnön teki ohjelma eikä ihminen, ja millä avaimella. **Nykytilassa tätä erottelua ei ole lainkaan:** kuntalaisen tunnuksilla toimiva ohjelma näyttää lokissa kuntalaiselta itseltään. Avaimen luonti, käyttö ja peruutus kirjataan, ja avaimen tunniste kulkee jokaisen pyynnön mukana lokiin asti.

## 7. Riskit

| Riski | Miten se on hoidettu |
| --- | --- |
| Avain joutuu vääriin käsiin | Pääsy vain lueteltuihin ja sallittuihin tietoihin, vanhenee itsestään, peruttavissa heti, tiliä ei voi ottaa haltuun. Vahinko on pienempi kuin salasanan vuodossa |
| Kuntalainen sallii enemmän kuin tarvitsee | Oletuksena vain lukuoikeudet; kaksi kuittausoikeutta on korostettu erikseen |
| Unohtunut avain jää voimaan | Pakollinen vanheneminen; lista ja "viimeksi käytetty" tekevät käyttämättömän avaimen näkyväksi |
| Lasten tiedot ilman lapsen suostumusta | Vain nimet, hoitopaikka ja lukumäärät; asiakirjat, arvioinnit ja valokuvat eivät ole avaimen ulottuvilla; avoin kysymys, luku 3 |
| Varastetulla avaimella vaimennetaan kuntalaisen ilmoitukset | Ilmoitusasetuksia ei voi avaimella muuttaa, vain lukea |

## 8. Kokouksen ratkaistavaksi

1. **Lasten tiedot.** Riittääkö huoltajan suostumus lasten nimien, ryhmän, yksikön ja palveluntarpeiden luovuttamiseen ohjelmalle?
2. **Oikeusperuste.** Onko kyse rekisteröidyn oman pääsyoikeuden käyttämisestä vai kunnan luovutuksesta kolmannelle? Ratkaisee, mitä asiakirjoja päivitetään.
3. **Suostumuksen kesto.** Onko puoli vuotta hyväksyttävä enimmäisaika? Vanhennetaanko pitkään käyttämätön avain automaattisesti?
4. **Säilytysaika.** Peruutetun ja vanhentuneen avaimen tiedot (nimi, sallitut tiedot, ajat) poistetaan 90 vuorokauden kuluttua. Onko aika sopiva: riittävä väärinkäytön selvittämiseen, ei pidempi kuin tarpeen?
5. **Dokumentointi ja viestintä.** Vaatiiko ominaisuus merkinnän selosteeseen käsittelytoimista tai tietosuojaselosteeseen? Miten kuntalaiselle kerrotaan, ettei kunta vastaa ohjelman tekemisistä?
