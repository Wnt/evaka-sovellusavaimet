<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# OpenSearch- ja Kibana-vastineet

Samat kyselyt kuin hakemistossa [`../cloudwatch/`](../cloudwatch/), kirjoitettuna hakukoneen kyselykielelle. Lue ensin [`../README.md`](../README.md): lokivirtojen erot, ansat ja tietosuojavaroitus koskevat näitä kyselyitä täsmälleen samalla tavalla.

## Oletukset, jotka on tehty

- **OpenSearch 2.x / OpenSearch Dashboards 2.x.** Kyselyt toimivat sellaisenaan myös Elasticsearch 7.17:llä ja Kibana 7.17:llä. `bucket_selector`- ja `extended_stats_bucket` -putkiaggregaatiot ovat mukana molemmissa.
- **Indeksikuvio `evaka-*`.** Vaihda oman kuntasi kuvioon. Jos välityspalvelimen, API-gatewayn ja palvelun lokit ovat eri indekseissä, kyselyt, jotka tarvitsevat kahta virtaa, on ajettava kuvion yli, joka kattaa molemmat.
- **Kenttien mappaus.** Kyselyissä käytetään muotoa `kentta.keyword`, joka on oikein, kun indeksointi on tehty oletusdynamiikalla (`text` + `keyword`-alikenttä). Jos kunnan mappaus on tehty käsin ja kentät ovat suoraan `keyword`-tyyppisiä, poista `.keyword`-pääte. Tarkista yhdellä komennolla: `GET evaka-*/_mapping/field/appName`.
- **`meta.deviceAuthHistorySize` on numero** ja `meta.eventCode` merkkijono. Jos dynaaminen mappaus on tulkinnut ensimmäisen kokonaisluvun `long`-tyypiksi, kaikki toimii; jos se on `text`, vaihda `max`-aggregaatio `terms`-aggregaatioksi.
- Kyselyt ajetaan **Dev Tools -konsolista** (`POST evaka-*/_search`). Ne on kirjoitettu aggregaatioiksi, joten tallennettu haku (*saved search*) ei olisi niille oikea muoto: tallennettu haku palauttaa dokumentteja, ei ryhmiteltyjä lukuja. Tarvittaessa aggregaatiot voi rakentaa Dashboardsin visualisointien kautta samoilla kentillä.
- Kyselyissä on `"size": 0`, koska yksikään niistä ei tarvitse yksittäisiä dokumentteja. Tämä on myös tietosuojan kannalta oikein: dokumenttien palauttaminen tarkastuslokista voisi tuoda mukanaan `targetId`-kentän, jossa on henkilötunnus tai sähköpostiosoite.

Kaikissa kyselyissä aikaväli annetaan `range`-suodattimessa; alla käytetään muotoa `now-7d`.

## 0. Esitarkistus: mitkä lokivirrat ovat olemassa

```json
POST evaka-*/_search
{
  "size": 0,
  "query": { "range": { "@timestamp": { "gte": "now-1d" } } },
  "aggs": {
    "sovellukset": {
      "terms": { "field": "appName.keyword", "size": 20 },
      "aggs": {
        "tyypit": { "terms": { "field": "type.keyword", "size": 10 } }
      }
    }
  }
}
```

Etsi tuloksesta `evaka-proxy`. Jos sitä ei ole, signaali 1 ei ole käytettävissä; tarkista ensin, kattaako indeksikuvio välityspalvelinsäiliön lokit.

Discover-näkymän DQL-vastine nopeaan silmäykseen: `appName: "evaka-proxy" and type: "app-requests-received"`.

