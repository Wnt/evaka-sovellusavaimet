<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Tulkinta: kyselyiden tuloksesta yhdeksi puolustettavaksi luvuksi

Tämä tiedosto kertoo, miten hakemiston [`lokikyselyt/`](README.md) tulokset muutetaan luvuksi, joka kestää päätöskokouksen. Lue ensin [`README.md`](README.md), erityisesti tietosuojavaroitus ja lokivirtojen erot.

## Mitä lukua ollaan tuottamassa

Päätösesitykseen tarvitaan vastaus kysymykseen: **kuinka moni kunnan asukas käyttää eVakaa ohjelmalla eikä selaimella, ja kuinka suuri osa kuntalaisrajapinnan liikenteestä on sellaista?**

Luku ei ole itsetarkoitus. Sen merkitys on siinä, että jokainen tunnistettu ohjelmakäyttäjä on kuntalainen, joka on tallentanut eVaka-tunnuksensa johonkin ohjelmaan. Yksi vahvistettu ohjelmakäyttäjä tarkoittaa yhtä eVaka-salasanaa, joka on kunnan hallinnan ulkopuolella ja jonka kunta ei voi mitätöidä muuten kuin pakottamalla kuntalaisen vaihtamaan salasanansa. Määrä on siis riskin mittari, ei suosion mittari — ja tämä kannattaa sanoa päätösesityksessä ääneen, koska se suojaa myös tilanteessa, jossa luku osoittautuu pieneksi.

## Laskennan yksikkö: yksi `userIdHash`

**Yksi ulkoisen ohjelman käyttäjä = yksi `userIdHash`-arvo**, joka täyttää alla olevat ehdot mittausjakson aikana. Perustelut:

- `userIdHash` on henkilön UUID:n SHA-256-tiiviste. Se on sama arvo riippumatta siitä, kirjautuuko henkilö salasanalla vai Suomi.fi-tunnistautumisella, ja sama arvo kaikissa kolmessa lokivirrassa. Sama henkilö ei siis voi tulla lasketuksi kahdesti kirjautumistavan takia.
- IP-osoite ei kelpaa yksiköksi: yhteisen NAT-osoitteen takana on monta kuntalaista, ja sama kuntalainen liikkuu useassa verkossa.
- Käyttäjäagentti ei kelpaa yksiköksi: yhtä ohjelmistoa voi käyttää moni kuntalainen, ja yksi kuntalainen voi käyttää montaa ohjelmaa.
- Pyyntömäärä ei kelpaa yksiköksi lainkaan: yksi ajastettu ohjelma tuottaa helposti enemmän pyyntöjä kuin sata selainkäyttäjää. Pyyntömäärä raportoidaan erikseen omana lukunaan, ei käyttäjämäärän sijasta.

**Älä laske samaa `userIdHash`-arvoa moneen kertaan** siksi, että se osuu useaan signaaliin. Signaalit ovat päällekkäisiä tarkoituksella: sama kuntalainen näkyy tyypillisesti kolmessa neljästä. Lopullinen luku on **yhdiste**, ei summa.

Käytännön työtapa: vie jokaisen kyselyn tulos CSV-muotoon, ota `userIdHash`-sarake, ja tee yhdiste. Yhdellä komennolla:

```
cat 02.csv 03a.csv 04.csv 05a.csv | cut -d, -f1 | sort -u | wc -l
```

## Luottamustasot

Merkitse jokainen tunnistettu `userIdHash` yhteen kolmesta luokasta. Raportoi kaikki kolme lukua erikseen; älä esitä yhtä lukua ilman tätä jaottelua.

### Taso A — nimetty ohjelmisto

Kuntalainen, jonka pyyntöihin liittyy välityspalvelimen lokissa käyttäjäagentti, joka ei väitä olevansa selain (kysely `01b`), ja joka on karsinnan jälkeen tunnistettu asiakasohjelmaksi eikä robotiksi tai kunnan omaksi testiajoksi.

