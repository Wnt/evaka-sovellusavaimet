<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Sovellusavaimet: tuotetason vaikutustenarviointi

Kohdeyleisö: tietosuojavastaava ja kunnan DPIA-kokous. Tämä on **tuotetason** arviointi: tietosuojatyöryhmän ohjeen WP248 rev.01 mukaan tuotteen käyttöön ottavan rekisterinpitäjän oma arviointi voi perustua tuotteen toimittajan laatimaan vaikutustenarviointiin, ja Kuntaliitto on vahvistanut, ettei yhteisen järjestelmän käyttö tee kunnista yhteisrekisterinpitäjiä. Kunta täydentää luvun 6 sivun, vastaa luvun 7 kysymyksiin ja tekee päätöksen. Tekninen tietoturva-arvio on erikseen.

## 1. Mistä on kyse

Kuntalainen voi antaa valitsemalleen ohjelmalle (esimerkiksi kalenterisovellukselle) rajatun, määräaikaisen ja peruutettavan pääsyn eVaka-tietoihinsa **sovellusavaimella**, jonka hän luo itse vahvasti tunnistautuneena, jonka sisällön hän valitsee ja jonka hän voi milloin tahansa perua. Avain tavoittaa vain nimenomaisesti luetellut tiedot (luku 2); kaikki muu — hakemukset, päätökset, tuloselvitykset, lapsen asiakirjat ja arvioinnit, valokuvat, perheenjäsenten yhteystiedot, tunnusten hallinta — on sen ulottumattomissa valinnasta riippumatta. Avain ei koskaan yllä laajemmalle kuin kuntalainen itse heikosti tunnistautuneena, ja se voi tehdä kaksi muutosta: viestin ja ilmoituksen kuittaus luetuksi. Kunta päättää käyttöönotosta itse.

Nykytila, johon avainta verrataan, ei ole "ei luovutusta": ilman tuettua tapaa kuntalainen antaa ohjelmalle eVaka-salasanansa. Julkisesti dokumentoituja integraatioita on vähintään kolme; kokonaismäärää ei voi tietää, koska salasanalla toimiva ohjelma näyttää lokissa kuntalaiselta itseltään. Salasana antaa kaiken, ei vanhene eikä näy kuntalaiselle. Sovellusavain kaventaa tämän hallitsemattoman luovutuksen rajatuksi, määräaikaiseksi ja peruutettavaksi. Kysymys ei ole "saako näitä tietoja luovuttaa", vaan "onko rajattu avain paremmin hallittu tapa tehdä se, mitä jo tapahtuu".

## 2. Mitä avaimella näkee: tietoluettelo kentittäin

Jokainen oikeus on kuntalaisen valittavissa erikseen. Sarake "Kenen" kertoo, kenen henkilötietoa kenttä on: **kuntalainen** (avaimen luoja), **lapsi**, **toinen huoltaja** (lapsen muu huoltaja, joka ei luonut avainta), **työntekijä**. Vapaa teksti voi sisältää mitä tahansa kirjoittaja on halunnut kertoa, myös terveystietoa, eikä sitä voi luokitella etukäteen. Luettelo on tarkistettu ohjelmakoodin vastaustyypeistä.

