<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Lokikyselyt: kuinka paljon kuntalaisrajapinnan liikenteestä tulee ohjelmilta

Tämä hakemisto sisältää valmiit lokikyselyt, joilla kunta voi mitata omista lokeistaan, kuinka suuri osa eVakan kuntalaisrajapinnan (`/api/citizen/…`) liikenteestä tulee muualta kuin selaimesta. Kyselyt on kirjoitettu eVakan julkisesta lähdekoodista lukemalla, ja jokainen kenttänimi on tarkistettu koodista. Kunta voi siis tarkistaa itse, mitä kyselyt tekevät, ja ajaa ne omassa ympäristössään ilman että kenenkään ulkopuolisen tarvitsee päästä käsiksi kunnan lokeihin tai AWS-tiliin. Tämä on koko työkalupakin idea: mittaustulos syntyy kunnan omissa käsissä.

## Rehellinen rajaus: tämä mittaa käyttäytymistä

Vain yksi lokivirta kolmesta sisältää tiedon siitä, **mikä ohjelma** pyynnön lähetti: nginx-välityspalvelimen loki, jossa on `userAgent`-kenttä. Kaikki muu, mitä alla mitataan, on **käyttäytymistä**: kirjautumistiheyttä, kellonaikoja, sitä mitä päätepisteitä asiakas jättää kutsumatta. Käyttäytymissignaali kertoo, että asiakas ei käyttäydy kuin selain. Se ei kerro, mikä ohjelma se on, eikä se erottele hyväntahtoista automaatiota väärinkäytöstä.

Tämän vuoksi kyselyt on numeroitu tärkeysjärjestykseen: signaali 1 (käyttäjäagentti) on ainoa, joka nimeää ohjelmiston. Jos välityspalvelimen loki ei ole kunnan lokikeräyksessä mukana, signaalia 1 ei voi ajaa lainkaan, ja jäljelle jäävä arvio on väistämättä epävarmempi. Aloita siksi esitarkistuksesta.

## Mitä tällä ei voi mitata

Nämä ovat asioita, joita kysytään usein ja joihin lokit eivät vastaa. Ne on listattu tässä, jotta niitä ei tarvitse etsiä turhaan:

- **Ohjelman nimi ilman välityspalvelimen lokia.** API-gateway hylkää `req`- ja `res`-oliot kokonaan lokikirjoituksessa (`apigw/src/pino-cli/cli/index.ts`), joten mitään HTTP-otsaketta ei jää sen lokiin. Käyttäjäagentti on olemassa vain nginx-lokissa.
- **TLS-sormenjälki (JA3 tms.).** Ei kerätä missään.
- **Muut otsakkeet:** `Referer`, `Accept-Language`, `Accept`, `Origin`, evästeiden olemassaolo tai HTTP-versio eivät päädy mihinkään lokiin.
- **Selaimen ja mobiilisovelluksen ero.** eVakan kuntalaispuoli on selainsovellus; erillistä kuntalaismobiilisovellusta ei ole, joten "sovellusliikennettä" ei voi erottaa tunnetun sovelluksen käyttäjäagentin perusteella.
- **Staattisten tiedostojen lataukset.** nginx-konfiguraatiossa on `access_log off` palvelinlohkon tasolla ja `access_log … json_access` vain `location /api` -lohkossa, joten selaimen lataamat JS- ja CSS-tiedostot eivät näy lokissa lainkaan. Selainkäyttäjää ei siis voi tunnistaa siitä, että hän lataa myös sivupohjan.
- **Pyynnön runko tai vastauksen sisältö.** Vain koko `contentLength` tallennetaan.

## Tietosuojavaroitus — lue tämä ennen ensimmäistä kyselyä

eVakan tarkastuslokissa on kirkkaana tekstinä henkilötietoja, jotka eivät saa päätyä jaettuun raporttiin, koontinäyttöön eivätkä liitetiedostoon:

| Kenttä | Sisältö | Mistä |
| --- | --- | --- |
| `targetId` tapahtumassa `CitizenLogin` | **henkilötunnus** selväkielisenä | `service/src/main/kotlin/evaka/core/pis/SystemController.kt` |
| `meta.firstName`, `meta.lastName` tapahtumassa `CitizenLogin` | **etu- ja sukunimi** | sama |
| `targetId` tapahtumissa `CitizenWeakLogin` ja `CitizenWeakLoginAttempt` | **sähköpostiosoite** (käyttäjätunnus) selväkielisenä | sama |
| `meta.username` viestissä `Login request hit rate limit` | **sähköpostiosoite** | `apigw/src/enduser/routes/auth-weak-login.ts` |
| `userId` API-gatewayn tarkastustapahtumissa | henkilön raaka UUID | `apigw/src/shared/logging.ts` |

