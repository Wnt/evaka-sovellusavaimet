<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Sovellusavaimet: päätösesitys

## Päätösesitys

Ohjausryhmää pyydetään päättämään, että

1. kuntalaisen sovellusavaimet viimeistellään tuotantokuntoon ja tietoturvakatselmoidaan **kerran, tuotetasolla**, ennen julkaisua;
2. ominaisuus julkaistaan kuntakohtaisen asetuksen takana, oletuksena pois päältä;
3. kukin kunta ottaa ominaisuuden käyttöön täydentämällä tuotetason vaikutustenarvioinnin omalla sivullaan ja tekemällä viranhaltijapäätöksen (luonnos alla).

## Mistä on kyse

Finanssivalvonta kielsi kannanotossaan 1/2018 (10.1.2018) tunnuksia lainaavan ruudunkaavinnan verkkopankeissa jo ennen kuin PSD2 sitä vaati, ja perusteli: *"Screen scraping -menetelmällä pääsee koko verkkopankkiin – pääsyä ei pysty teknisesti rajoittamaan pelkkiin tilitapahtumiin."* Sama pätee eVakaan. Kun kuntalainen haluaa lastensa hoitoajat kalenteriinsa tai ilmoituksen uudesta viestistä, tuettua tapaa ei ole, joten ohjelmalle annetaan eVaka-salasana. Julkisesti dokumentoituja integraatioita on vähintään kolme; kokonaismäärää ei voi tietää, koska salasanalla toimiva ohjelma näyttää lokissa kuntalaiselta itseltään. Salasana antaa kaikki 27 heikon tunnistautumisen toimintoa, ei vanhene, ei näy kuntalaiselle eikä ole peruttavissa muuten kuin salasanaa vaihtamalla. Suunta on huonompaan: passkey-kirjautuminen ja PWA-sovellus ovat jo koodissa, ja jokainen kirjautumisvirran muutos rikkoo tunnuksia toistavan ohjelman ja synnyttää painetta kiertotielle. Tanskan Aula näyttää, miltä "ei" näyttää: huoltajien rajapintaa ei ole, joten huoltajat ajavat kirjautumista toistavia integraatioita, jotka hajoavat kirjautumisen muuttuessa ja kuolevat, kun kunta pakottaa MitID-tunnistuksen.

Sovellusavain on kuntalaisen itse luoma, rajattu ja määräaikainen tunnus, jonka hän näkee ja voi perua eVakan asetuksissa. Se tavoittaa vain erikseen luetellut 24 toimintoa 116:sta — ei hakemuksia, päätöksiä, tuloselvityksiä, lapsen asiakirjoja eikä tunnusten hallintaa — ja muutoksia se voi tehdä kaksi (viestin ja ilmoituksen kuittaus luetuksi). Kysymys ei ole "avataanko rajapinta", vaan annetaanko kuntalaiselle **kapeampi vaihtoehto sille, mitä hän jo tekee leveämmällä valtuudella**.

| | Salasana (nykytila) | Sovellusavain |
| --- | --- | --- |
| Laajuus | Kaikki 27 heikon tunnistautumisen toimintoa | Vain myönnetyt oikeudet 11:stä; esimerkkisovellus tarvitsee 4 |
| Vanheneminen | Ei koskaan | Pakollinen, enintään 180 vrk. Aika on EU:n maksupalvelusääntelyssä kalibroitu: Euroopan pankkiviranomainen nosti 90 päivän uudelleentunnistautumisrajan 180 päivään (delegoitu asetus (EU) 2022/2360), kun Britannian FCA mittasi 90 päivän rajan karsivan 20–40 % käyttäjistä |
| Peruutus | Salasanan vaihto vahvasti tunnistautuneena; katkaisee oman kirjautumisen | Yksi avain pois, vaikutus välitön, muu jatkaa |
| Näkyy kuntalaiselle | Ei mitenkään | Lista, oikeudet ja "viimeksi käytetty" |
| Erottuu lokissa; uuden laitteen varoitus | Ei erotu: "oliko se ohjelma vai ihminen?" ei ole vastattavissa. Varoitus laukeaa jokaisella tuoreella evästevarastolla, joten kotona integraation ajava huoltaja oppii ohittamaan viestin "jos et tunnista kirjautumista, vaihda salasana" | Avaimen tunniste kulkee jokaisessa pyynnössä lokiin. Varoitus ei laukea ja säilyy merkityksellisenä |

## Mitä muutos ei ratkaise