| Oikeus | Kentät | Kenen | Vapaa teksti / erityinen henkilötietoryhmä |
| --- | --- | --- | --- |
| Omat tiedot | Sähköpostiosoite, vahvistettu osoite ja viimeisin vahvistuspyyntö; mistä viestityypeistä kuntalainen saa sähköpostia | Kuntalainen | – |
| Lapset | Lapsen etu-, kutsuma- ja sukunimi; ryhmän ja yksikön nimi; sijoitusmuoto (esim. esiopetus, vuorohoito, valmistava opetus) ja alkupäivä; palveluntarve (nimi, sopimuspäivät, jakso, yksikkö); läsnäolopäivien määrä kuukaudessa; mitä toimintoja huoltaja saa lapselle tehdä | Lapsi | Ei vapaata tekstiä. Sijoitusmuoto "valmistava opetus" voi välillisesti viitata lapsen kielitaustaan |
| Kalenteri | Yksikön tapahtumien otsikko ja kuvaus, ajankohta, osallistuvat lapset ryhmineen; varatut keskusteluajat lapsittain, myös kalenteritiedostona; yksiköiden julkiset tiedot; esiopetuksen toimintapäivät lapsittain | Lapsi; työntekijän kirjoittama teksti; keskusteluaika näkyy riippumatta siitä, kumpi huoltaja sen varasi | Työntekijän vapaa teksti |
| Läsnäolovaraukset ja poissaolot | Päivittäin lapsittain: varatut ajat, toteutuneet läsnäolot, käytetty palvelu, kuukausiyhteenvedot; **poissaolon laji, mm. sairauspoissaolo**; varauksen viimeisin muokkaaja nimeltä ja muokkausaika | Lapsi; toinen huoltaja tai työntekijä (nimi) | **Sairauspoissaolo päivän tarkkuudella on terveystieto (tietosuoja-asetuksen 9 artikla)** |
| Poissaolohakemukset | Lapsi nimeltä, jakso, hakemuksen perustelu, tekijän nimi, tila, päättäjän nimi ja aika, hylkäyksen perustelu | Lapsi; toinen huoltaja (tekijä); työntekijä (päättäjä) | Huoltajan ja työntekijän vapaa teksti; perustelu voi sisältää terveystietoa |
| Loma-ajat ja lomakyselyt | Loma-ajat ja määräajat; avoin kysely; lapsittain kyselyyn oikeutetut ajat ja aiemmin annetut vastaukset (lapsen lomajaksot) | Lapsi; vastauksen on voinut antaa kumpi huoltaja tahansa (ilman nimeä) | – |
| Ilmoitukset | Hoitoaikailmoitusten tunnisteet; lukemattomien asiakirjojen ja pedagogisten dokumenttien lukumäärä lapsittain — ei asiakirjojen nimiä, tyyppejä eikä sisältöä | Lapsi (lukumäärä) | – |
| Ilmoitusten kuittaus | Muutos: hoitoaikailmoituksen kuittaus. Ei palauta tietoa | – | – |
| Viestit | Viestiketjut: otsikko, viestien sisältö, lähettäjän ja vastaanottajien nimet (työntekijä, ryhmä, kunta tai toinen huoltaja), aikaleimat, luettu-tila, liitteiden nimet, ketjun lapset nimeltä; hakemukseen liittyvän ketjun hakemuksen tila; vastaanottajaluettelossa henkilöstön nimet ja **poissaolojaksot**; lukemattomien määrä. Arkaluonteiseksi merkityn ketjun sisältö ei näy | Kuntalainen; **toinen huoltaja** (eVaka asettaa lapsen kaikki huoltajat samaan ketjuun); lapsi; työntekijä | Kaikkien osapuolten vapaa teksti |
| Viestin merkitseminen luetuksi | Muutos: ketjun merkintä luetuksi. Sammuttaa lukematon-merkin ja sähköposti-ilmoituksen, jotka ovat ainoat tavat huomata uusi viesti | – | – |
| Liitteet | Viestien liitetiedostot sisältöineen | Kuka tahansa ketjun osapuoli | Vapaa sisältö (kuvat, asiakirjat) |

Yhteenveto: **neljä oikeutta** (kalenteri, varaukset, poissaolohakemukset, viestit) sisältää toisen huoltajan tietoja, **kaksi** (varaukset, poissaolohakemukset) sisältää tai voi sisältää lapsen terveystietoa, ja **viisi** sisältää vapaata tekstiä tai tiedostoja, joita ei voi luokitella etukäteen. Toinen huoltaja ei ole valinnut avaimen oikeuksia eikä voi nähdä tai perua avainta; siksi hänelle lähetetään sähköposti-ilmoitus, kun yhteisen lapsen tietoihin luodaan avain. Ilmoitus nimeää yhteiset lapset ja kertoo, että pääsy voi kattaa yhteisten viestiketjujen viestejä. Avaimen luojalle kerrotaan ennen valintaa samat asiat sekä se, ettei ohjelmalle siirtynyt tieto ole enää kunnan vastuulla.