Henkilötunnusten peittäminen (`SsnMasker`) on kytketty vain `app-misc`-lokien liitteeseen (`default-appender-sanitized.xml`), **ei** tarkastuslokin liitteeseen (`audit-appender.xml`). `CitizenLogin`-tapahtuman henkilötunnus on siis lokissa peittämättömänä.

Tämän hakemiston kyselyt on kirjoitettu niin, että **ne eivät valitse yhtäkään noista kentistä**. Kaikki henkilötason ryhmittely tehdään `userIdHash`-kentällä, joka on henkilön UUID:n SHA-256-tiiviste (`AuthenticatedUser.rawIdHash` palvelussa, `createSha256Hash` API-gatewayssa — sama arvo molemmissa). Se on pseudonyymi, ei anonyymi: älä silti julkaise tiivisteitä sellaisenaan päätösesityksessä, vaan raportoi vain lukumääriä. Jos muokkaat kyselyitä, älä lisää `targetId`- tai `meta.username`-kenttää tulosteeseen.

## Kolme lokivirtaa — väärä virta palauttaa hiljaa nolla riviä

Jokainen eVaka-pyyntö kirjautuu kahteen tai kolmeen kertaan, eri komponenteista ja eri kentillä. Kyselyt erotellaan `appName`- ja `type`-kentillä. **Jos kysely osoitetaan väärään virtaan, se ei anna virhettä vaan tyhjän tuloksen.** Siksi jokaisen kyselytiedoston kommenttilohko kertoo, mihin virtaan se kohdistuu.

| | välityspalvelin (nginx) | API-gateway | palvelu |
| --- | --- | --- | --- |
| `appName` | `evaka-proxy` | `evaka-api-gw` | `evaka-service`, `trevaka-service` (Tampere), `evakaoulu-service` (Oulu) |
| `type` (pyyntöloki) | `app-requests-received` | `app-requests-received` | `app-requests-received` |
| `userAgent` | **on** — ainoa paikka koko järjestelmässä | ei | ei |
| `clientIp` | kuntalaisen todellinen osoite | edellinen välityspalvelin, ei kuntalainen | edellinen välityspalvelin |
| `path` | sisältää `/api`-etuliitteen | sisältää `/api`-etuliitteen | **ei** `/api`-etuliitettä |
| `queryString` | ilman `?`-merkkiä | **`?`-merkin kanssa** | ilman `?`-merkkiä, `null` jos tyhjä |
| `statusCode` | **merkkijono** (`"403"`) | **merkkijono** (`"403"`) | **luku** (`403`) |
| `httpRoute` (Springin polkumalli) | ei | ei | **on** |
| `userIdHash` | aina tyhjä merkkijono | täytetty tunnistautuneilla | täytetty tunnistautuneilla |
| `spanId` | sama kuin `traceId` | oma satunnainen arvo | ei kentässä lainkaan |
| kattavuus | vain `/api`-polut | kaikki internetistä tulleet pyynnöt tasan kerran | vain jos käyttöloki on kytketty tässä kunnassa |

Lisäksi:

- **`traceId` on sama kaikissa kolmessa virrassa saman pyynnön osalta** ja se on ainoa liitosavain. nginx generoi sen (`$request_id`) ja välittää sen otsakkeessa `X-Request-ID`; API-gateway lukee otsakkeen ja välittää sen edelleen palvelulle. Asiakas ei voi väärentää sitä, koska nginx ylikirjoittaa otsakkeen (`proxy_set_header X-Request-ID $request_id`).
- Tarkastustapahtumat ovat `type = "app-audit-events"`, sovelluslokit `type = "app-misc"`. Molemmat tulevat samasta prosessin vakiotulosteesta kuin pyyntölokikin, joten ne ovat yleensä samassa lokiryhmässä.
- Palvelun käyttöloki (`defaultAccessLoggingValve`) rekisteröidään kuntakohtaisessa konfiguraatiossa (`EspooConfig`, `TurkuConfig`, `OuluConfig`, `trevaka/tomcat/Tomcat.kt`). Jos jonkin kunnan asennuksessa sitä ei ole, kolmas virta puuttuu. Yksikään tämän hakemiston kyselyistä ei ole riippuvainen palvelun käyttölokista.

### Ansat, jotka rikkovat kyselyn hiljaa