## 1a. Käyttäjäagentit (signaali 1) — välityspalvelin

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-proxy" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-7d" } } }
      ]
    }
  },
  "aggs": {
    "agentit": {
      "terms": { "field": "userAgent.keyword", "size": 200, "order": { "_count": "desc" } },
      "aggs": {
        "ip_osoitteita": { "cardinality": { "field": "clientIp.keyword" } }
      }
    }
  }
}
```

Vain ei-selainagentit: lisää `bool`-lohkoon

```json
"must_not": [ { "wildcard": { "userAgent.keyword": "*Mozilla/*" } } ]
```

Väärä positiivinen: robotit ja kunnan omat testiajot. Väärä negatiivinen: selaimeksi tekeytyvä ohjelma.

## 1b. Käyttäjäagentti käyttäjää kohti (signaali 1) — liitos kahden virran välillä

OpenSearchissa ei ole join-operaatiota sen paremmin kuin Logs Insightsissakaan. `terms`-aggregaatio `traceId`-kentällä toimisi periaatteessa, mutta kymmenien miljoonien eri arvojen yli se on kallis ja epätarkka. Käytännössä toimiva tapa on kaksi kyselyä ja välivaihe:

**Kysely 1** — hae ei-selainagenttien `traceId`-arvot välityspalvelimen lokista:

```json
POST evaka-*/_search
{
  "size": 1000,
  "_source": ["traceId", "userAgent", "path"],
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-proxy" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-1d" } } }
      ],
      "must_not": [ { "wildcard": { "userAgent.keyword": "*Mozilla/*" } } ]
    }
  }
}
```

**Välivaihe** — poimi tuloksesta `traceId`-arvot (esimerkiksi `jq -r '.hits.hits[]._source.traceId'`) ja liitä ne seuraavaan kyselyyn. Käytä enintään noin tuhatta kerrallaan, koska `terms`-kysely on rajoitettu.

**Kysely 2** — hae samat pyynnöt API-gatewayn lokista ja laske eri kuntalaiset:

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "terms": { "traceId.keyword": ["LIITÄ", "TRACEID", "ARVOT", "TÄHÄN"] } }
      ]
    }
  },
  "aggs": {
    "kuntalaisia": { "cardinality": { "field": "userIdHash.keyword" } },
    "kayttajat": { "terms": { "field": "userIdHash.keyword", "size": 100 } }
  }
}
```

## 2. Uusi laite (signaali 2) — palvelu

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "type.keyword": "app-misc" } },
        { "term": { "meta.eventCode.keyword": "NEW_DEVICE_LOGIN" } },
        { "range": { "@timestamp": { "gte": "now-30d" } } }
      ]
    }
  },
  "aggs": {
    "kuntalaiset": {
      "terms": { "field": "meta.citizenIdHash.keyword", "size": 500, "order": { "_count": "desc" } },
      "aggs": {
        "suurin_historia": { "max": { "field": "meta.deviceAuthHistorySize" } },
        "vain_evasteettomat": {
          "bucket_selector": {
            "buckets_path": { "n": "_count", "maxh": "suurin_historia" },
            "script": "params.n >= 5 && params.maxh == 0"
          }
        }
      }
    }
  }
}
```

Tapahtuma syntyy vain salasana- ja passkey-kirjautumisessa, ei Suomi.fi-tunnistautumisessa. Väärä positiivinen: yksityinen selausikkuna, evästeiden tyhjennys. Väärä negatiivinen: laite-evästeen tarkoituksella säilyttävä ohjelma.

## 3a. Kirjautumistiheys (signaali 3) — API-gatewayn tarkastusloki

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-audit-events" } },
        { "term": { "eventCode.keyword": "evaka.citizen_weak.sign_in" } },
        { "range": { "@timestamp": { "gte": "now-7d" } } }
      ],
      "must_not": [ { "term": { "userIdHash.keyword": "" } } ]
    }
  },
  "aggs": {
    "kuntalaiset": {
      "terms": { "field": "userIdHash.keyword", "size": 500 },
      "aggs": {
        "per_vuorokausi": {
          "date_histogram": { "field": "@timestamp", "calendar_interval": "1d", "min_doc_count": 1 },
          "aggs": {
            "vain_tiheat": {
              "bucket_selector": {
                "buckets_path": { "n": "_count" },
                "script": "params.n > 20"
              }
            }
          }
        }
      }
    }
  }
}
```

Älä käytä palvelun tapahtumia `CitizenWeakLogin` tai `CitizenWeakLoginAttempt`: niiden `targetId` on kuntalaisen sähköpostiosoite selväkielisenä.