## 3. Oikeudellinen arvio

**Kuntalainen käyttää omaa tiedonsaantioikeuttaan; ohjelma on hänen välineensä.** Julkisuuslain (621/1999) 12 §:n mukaan jokaisella on oikeus saada tieto hänestä itsestään viranomaisen asiakirjaan sisältyvistä tiedoista, ja tietosuoja-asetuksen 15 artikla antaa rekisteröidylle oikeuden saada pääsy tietoihinsa. Huoltaja käyttää alaikäisen lapsen puhevaltaa. Sovellusavain ei luo uutta luovutusta kolmannelle, vaan on tapa, jolla kuntalainen itse hakee tiedot, jotka hän saa jo eVakasta — samaan tapaan kuin hän voi käyttää mitä tahansa selainta. Rakenne vastaa Yhdysvaltain terveysministeriön (HHS) ja ONC:n terveystiedoille vahvistamaa mallia: kun tieto siirtyy yksilön ohjauksesta hänen valitsemalleen sovellukselle, tiedon luovuttanut taho ei vastaa sen myöhemmästä käytöstä. Se on päättelyä, ei EU-oikeudellinen ennakkotapaus, mutta kysymyksenasettelu on sama.

**Suostumus on väärä linssi.** Ominaisuus ei perustu tietosuoja-asetuksen 6 artiklan 1 kohdan a alakohdan suostumukseen: viranomaiselle annettu suostumus on johdanto-osan 43 kappaleen mukaan lähtökohtaisesti pätemätön epätasapainon vuoksi, eikä lapsi voi antaa suostumusta. Kunnan oma käsittely — tietojen antaminen kuntalaiselle hänen pyynnöstään — perustuu 6 artiklan 1 kohdan e alakohtaan (yleistä etua koskeva tehtävä, varhaiskasvatuslaki 540/2018). Julkisuuslain 26 §:n 1 momentin 2 kohdan mukaan salassa pidettävän tiedon saa antaa, kun se, jonka suojaksi salassapito on säädetty, antaa siihen suostumuksensa; tämä on julkisuuslain käsite, joka koskee salassapidon väistymistä, ei tietosuoja-asetuksen oikeusperuste. Julkisuuslain 13 §:n 2 momentin mukaan salassa pidettävää tietoa pyytävän on ilmoitettava käyttötarkoitus: avaimelle annettava nimi ja oikeuksien valinta ovat tämä ilmoitus, ja ne tallennetaan.

**Ei oikeutta rajapintaan.** Tietosuoja-asetuksen 20 artiklan 3 kohta sulkee siirto-oikeuden ulkopuolelle yleistä etua koskevan tehtävän hoitamisen, joten kuntalaisella ei ole *oikeutta* vaatia rajapintaa. Kunta tarjoaa sen vapaaehtoisesti 15 artiklan pääsyoikeuden toteuttamisen tapana ja sisäänrakennetun tietosuojan (25 artikla) mukaisena vaihtoehtona salasanan luovuttamiselle.

**Tiedonhallintalaki (906/2019) 24 §** säätelee teknisen rajapinnan avaamista muulle kuin viranomaiselle: tiedonsaajalla on oltava oikeus tietoihin, rajapinnan kautta saatavat tiedot on rajattava tarpeellisiin ja tiedonsaaja on tunnistettava. Tässä tiedonsaaja on kuntalainen itse (julkisuuslain 12 §), tiedot on rajattu nimettyyn luetteloon, jonka kuntalainen vielä kaventaa valinnallaan, ja hänet tunnistetaan vahvasti avainta luotaessa.