Tämä on ainoa taso, jolla voi sanoa **mitä** ohjelmistoa käytetään. Vaatii välityspalvelimen lokin. Virhemahdollisuus on pieni ja se on yliarvion suuntaan vain siltä osin, kuin robotteja jää karsimatta.

Karsintaa helpottaa ristiintarkistus tiedostoon [`../liite-olemassaolevat-integraatiot.md`](../liite-olemassaolevat-integraatiot.md): siinä on lueteltu, mitä päätepisteitä tunnetut kolmannen osapuolen integraatiot kutsuvat. Käyttäjäagentti, jonka pyynnöt osuvat samaan joukkoon polkuja, on asiakasohjelma; robotti ja valvontapalvelu käyttäytyvät toisin.

### Taso B — vahva käyttäytymishavainto

Kuntalainen, joka täyttää **vähintään kaksi** seuraavista samana vuorokautena:

- kysely `04`: vähintään 20 kuntalaisrajapinnan pyyntöä ilman yhtäkään `auth/status`-kutsua
- kysely `03a`: yli 20 kirjautumista vuorokaudessa
- kysely `02`: vähintään viisi kirjautumista, joissa `deviceAuthHistorySize = 0`
- kysely `05a`: vähintään 50 eri viiden minuutin ikkunaa

Kahden riippumattoman signaalin yhtäaikaisuus on ratkaiseva. Yksikään yksittäinen signaali ei ole aukoton, mutta selainkäyttäjä, joka tuottaa kaksi niistä samana päivänä, on harvinaisuus.

### Taso C — yksittäinen käyttäytymishavainto

Kuntalainen, joka täyttää tasan yhden yllä olevista ehdoista, tai joka näkyy vain yöaktiivisuuskyselyssä `05b`. Raportoi tämä luku erikseen ja sano suoraan, että se sisältää vääriä positiivisia. Älä laske sitä pääluvuksi.

### Signaali 6 ei tuota käyttäjämäärää

CSRF-tunnusmerkki (kysely `06`) on ainoa signaali, joka ei liity kehenkään: pyyntö torjutaan väliohjelmistossa ennen tunnistautumista, joten `userIdHash` on tyhjä. Se tuottaa **tapahtumien lukumäärän**, ei käyttäjien lukumäärää. Käytä sitä laadullisena vahvistuksena — "ohjelmistokehitystä eVakaa vasten tapahtuu, ja se näkyy lokissa" — älä lukuna kokonaisarvioon.

## Osuuden laskeminen

Kaksi eri osuutta, jotka on pidettävä erillään:

**Osuus liikenteestä** = tasojen A ja B käyttäjien pyynnöt / kaikki kuntalaisrajapinnan pyynnöt (kysely `07`, kysely A). Tämä luku on tyypillisesti moninkertainen käyttäjäosuuteen nähden, koska ohjelma tekee paljon enemmän pyyntöjä kuin ihminen. Se on oikea luku, kun puhutaan kuormituksesta.

**Osuus kuntalaisista** = tasojen A ja B käyttäjät / eri `userIdHash`-arvot mittausjaksolla (kysely `07`, kysely B). Tämä on oikea luku, kun puhutaan siitä, moniko on tallentanut salasanansa ohjelmaan.

Esitä molemmat. Jos esität vain toisen, epäileväinen lukija kysyy toista.

## Mittausjakso

- **Vähintään 7 vuorokautta**, jotta viikonlopun ja arjen ero ei vääristä.
- **Mieluiten 30 vuorokautta** kyselyille `02` ja `06`, joissa tapahtumia on vähän.
- Vältä koulujen loma-aikoja ja hakuaikojen huippuja mittausjakson ainoana sisältönä; ne muuttavat sekä ihmisten että ohjelmien käyttäytymistä.
- Kirjaa mittausjakso päätösesitykseen päivämäärätarkkuudella. Ilman sitä lukua ei voi toistaa.