## 3b. Kirjautumisen rajoitin (signaali 3) — välityspalvelin

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-proxy" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "term": { "path.keyword": "/api/citizen/auth/weak-login" } },
        { "term": { "statusCode.keyword": "429" } },
        { "range": { "@timestamp": { "gte": "now-7d" } } }
      ]
    }
  },
  "aggs": {
    "osoitteet": {
      "terms": { "field": "clientIp.keyword", "size": 200 },
      "aggs": {
        "agentit": { "terms": { "field": "userAgent.keyword", "size": 5 } },
        "tunneittain": {
          "date_histogram": { "field": "@timestamp", "fixed_interval": "1h", "min_doc_count": 1 }
        }
      }
    }
  }
}
```

`statusCode` on välityspalvelimen ja API-gatewayn virroissa merkkijono, palvelun virrassa luku. Yllä oleva `term`-arvo on siksi `"429"` lainausmerkeissä.

## 4. auth/status puuttuu (signaali 4) — API-gateway

Tämä on OpenSearchissa suoraviivaisempi kuin Logs Insightsissa, koska `bucket_selector` osaa suodattaa ryhmiä alaryhmän arvon perusteella.

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-1d" } } }
      ],
      "must_not": [ { "term": { "userIdHash.keyword": "" } } ]
    }
  },
  "aggs": {
    "kuntalaiset": {
      "terms": { "field": "userIdHash.keyword", "size": 2000 },
      "aggs": {
        "status_kutsut": {
          "filter": { "term": { "path.keyword": "/api/citizen/auth/status" } }
        },
        "vain_ilman_statusta": {
          "bucket_selector": {
            "buckets_path": { "n": "_count", "s": "status_kutsut._count" },
            "script": "params.n >= 20 && params.s == 0"
          }
        }
      }
    }
  }
}
```

## 5a. Viiden minuutin ikkunat (signaali 5) — API-gateway

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-1d" } } }
      ],
      "must_not": [ { "term": { "userIdHash.keyword": "" } } ]
    }
  },
  "aggs": {
    "kuntalaiset": {
      "terms": { "field": "userIdHash.keyword", "size": 2000 },
      "aggs": {
        "ikkunat": {
          "date_histogram": { "field": "@timestamp", "fixed_interval": "5m", "min_doc_count": 1 }
        },
        "ikkunoita": { "stats_bucket": { "buckets_path": "ikkunat._count" } },
        "vain_tasaiset": {
          "bucket_selector": {
            "buckets_path": { "k": "ikkunoita.count" },
            "script": "params.k >= 50"
          }
        }
      }
    }
  }
}
```

Vuorokaudessa on 288 viiden minuutin ikkunaa; `ikkunoita.count` kertoo, kuinka moni niistä oli käytössä.

## 5b. Yöaktiivisuus (signaali 5) — API-gateway

Aikavyöhyke annetaan `date_histogram`-aggregaatiolle suoraan, joten raakatekstin jäsentämistä ei tarvita kuten Logs Insightsissa.

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-30d" } } }
      ],
      "must_not": [ { "term": { "userIdHash.keyword": "" } } ]
    }
  },
  "aggs": {
    "tunneittain": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "1h",
        "time_zone": "Europe/Helsinki",
        "min_doc_count": 1
      },
      "aggs": {
        "kuntalaiset": { "terms": { "field": "userIdHash.keyword", "size": 100 } }
      }
    }
  }
}
```

Lue tuloksesta ne tunnit, joiden avain osuu välille 02:00–04:59 Suomen aikaa, ja katso niiden alaryhmistä toistuvat `userIdHash`-arvot. Vaihtoehtoisesti rajaa suoraan kellonaikaan `script`-suodattimella, jos klusterissa on skriptaus sallittu.

## 5c. Variaatiokerroin (signaali 5) — API-gateway