Avain tavoittaa myös **lapsen toisen huoltajan** tietoja — eVaka asettaa lapsen kaikki huoltajat samaan viestiketjuun, ja poissaolohakemuksissa ja varauksissa näkyy tekijän nimi — sekä lapsen **sairauspoissaolot**, jotka ovat terveystietoa. Rajausta ei ole kavennettu dokumenttien helpottamiseksi: tiedot kerrotaan kuntalaiselle avainta luotaessa, ja yhteisen lapsen toiselle huoltajalle lähetetään ilmoitus, kun avain luodaan. Oikeudellinen arvio ja kenttätason tietoluettelo: [DPIA-aineisto](dpia-aineisto.md). Wilma Plus (2022) on vertailukohta väärästä suunnasta: Visman oman, rajaamattoman kumppanirajapinnan päällä toiminut kolmannen osapuolen sovellus näytti huoltajille muiden oppilaiden nimiä, Visma sulki kolmansien pääsyn ja useat kunnat tekivät tietoturvaloukkausilmoituksen. Se oli perheiden välinen vuoto toimittajarajapinnan kautta — luokka, jonka nimetty sallittujen luettelo sulkee pois, koska avain toimii aina kuntalaisen omana identiteettinä eikä yllä toisen perheen tietoihin.

## Kustannus ja vaihtoehdot

| | |
| --- | --- |
| Tehty | Toimiva toteutus ja esimerkkisovellus: noin 1 150 riviä ylläpidettävää ydinkoodia (api-gw ja service, mukaan lukien toisen huoltajan ilmoitus), yksi tietokantataulu, käyttöliittymä (noin 700 riviä) ja testit (noin 2 400 riviä). Sallittujen luettelo on yksi taulukko koodissa; siitä generoitua tarkistuslistaa (noin 530 riviä) ei ylläpidetä käsin, ja CI hylkää muutoksen, jos lista ei vastaa koodia. |
| Ylläpito | Uusi eVakan toiminto ei ole avainten ulottuvilla ennen kuin joku lisää sen luetteloon tarkoituksella; lisäys on katselmoitava rivi. |
| Jäljellä | E2E-testien ensimmäinen ajo ja sen korjaukset; katselmointipalautteen käsittely. Arvio 1–2 henkilötyöviikkoa; ei sisällä katselmointia, DPIA-käsittelyä eikä kuntien käyttöönottoa. |
| Hyväksyntä | Kuntakohtainen asetus **lykkää** kunkin kunnan kustannuksen, ei poista sitä: koodi julkaistaan kaikille asetuksesta riippumatta. Siksi tietoturvakatselmointi tehdään kerran tuotetasolla, ja kunnan osuus on yhden sivun täydennys ja päätös. |

- **Ei tehdä mitään:** integraatiot jatkuvat salasanoilla ilman vanhenemista, näkyvyyttä tai erillistä peruutusta, ja jokainen kirjautumisen parannus hajottaa ne (Aula).
- **Sovellusten sertifiointi (Kanta Omatietovarannon malli):** vaatii sovellusrekisterin, hyväksyntäprosessin ja suhteen jokaiseen ylläpitäjään, jolloin kunta ottaa kantaa ohjelmiin ja vastuuta niiden tekemisistä. Sovellusavaimessa kunta ei hyväksy, rekisteröi eikä tunne ohjelmia: sillä on suhde vain kuntalaiseen, jonka oma väline ohjelma on.
- **Täysi OAuth-valtuutuspalvelin:** tarvitaan vasta, kun sovellukset haluavat pääsyn *muiden ihmisten* tietoihin. Sovellusavain on sen kanssa yhteensopiva askel.

## Päätösluonnos (viranhaltijapäätös)

**Asia:** eVakan sovellusavainten käyttöönotto [kunta]. **Päätös:** [viranhaltija] päättää, että eVakan sovellusavaimet otetaan käyttöön [pvm] alkaen. Avaimella kuntalainen käyttää tiedonsaantioikeuttaan omiin ja huollettavansa tietoihin valitsemansa ohjelman avulla. Kunta ei hyväksy, rekisteröi eikä valvo ohjelmia, eikä ohjelman käsittely ole kunnan vastuulla; tämä kerrotaan kuntalaiselle avainta luotaessa. Avaimen luonti edellyttää vahvaa tunnistautumista, avain on voimassa enintään 180 vuorokautta ja peruttavissa milloin tahansa, ja yhteisen lapsen toiselle huoltajalle ilmoitetaan luonnista. **Perustelut:** tuotetason vaikutustenarviointi ja kunnan täydennys [pvm]; tietoturva-arvio [pvm]. **Sovelletut säännökset:** julkisuuslaki (621/1999) 12 §, 13 § 2 mom ja 26 § 1 mom 2 kohta; tiedonhallintalaki (906/2019) 24 §; digipalvelulaki (306/2019) 6 § 2 mom; tietosuoja-asetus (EU) 2016/679 6 art. 1 kohta e alakohta, 15 ja 25 art. **Muutoksenhaku:** kunnan käytännön mukainen muutoksenhakuohje liitetään. Allekirjoitus ja päiväys: ______________________
