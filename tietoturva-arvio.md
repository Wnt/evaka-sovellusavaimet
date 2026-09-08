<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Sovellusavaimet: tietoturva-arvio

Tämä dokumentti vastaa yhteen kysymykseen: **kannattaako tämä tehdä**. Hyökkääjäasemat, kontrollit
ja jäännösriskit ovat [uhkamallissa](uhkamalli.md). Lyhyt vastaus: **ehdotus vähentää liikkeellä
olevien valtuuksien määrää** eikä avaa uutta rajapintaa tai korota kenenkään oikeuksia.

## 1. Vertailukohta ei ole "ei mitään" vaan salasana kolmannella osapuolella

Kuntalaiset integroivat eVakaan jo nyt. Tuettua tapaa ei ole, joten tapa on selainautomaatio kuntalaisen tunnuksilla tai istuntoevästeen kopiointi: eVaka-salasana kolmannen osapuolen koodissa.

| | Salasana (nykytila) | Sovellusavain |
| --- | --- | --- |
| Laajuus | Kaikki 27 heikon tunnistautumisen toimintoa | Vain myönnetyt oikeudet 11:stä; ne kattavat 25 erikseen lueteltua endpointtia 116:sta, ja esimerkkisovellus tarvitsee 4 oikeutta |
| Tunnistetietojen hallinta | Sallittu | Ei tavoitettavissa: ei sallittujen luettelossa (`CitizenApiScopes.kt`) |
| Tilin haltuunotto | Ei: `UPDATE_WEAK_LOGIN_CREDENTIALS` ja `ADD_PASSKEY` vaativat vahvan tunnistautumisen (`Action.kt`) | Ei, samasta syystä |
| Vanheneminen | Ei koskaan | Pakollinen, enintään 180 vrk (`MAX_API_TOKEN_LIFETIME`) |
| Peruutus | Vaatii vahvan tunnistautumisen ja katkaisee kuntalaisen oman kirjautumisen | Yksi rivi pois; muut avaimet ja oma kirjautuminen jatkavat |
| Näkyy kuntalaiselle | Ei mitenkään | Lista, myönnetyt oikeudet ja `last_used_at` |
| Erottuu lokissa ohjelmaksi | Ei | Kyllä, `X-Evaka-Api-Token-Id` → MDC-avain `apiTokenId` |
| Käyttökelpoinen muualla | Kyllä, jos salasana on uusiokäytössä | Ei, sidottu eVakaan |

## 2. Luottamusmalli ei muutu

api-gw on jo nyt ainoa taho, joka tunnistaa kuntalaisen: service luottaa `X-User`-otsakkeeseen täysin gatewayn JWT:n nojalla. Oikeuksien valvonta tehdään samassa kohdassa, jossa gateway jo päättää pyynnön läpäisystä — uutta luottamusoletusta ei synny. Service ei tunne oikeuksia, mutta hylkää toisena kerroksena avainpyynnön, jonka kohde ei ole sallittujen luettelossa (`CitizenApiTokenAccessControl`). Avain tunnistautuu **heikosti tunnistautuneena kuntalaisena**, samana kuin sähköposti + salasana, joten servicen pääsynvalvonta pysyy ennallaan eikä avain voi antaa enempää kuin omistajallaan on. 116 kuntalaisen endpointista 25 on lueteltu avainten tavoitettaviksi; loput 91 — hakemukset, tuloselvitykset, päätökset, lapsen asiakirjat, perheenjäsenten tiedot, henkilötietojen muutokset ja tunnusten hallinta — eivät ole minkään avaimen ulottuvilla. Luettelossa on kolme kirjoittavaa endpointtia, kaikki kuittauksia.

## 3. Heikko tunnistautuminen ei ole sama uhkamalli kuin ohjelma

Heikon tunnistautumisen salliva joukko (27 toimintoa, `Action.kt`) on suunniteltu ihmiselle omalla laitteellaan, ei valvomattomalle ohjelmalle, jolla on pääsy puolen vuoden ajan. Joukkoa ei ole katselmoitu tästä näkökulmasta, eikä avain saa joukkoa vaan luettelon: sallittujen luettelo on kirjoitettu ohjelmalle, ja se jättää ulkopuolelle sen, minkä heikko tunnistautuminen ihmiselle sallisi mutta mikä ohjelmalle on tarpeetonta tai vaarallista. Ilmoitusasetusten muuttaminen (hälyttimen sammutus ennen väärinkäyttöä), kirjautumisavainten luettelo (tiedustelu tilin toisesta tekijästä), puolison ja lasten tiedot `personal-data/family`-näkymässä ja lasten valokuvat (muiden ihmisten tiedot), viestien lähetys sekä varausten ja poissaolojen teko (toiminta kuntalaisen nimissä): yhtäkään ei tarvinnut estää erikseen, ne eivät ole listalla.

Luettelon terävin raja on lasten kohdalla. Ohjelman on voitava sanoa, **kenen lapsen** viestistä, kalenterimerkinnästä tai asiakirjailmoituksesta on kyse, joten `children:read` antaa lasten nimet, ryhmän ja yksikön ja `notifications:read` lukemattomien asiakirjojen lukumäärät lapsittain. Sen sijaan `GET /citizen/child-documents/unanswered` ei ole listalla, vaikka se näyttää samalta tiedolta: se palauttaa asiakirjapohjan nimen, tyypin ja päätöksen, ja pelkkä pohjan nimi voi paljastaa esimerkiksi tuen suunnitelman olemassaolon. **Lukumäärät ja identiteetit kyllä, asiakirjojen tyypit ja sisältö ei.**

Rajaus on tarkoituksella karkea: yksi oikeus kattaa kaikki huollettavat, ja `messages:read` kaikki viestiketjut. Lapsikohtaista rajausta ei ole (uhkamalli, kohta 2).

## 4. Mikä pitää tämän totena myös ensi vuonna

Rajapinta ei laajene vahingossa, koska mikään ei ole avainten ulottuvilla ennen kuin se on kirjoitettu luetteloon (`citizenApiScopes`, `CitizenApiScopes.kt`). Uusi kuntalaisen endpoint on avaimilta suljettu siitä hetkestä, kun se on olemassa; sen avaaminen on rivi luettelossa ja katselmoitava diff. Luettelo ja jokainen kuntalaisen endpoint generoidaan versionhallintaan (`apigw/src/enduser/generated/citizen-api-scopes.ts`): tavoittamaton endpoint näkyy `null`-rivinä, ja CI hylkää muutoksen, jos tiedosto ei vastaa koodia (`./gradlew :codegen:codegenCheck`). Luettelossa oleva olematon endpoint kaataa buildin (`assertAllowlistedEndpointsExist`), jottei kirjoitusvirhe näytä toimivalta oikeudelta. Servicen toinen valvontakerros lukee saman luettelon ja sulkeutuu itsestään: polku, jota se ei tunnista, ei ole listalla.

Käyttöönotto on kuntakohtaisen asetuksen `evaka.citizen_api_tokens.enabled` (`EvakaEnv.kt`) takana, ja asetus tarkistetaan jokaisessa avainkirjautumisessa: sammuttaminen mitätöi avaimet 60 sekunnin välimuistin kuluessa. Häiriötilanteessa Valkey-avain `citizen-api-tokens-disabled` hylkää kaiken avainliikenteen (503) ilman uudelleenkäynnistystä, evästekirjautumiseen koskematta.