## Mitä epäileväinen lukija kysyy

**"Eikö tämä ole vain hakukoneiden ja skannereiden liikennettä?"**
Ei tasojen A ja B osalta. Molemmat vaativat täytetyn `userIdHash`-kentän, joka on olemassa vain tunnistautuneilla pyynnöillä. Robotti ei kirjaudu sisään kuntalaisen tunnuksilla. Tunnistautumattomat pyynnöt on rajattu jokaisesta kyselystä pois.

**"Voiko sama henkilö tulla lasketuksi kahdesti?"**
Ei. Yksikkö on `userIdHash`, joka on johdettu henkilön pysyvästä tunnisteesta ja on sama kirjautumistavasta riippumatta. Sama henkilö voi kuitenkin näkyä useassa eri signaalissa; siksi lopullinen luku on yhdiste, ei summa.

**"Entä jos ohjelma tekeytyy selaimeksi?"**
Silloin se katoaa signaalista 1 kokonaan ja mahdollisesti myös signaaleista 2 ja 4, jos se on kirjoitettu huolella. Näin myös tapahtuu: tiedoston [`../liite-olemassaolevat-integraatiot.md`](../liite-olemassaolevat-integraatiot.md) viidestä todennetusta integraatiosta neljä matkii selainta tarkoituksella, yksi toistaa laite-evästeen estääkseen uuden laitteen ilmoituksen ja yksi kutsuu `auth/status`-päätepistettä kuten selain. Tämä on tunnettu ja korjaamaton rajoitus: **raportoitu luku on alaraja, ei arvio.** Todellinen määrä on suurempi, eikä lokeista saa selville kuinka paljon suurempi. Sano tämä päätösesityksessä itse ennen kuin joku muu sanoo sen.

**"Onko tässä kyse kuntalaisten valvonnasta?"**
Kyselyt lukevat lokeja, jotka kunta kerää joka tapauksessa tietoturvasyistä, eivätkä ne valitse yhtäkään kenttää, jossa on nimi, henkilötunnus tai sähköpostiosoite. Tulos on lukumääriä ja pseudonyymejä tiivisteitä. Yksittäisen kuntalaisen tunnistaminen tiivisteestä vaatisi erillisen haun eVakan tietokantaan, eikä se ole tämän mittauksen tarkoitus eikä osa yhtäkään näistä kyselyistä.

**"Miksi tämän luvun pitäisi olla uskottava?"**
Koska kunta ajaa kyselyt itse, omissa lokeissaan, ja kyselytiedostot ovat luettavissa: kentät ja suodattimet ovat näkyvissä, eikä välissä ole mustaa laatikkoa. Kukaan ulkopuolinen ei tarvitse pääsyä kunnan ympäristöön eikä ole tarvinnut sitä näiden kyselyiden kirjoittamiseen — ne on johdettu eVakan julkisesta lähdekoodista.

**"Entä jos luku onkin pieni?"**
Pieni luku on aito tulos, ja se kannattaa raportoida sellaisenaan. Se ei kuitenkaan kumoa päätöksen perustetta, koska kysymys ei ole volyymistä vaan siitä, että jokainen tunnistettu tapaus on kunnan hallinnan ulkopuolella oleva eVaka-salasana. Pienikin luku tarkoittaa, että ilmiö on olemassa ja että se kasvaa hiljaisesti, koska mikään nykyinen kontrolli ei estä sitä.

**"Miksi luvussa ei ole virhemarginaalia?"**
Koska tämä ei ole otos vaan kokonaisaineisto, jossa on tunnettu vinouma yhteen suuntaan. Virhemarginaalin sijasta raportoidaan luottamustasot A, B ja C sekä se, että luku on alaraja.

## Esimerkki (keksityt luvut)