**Digipalvelulaki (306/2019) 6 §:n 2 momentti** edellyttää vahvaa tunnistamista, kun palvelussa käsitellään salassa pidettäviä tietoja, ellei muuhun ole painavaa perusteltua syytä. Kunta on jo tehnyt tämän harkinnan salliessaan sähköposti- ja salasanakirjautumisen 27 toiminnolle; avain ei koskaan yllä tämän joukon yli, ja arkaluonteiseksi merkityt viestiketjut pysyvät piilossa. Painava perusteltu syy 180 päivän valvomattomalle tunnukselle on: (1) tunnus luodaan vain vahvasti tunnistautuneena ja periytyy siitä tunnistuksesta; (2) vaihtoehto käytännössä on salasana ohjelmassa ilman rajausta, vanhenemista tai näkyvyyttä; (3) tunnus on rajattu, näkyvä, peruttava ja erottuu lokissa ohjelmaksi; (4) 180 päivää on EU:n maksupalvelusääntelyssä kalibroitu aika, johon Euroopan pankkiviranomainen nosti 90 päivän uudelleentunnistautumisrajan (delegoitu asetus (EU) 2022/2360), koska lyhyempi väli ajoi käyttäjät takaisin turvattomampiin tapoihin.

**Sovellusrekisterin puuttuminen on oikeudellinen etu, ei puute.** Kunta ei hyväksy, sertifioi eikä rekisteröi ohjelmia, joten sillä ei ole suhdetta yhteenkään ohjelman ylläpitäjään, vain kuntalaiseen. Kanta-palvelujen Omatietovaranto on Suomen oma kansalaisen valtuuttama sovelluspääsy, ja se hyväksyy sovellukset erillisessä prosessissa; se on kuitenkin kansallinen terveystietoalusta, jossa Kela vastaa alustasta ja on suhteessa sovellustoimittajaan. Kunnan tekemä sertifiointi merkitsisi kunnan hyväksyntää ja toisi vastuun ohjelman tekemisistä. Kun ohjelma on kuntalaisen oma väline, vastuu sen käsittelystä on kuntalaisella ja ohjelman ylläpitäjällä, ei kunnalla, ja se kerrotaan kuntalaiselle avainta luotaessa.

**Toisen huoltajan tiedot** ovat arvioinnin vaikein kohta. Tietosuoja-asetuksen 15 artiklan 4 kohdan mukaan oikeus saada jäljennös ei saa vaikuttaa haitallisesti muiden oikeuksiin. Kuntalainen näkee samat tiedot jo eVakassa, koska ne on osoitettu hänelle; avain ei laajenna hänen näkymäänsä, mutta siirtää sen ohjelmalle, jota toinen huoltaja ei ole valinnut. Lieventävät toimet: toiselle huoltajalle ilmoitetaan, avaimen luoja saa varoituksen ennen valintaa, ja luettelosta puuttuvat tarkoituksella kaikki tiedot, joissa toinen huoltaja on kohteena eikä osapuolena (perheen ja puolison tiedot, tulotiedot, hakemukset). Riittävyys on kokouksen ratkaistava (luku 7, kysymys 1).

## 4. Mitä ominaisuus tallentaa ja miten se näkyy

Avaimen nimi, oikeudet, luonti- ja päättymisaika sekä viimeisin käyttöaika (5 minuutin tarkkuudella). **Itse avainta ei tallenneta**: se näytetään kerran, eikä sitä voi lukea edes kunnan järjestelmästä. Uusia tietoja kuntalaisesta tai lapsista ei synny. Peruutetun tai vanhentuneen avaimen rivi poistetaan 90 vuorokauden kuluttua; siihen asti se on todiste väärinkäytön selvittämiseen. Kuntalainen näkee avaimensa listana ja voi perua yhden klikkauksella; vaikutus on välitön, koska avain tarkistetaan jokaisella pyynnöllä. Toinen huoltaja saa sähköposti-ilmoituksen luonnista, mutta ei näe eikä voi perua avainta. Kunta näkee lokista, että pyynnön teki ohjelma eikä ihminen, ja millä avaimella; nykytilassa tätä erottelua ei ole. Rajoitus: "viimeksi käytetty" kertoo, milloin avainta käytettiin, ei mitä sillä luettiin. Avaimen ulottuvuus ei kasva ajan myötä: uusi eVakan toiminto on avaimilta suljettu, kunnes se lisätään luetteloon tarkoituksella, ja lisäys katselmoidaan.