1. `statusCode` on merkkijono välityspalvelimen ja API-gatewayn virroissa, luku palvelun virrassa. `filter statusCode = 403` ei löydä mitään API-gatewayn lokista; oikea muoto on `filter statusCode = "403"`.
2. `path` sisältää `/api`-etuliitteen kahdessa ensimmäisessä virrassa, ei kolmannessa. `/api/citizen/auth/status` API-gatewayssa on `/citizen/auth/status` palvelussa.
3. Palvelun käyttölokissa `userId` on tunnistautumattomalla pyynnöllä **merkkijono `"null"`**, ei JSON-null (`user?.rawId().toString()` päätyy Kotlinissa merkkijonoon `"null"`). `filter userId != "null"` on siis oikea suodatin, `isempty(userId)` ei toimi.
4. **Laske liikennemäärä tasan yhdestä virrasta.** Käytä `appName = "evaka-api-gw"`, koska se näkee jokaisen internetistä tulleen pyynnön tasan kerran. Jos lasket kaikki virrat yhteen, saat kaksin- tai kolminkertaisen luvun.
5. Terveystarkistukset eivät ole mukana missään virrassa: nginx `access_log off` poluille `/health` ja `/ready`, API-gatewayssa ne on rekisteröity ennen lokitusvälikettä, ja palvelun `AccessLoggingFilter` hylkää polut `/health` ja `/actuator/health`.

## Esitarkistus: mitkä virrat tässä kunnassa ovat olemassa

Aja tämä ensimmäisenä. Se kestää alle minuutin ja kertoo, mitkä kyselyt ovat käytettävissä.

1. Etsi lokiryhmät. Työkalupakki ei tiedä kunnan lokiryhmien nimiä eikä yritä arvata niitä:

   ```
   aws logs describe-log-groups --query 'logGroups[].logGroupName' --output text
   ```

   Etsi tuloksesta ryhmät, joiden nimessä esiintyy `proxy`, `api-gw` tai `apigw` ja `service`. Jos kunta käyttää OpenSearchia, vastaava komento on `GET _cat/indices?v`.

2. Aja [`cloudwatch/00-esitarkistus.txt`](cloudwatch/00-esitarkistus.txt) kaikkia löytämiäsi lokiryhmiä vastaan yhtä aikaa (CloudWatch Logs Insights sallii useamman lokiryhmän valinnan samaan kyselyyn).

3. Lue tulos:

   - **Rivejä arvolla `appName = "evaka-proxy"`** → signaali 1 on käytettävissä. Aloita kyselystä `01a`.
   - **Ei yhtään riviä arvolla `evaka-proxy`** → välityspalvelimen loki ei ole keräyksessä. Tarkista lokiryhmän valinta ennen kuin teet johtopäätöksiä: nginx kirjoittaa lokin vakiotulosteeseen, joten se on siinä lokiryhmässä, johon välityspalvelinsäiliön tulostus ohjataan, ja se voi olla eri ryhmä kuin API-gatewayn. Jos ryhmää ei ole, kunnan on kytkettävä välityspalvelinsäiliön lokitus keräykseen ennen kuin ohjelmistoja voi nimetä. Siihen asti käytä signaaleja 2–6 ja merkitse arvio epävarmemmaksi.
   - **Ei yhtään riviä millään `…-service`-nimellä** → palvelun käyttöloki puuttuu. Tällä ei ole vaikutusta yhteenkään tämän hakemiston kyselyyn.

## Kyselyt

Kaikki kyselyt kohdistuvat kuntalaisrajapintaan (`/api/citizen/…`). Työntekijä- ja mobiililiikenne on rajattu ulos.

| Tiedosto | Signaali | Kysymys | Lokivirta |
| --- | --- | --- | --- |
| [`00-esitarkistus.txt`](cloudwatch/00-esitarkistus.txt) | — | Mitkä lokivirrat tässä kunnassa ovat olemassa? | kaikki |
| [`01a-kayttajaagentit.txt`](cloudwatch/01a-kayttajaagentit.txt) | 1 | Mitkä ohjelmistot kutsuvat rajapintaa? | välityspalvelin |
| [`01b-kayttajaagentti-per-kayttaja.txt`](cloudwatch/01b-kayttajaagentti-per-kayttaja.txt) | 1 | Ketkä kuntalaiset käyttävät ei-selainohjelmistoa? | välityspalvelin + API-gateway |
| [`02-uusi-laite.txt`](cloudwatch/02-uusi-laite.txt) | 2 | Kuka kirjautuu joka kerta ilman laite-evästettä? | palvelu (`app-misc`) |
| [`03a-kirjautumistiheys.txt`](cloudwatch/03a-kirjautumistiheys.txt) | 3 | Kuka kirjautuu useammin kuin istunnon kesto edellyttäisi? | API-gateway (`app-audit-events`) |
| [`03b-kirjautumisen-rajoitin.txt`](cloudwatch/03b-kirjautumisen-rajoitin.txt) | 3 | Kuka törmää kirjautumisrajoittimeen toistuvasti? | välityspalvelin (varalla API-gateway) |
| [`04-auth-status-puuttuu.txt`](cloudwatch/04-auth-status-puuttuu.txt) | 4 | Kuka käyttää rajapintaa kutsumatta kertaakaan `auth/status`? | API-gateway |
| [`05a-viiden-minuutin-ikkunat.txt`](cloudwatch/05a-viiden-minuutin-ikkunat.txt) | 5 | Kenen liikenne jakautuu tasaisesti koko vuorokaudelle? | API-gateway |
| [`05b-yoaktiivisuus.txt`](cloudwatch/05b-yoaktiivisuus.txt) | 5 | Kuka käyttää rajapintaa klo 02–05? | API-gateway |
| [`05c-aikaleimavienti.txt`](cloudwatch/05c-aikaleimavienti.txt) | 5 | Kuinka säännöllinen yksittäisen epäillyn rytmi on? | API-gateway |
| [`06-csrf-tunnusmerkki.txt`](cloudwatch/06-csrf-tunnusmerkki.txt) | 6 | Kuka lähettää kirjautumispyynnön ilman CSRF-otsaketta? | API-gateway (pyyntö- ja tarkastusloki) |
| [`07-liikenteen-perusluku.txt`](cloudwatch/07-liikenteen-perusluku.txt) | — | Mikä on kokonaisliikenne, johon osuutta verrataan? | API-gateway |