> **Nämä luvut ovat keksittyjä ja esitetään vain havainnollistamaan laskutapaa. Ne eivät ole mistään kunnasta.**

Mittausjakso 1.–30.9.2026, 30 vuorokautta. Välityspalvelimen loki oli keräyksessä, joten kaikki kuusi signaalia olivat käytettävissä.

Perusluku (kysely `07`):

| | |
| --- | --- |
| Kuntalaisrajapinnan pyynnöt yhteensä | 41 300 000 |
| Eri tunnistautuneita kuntalaisia | 18 400 |

Signaalikohtaiset havainnot:

| Kysely | Signaali | Osumia (`userIdHash`) |
| --- | --- | --- |
| `01b` | 1 — ei-selainagentti | 31, joista 9 karsittiin robotiksi tai kunnan omaksi valvonnaksi → **22** |
| `02` | 2 — ei laite-evästettä | 34 |
| `03a` | 3 — kirjautumistiheys | 19 |
| `04` | 4 — ei `auth/status`-kutsuja | 41 |
| `05a` | 5 — ≥ 50 viiden minuutin ikkunaa | 27 |
| `05b` | 5 — yöaktiivisuus | 63 |
| `06` | 6 — CSRF-otsake puuttui | 208 tapahtumaa, ei käyttäjätietoa |

Luokittelu:

| Taso | Ehto | Kuntalaisia |
| --- | --- | --- |
| A | nimetty ei-selainohjelmisto | 22 |
| B | vähintään kaksi käyttäytymissignaalia, ei jo tasolla A | 17 |
| C | tasan yksi käyttäytymissignaali | 48 |

Näiden kolmen joukon yhdiste on 87 eri `userIdHash`-arvoa. Yksikään ei esiinny kahdessa luokassa, koska luokat on määritelty toisensa poissulkeviksi.

Raportoitava tulos:

> Kolmenkymmenen vuorokauden mittausjaksolla **39 kuntalaista** (tasot A ja B) käytti eVakan kuntalaisrajapintaa ohjelmalla eikä selaimella. Heistä 22:n käyttämä ohjelmisto voitiin myös nimetä. Lisäksi 48 kuntalaisen käytössä oli yksi ohjelmalle tyypillinen piirre, mikä ei yksinään riitä johtopäätökseen.
>
> Nämä 39 kuntalaista tuottivat 6 900 000 pyyntöä eli **16,7 % kuntalaisrajapinnan kokonaisliikenteestä**, vaikka heidän osuutensa tunnistautuneista kuntalaisista on **0,21 %**.
>
> Luku on alaraja. Selaimeksi tekeytyvää ohjelmaa ei voi lokeista havaita, joten todellinen määrä on tätä suurempi, eikä eroa voi lokien perusteella arvioida.
>
> Kutakin näistä 39:stä vastaa vähintään yksi eVaka-salasana, joka on tallennettuna kunnan hallinnan ulkopuolella olevaan ohjelmaan.

Huomaa, miten esimerkin luvut käyttäytyvät: 0,21 % kuntalaisista tuottaa 16,7 % liikenteestä. Tämä epäsuhta on tyypillinen ja se on itsessään argumentti — se on juuri se kuvio, jonka perusteella ohjelmakäyttö voidaan erottaa ihmiskäytöstä ylipäätään.

## Mittauksen toistaminen

Kirjaa mittausjakso, ajetut kyselyt ja karsintapäätökset (mitkä käyttäjäagentit tulkittiin roboteiksi) muistiin. Jos kunta ottaa sovellusavaimet käyttöön, sama mittaus kannattaa toistaa 6 ja 12 kuukauden kuluttua: silloin kysymys ei ole enää "kuinka moni käyttää ohjelmaa" vaan "kuinka moni on siirtynyt salasanan tallentamisesta avaimeen". Ero näiden kahden mittauksen välillä on ainoa suora mittari sille, toimiko päätös.