## 5. Riskit

| Riski | Miten se on hoidettu |
| --- | --- |
| Avain joutuu vääriin käsiin | Pääsy vain lueteltuihin ja sallittuihin tietoihin, vanhenee itsestään, peruttavissa heti, tiliä ei voi ottaa haltuun. Vahinko on pienempi kuin salasanan vuodossa |
| Ohjelma käsittelee tietoja huonosti (pilvipalvelu, tekoälyavustin) | Kunnan ulottumattomissa; kerrotaan kuntalaiselle avainta luotaessa. Sama riski on nykyisessä salasanan luovutuksessa ilman, että kuntalaiselle kerrotaan mitään |
| Toisen huoltajan tiedot siirtyvät ohjelmalle, jota hän ei valinnut | Ilmoitus toiselle huoltajalle; varoitus avaimen luojalle; toista huoltajaa kohteena koskevat tiedot eivät ole luettelossa. Jäännösriski: hän ei voi perua avainta (kysymys 1) |
| Lapsen terveystieto (sairauspoissaolo, hakemuksen perustelu) siirtyy ohjelmalle | Huoltaja käyttää lapsen puhevaltaa; tieto on huoltajan itsensä kirjaamaa tai hänelle osoitettua. Ei teknistä rajausta: kysymys 2 |
| Kuntalainen sallii enemmän kuin tarvitsee | Oletuksena vain lukuoikeudet; kirjoitusoikeudet ja perhetietoja sisältävät oikeudet on merkitty ja niistä varoitetaan erikseen |
| Ohjelma merkitsee viestit luetuiksi, eikä kuntalainen huomaa viestiä | Erillinen varoitus valintahetkellä; oikeus ei ole oletusvalinnassa |
| Unohtunut avain jää voimaan | Pakollinen vanheneminen; lista ja "viimeksi käytetty" tekevät käyttämättömän avaimen näkyväksi |

## 6. Kunnan täydennettävä osa (yksi sivu)

| Kohta | Kunnan täydennys |
| --- | --- |
| Rekisterinpitäjä ja tietosuojavastaava | [nimi, yhteystiedot] |
| Käsittelytoimi selosteessa ja tietosuojaselosteen päivitys | [merkintä varhaiskasvatuksen asiakasrekisterin selosteeseen; kohta, jossa kerrotaan, ettei kunta vastaa ohjelmasta] |
| Säilytysaika | Tuotteen oletus 90 vrk peruutuksesta tai vanhenemisesta; [kunnan päätös, jos muu] |
| Käyttöönoton päivä ja päättävä viranhaltija | [pvm, virka] |
| Viestintä kuntalaisille | [miten kerrotaan, että ominaisuus on käytössä ja ettei kunta vastaa ohjelmista] |
| Vastaukset luvun 7 kysymyksiin | [1] [2] [3] [4] [5] |

## 7. Kokouksen ratkaistavaksi

1. **Toisen huoltajan tiedot.** Riittävätkö ilmoitus toiselle huoltajalle ja varoitus avaimen luojalle 15 artiklan 4 kohdan kannalta, vai edellytetäänkö toisen huoltajan mahdollisuutta nähdä tai perua avain?
2. **Lapsen terveystieto.** Hyväksytäänkö, että sairauspoissaolo ja poissaolohakemuksen perustelu siirtyvät huoltajan valitsemalle ohjelmalle huoltajan puhevallan nojalla, vai vaaditaanko poissaolon lajin peittämistä avaimelta?
3. **Painava perusteltu syy.** Hyväksytäänkö luvun 3 perustelu 180 päivän enimmäisajalle digipalvelulain 6 §:n 2 momentin kannalta?
4. **Säilytysaika.** Onko 90 vuorokautta sopiva: riittävä väärinkäytön selvittämiseen, ei pidempi kuin tarpeen?
5. **Dokumentointi ja viestintä.** Mitä selosteeseen ja tietosuojaselosteeseen kirjataan, ja miten kuntalaiselle kerrotaan, ettei kunta vastaa ohjelman tekemisistä?