OpenSearch- ja Kibana-vastineet ovat tiedostossa [`opensearch/kyselyt.md`](opensearch/kyselyt.md).

## Kyselyn ajaminen viidessä minuutissa

CloudWatch Logs Insights, selainkäyttöliittymä:

1. Avaa CloudWatch → Logs → Logs Insights.
2. Valitse lokiryhmä tai -ryhmät (esitarkistuksessa löytämäsi).
3. Valitse aikaväli. Suositus ensimmäiselle ajolle: **7 vuorokautta**. Lyhyempi jakso ei erota viikonpäivien vaihtelua, pidempi maksaa turhaan.
4. Liitä kyselytiedoston sisältö kyselykenttään ja paina *Run query*.
5. Vie tulos CSV-muotoon *Export results* -painikkeella, jos aiot laskea sen päälle.

Komentoriviltä:

```
aws logs start-query \
  --log-group-names "/kunnan/lokiryhma/proxy" \
  --start-time $(date -d '7 days ago' +%s) \
  --end-time $(date +%s) \
  --query-string "$(cat lokikyselyt/cloudwatch/01a-kayttajaagentit.txt)"
```

Tuloksen haku: `aws logs get-query-results --query-id <edellisen palauttama tunniste>`.

Kyselytiedostojen kommenttirivit alkavat `#`-merkillä, jonka Logs Insights hyväksyy. Jos oma konsolisi kuitenkin valittaa kommenteista, poista kommenttilohko ennen ajoa — se ei vaikuta kyselyn toimintaan.

Kaikki `bin()`- ja `datefloor()`-jaksotus tapahtuu **UTC-ajassa**. Suomen aika on UTC+2 talvella ja UTC+3 kesällä; tällä on merkitystä vain kyselyssä `05b`, jossa se on otettu huomioon erikseen.

## Ristiintarkistus tunnettuihin integraatioihin

Repositoriossa on erillinen kartoitus julkisesti löytyvistä kolmannen osapuolen eVaka-integraatioista: [`../liite-olemassaolevat-integraatiot.md`](../liite-olemassaolevat-integraatiot.md). Se on hyödyllinen kahdella tavalla.

Ensinnäkin se kertoo, mitä päätepisteitä tunnetut integraatiot kutsuvat (`auth/weak-login`, `calendar-events`, `messages/received`, `messages/unread-count`, `reservations`, `absences`). Jos kyselyn `01a` tulos sisältää käyttäjäagentteja, joiden pyynnöt osuvat juuri näihin polkuihin, kyseessä on hyvin todennäköisesti samankaltainen integraatio.

Toiseksi se on tämän työkalupakin oma vasta-aineisto: kartoituksen viidestä todennetusta integraatiosta neljä matkii selainta tarkoituksella, yksi säilyttää laite-evästeen nimenomaan uuden laitteen ilmoituksen estämiseksi ja yksi kutsuu `auth/status`-päätepistettä kuten selain. Ne on siis kirjoitettu tavalla, joka heikentää signaaleja 2, 4 ja 6. Tämä on paras käytettävissä oleva näyttö siitä, että kyselyiden tuottama luku on alaraja eikä arvio.

## Tulosten lukeminen

Yksittäinen kysely ei tuota päätöskelpoista lukua. Se tuottaa joukon `userIdHash`-arvoja ja niiden mittalukuja. Tapa, jolla noista tehdään yksi puolustettava luku päätösesitykseen — mikä lasketaan yhdeksi ulkoisen ohjelman käyttäjäksi, mikä on luottamustaso, ja mitä epäileväinen lukija kysyy — on kuvattu erillisessä tiedostossa [`tulkinta.md`](tulkinta.md). Lue se ennen kuin raportoit mitään lukua eteenpäin.