Tämä on ainoa kohta, jossa OpenSearch pystyy siihen, mihin Logs Insights ei: `extended_stats_bucket` antaa keskiarvon ja keskihajonnan suoraan, joten variaatiokerrointa ei tarvitse laskea ulkopuolella. Huomaa kuitenkin, että tässä lasketaan **ikkunakohtaisten pyyntömäärien** hajonta, ei peräkkäisten pyyntöjen aikavälien hajontaa. Se on lähisukulainen, ei sama luku: tasaisesti pollaavalla ohjelmalla molemmat ovat lähellä nollaa, mutta ihmisen rypäskäytöllä ikkunamittari on hieman armollisempi.

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-1d" } } }
      ],
      "must_not": [ { "term": { "userIdHash.keyword": "" } } ]
    }
  },
  "aggs": {
    "kuntalaiset": {
      "terms": { "field": "userIdHash.keyword", "size": 500, "min_doc_count": 100 },
      "aggs": {
        "ikkunat": {
          "date_histogram": { "field": "@timestamp", "fixed_interval": "5m", "min_doc_count": 0 }
        },
        "hajonta": { "extended_stats_bucket": { "buckets_path": "ikkunat._count" } }
      }
    }
  }
}
```

Variaatiokerroin on `hajonta.std_deviation` jaettuna `hajonta.avg`-arvolla. Jos haluat aikavälien variaatiokertoimen täsmälleen samalla määritelmällä kuin `05c-aikaleimavienti.txt`, vie aikaleimat ulos ja käytä siinä tiedostossa olevaa Python-katkelmaa.

## 6. CSRF-tunnusmerkki (signaali 6) — API-gateway

Tämä vaatii liitoksen `traceId`-kentällä. Sitä ei voi tehdä yhdellä hakukyselyllä, mutta `traceId`-arvojen määrä on tässä pieni, koska kirjautumispyyntöjä on vähän. Kaksi kyselyä ja käsin tehtävä erotus:

**Kysely 1** — 403-vastauksen saaneet kirjautumispyynnöt:

```json
POST evaka-*/_search
{
  "size": 1000,
  "_source": ["traceId"],
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "term": { "httpMethod.keyword": "POST" } },
        { "term": { "path.keyword": "/api/citizen/auth/weak-login" } },
        { "term": { "statusCode.keyword": "403" } },
        { "range": { "@timestamp": { "gte": "now-30d" } } }
      ]
    }
  }
}
```

**Kysely 2** — samalta ajanjaksolta ne `traceId`-arvot, joilla tarkastustapahtuma kirjoitettiin:

```json
POST evaka-*/_search
{
  "size": 1000,
  "_source": ["traceId"],
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-audit-events" } },
        { "term": { "eventCode.keyword": "evaka.citizen_weak.sign_in_requested" } },
        { "range": { "@timestamp": { "gte": "now-30d" } } }
      ]
    }
  }
}
```

**Erotus** — kyselyn 1 tulosjoukko miinus kyselyn 2 tulosjoukko on niiden pyyntöjen määrä, joissa `x-evaka-csrf`-otsake puuttui:

```
comm -23 <(jq -r '.hits.hits[]._source.traceId' kysely1.json | sort -u) \
         <(jq -r '.hits.hits[]._source.traceId' kysely2.json | sort -u) | wc -l
```

Jos tuloksia on yli tuhat, käytä `search_after`- tai `scroll`-sivutusta. Signaali toimii vain POST-, PUT- ja DELETE-pyynnöillä, koska GET on vapautettu CSRF-tarkistuksesta.

## 7. Liikenteen perusluku — API-gateway, ja vain se

```json
POST evaka-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appName.keyword": "evaka-api-gw" } },
        { "term": { "type.keyword": "app-requests-received" } },
        { "prefix": { "path.keyword": "/api/citizen/" } },
        { "range": { "@timestamp": { "gte": "now-7d" } } }
      ]
    }
  },
  "aggs": {
    "vuorokausittain": {
      "date_histogram": { "field": "@timestamp", "calendar_interval": "1d", "time_zone": "Europe/Helsinki" },
      "aggs": {
        "kuntalaisia": { "cardinality": { "field": "userIdHash.keyword" } }
      }
    }
  }
}
```

`cardinality` laskee myös tyhjän merkkijonon yhdeksi arvoksi, jos tunnistautumattomia pyyntöjä on mukana; vähennä tarvittaessa yksi.
