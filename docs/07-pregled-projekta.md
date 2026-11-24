# 07 – Pregled projekta

Pregled projekta Volunteero ob prevzemu: dokumentacija (`docs/01`–`06`, ADR), koda v mapah `backend/` in `frontend/` ter lokalni zagon po navodilih iz `README.md`.

## Lokalni zagon

Aplikacija se po navodilih iz README-ja zažene brez težav: MongoDB na `localhost:27017`, `npm run skrbnik` ustvari skrbnika, backend teče na `:5050`, frontend na `:5173`. Prvi koraki iz README-ja (potrditev študenta, odobritev organizacije, objava akcije, prijava in sprejem) delujejo.

## Implementirane funkcionalnosti MVP

| ID | Funkcionalnost | Stanje | Opomba |
|---|---|---|---|
| F1 | Registracija in prijava z vlogami | ✔ | JWT z ID-jem in vlogo, bcrypt, preverjanje vlog na API-ju. Prijava ne preveri polja `aktiven`, zato se lahko prijavi tudi deaktiviran uporabnik. |
| F2 | Potrjevanje študentov in odobritev organizacij | ✔ | Potrditev, zavrnitev in deaktivacija delujejo. |
| F3 | Objava akcije | ✔ | Validacija obveznih polj, datumov in števila mest. |
| F4 | Prijava s preverjanjem prekrivanja | ✔ | Preverjanje prekrivanja s potrjenimi akcijami, dvojna prijava ni mogoča. |
| F5 | Sprejem prijave in razrešitev konflikta | ✔ | Statusi `POTRJENA`, `KONFLIKT`, `CAKALNA_VRSTA`; študent izbere, katero akcijo obdrži. |
| F6 | Udeležba in izračun ur | ✔ | Ure = trajanje akcije, šele po koncu akcije. |
| F7 | Čakalna vrsta s samodejnim napredovanjem | delno | Napredovanje po `nastopVVrsto` in preskok prekrivanj delujeta; manjkata atomarna dodelitev mesta in samodejni preklic vrste ob začetku akcije (glej US-11). |

Vseh 7 funkcionalnosti MVP je implementiranih, F7 delno.

## Pregled uporabniških zgodb

Pregledanih je 5 zgodb z domenskimi funkcionalnostmi MVP.

### US-04 – Potrditev študenta (F2) – delno

| Kriterij | Stanje | Opomba |
|---|---|---|
| 1. Seznam nepotrjenih študentov z vpisno številko | ✔ | `GET /api/skrbnik/uporabniki` |
| 2. Po potrditvi se študent lahko prijavlja | ✔ | |
| 3. Po zavrnitvi se račun deaktivira | delno | `aktiven = false` se nastavi, vendar `POST /api/vpis` tega ne preveri: zavrnjen študent se še vedno lahko prijavi v sistem (na akcije pa ne, ker ni potrjen). |
| 4. Nepotrjen študent se ne more prijaviti na akcijo (P1) | ✔ | |

### US-07 – Prijava na akcijo (F4) – ustreza

| Kriterij | Stanje | Opomba |
|---|---|---|
| 1. Le na `OBJAVLJENA` akcijo pred začetkom, status `ODDANA` | ✔ | |
| 2. Prekrivanje s potrjeno akcijo onemogoči prijavo (P4) | ✔ | Sporočilo navede akcijo, s katero se prekriva. |
| 3. Akciji, ki se le stikata, se ne prekrivata | ✔ | Stroga primerjava `A.zacetek < B.konec && B.zacetek < A.konec`. |
| 4. Dvojna prijava ni mogoča | ✔ | Preverjanje v API-ju in unikatni indeks `studentId + akcijaId`. |

### US-08 – Pregled in sprejem prijav (F5, F11) – ustreza

| Kriterij | Stanje | Opomba |
|---|---|---|
| 1. Prijave na akcijo, razvrščene po statusu | ✔ | |
| 2. Prosto mesto, brez prekrivanja → `POTRJENA` (P5) | ✔ | |
| 3. Prekrivanje → `KONFLIKT` (P6) | ✔ | Prijava v konfliktu zasede mesto. |
| 4. Polna akcija → `CAKALNA_VRSTA` (P3) | ✔ | Nastavi se tudi `nastopVVrsto`. |
| 5. Zavrnitev → `ZAVRNJENA` | ✔ | |

### US-10 – Označevanje udeležbe (F6) – ustreza

| Kriterij | Stanje | Opomba |
|---|---|---|
| 1. Šele po koncu akcije | ✔ | |
| 2. Status `UDELEZEN` | ✔ | |
| 3. `ure` = trajanje akcije (P8) | ✔ | Pri akciji, ki ne traja celih ur, so ure decimalne (npr. 2,5). |
| 4. Akcija dobi status `ZAKLJUCENA` | ✔ | Nastavi se že ob prvi označeni udeležbi; ostale prijave je še vedno mogoče označiti. |

### US-11 – Napredovanje s čakalne vrste (F7) – delno

| Kriterij | Stanje | Opomba |
|---|---|---|
| 1. Ob sproščenem mestu pregled vrste po `nastopVVrsto` | ✔ | Sproži se ob preklicu in razrešitvi konflikta, tudi verižno na drugi akciji. |
| 2. Potrdi se prvi brez prekrivanja | ✔ | |
| 3. Študent s prekrivanjem se preskoči in obdrži mesto | ✔ | |
| 4. Število potrjenih nikoli ne preseže `steviloMest` | ✗ | Zasedenost se prešteje, potrditev pa je ločena posodobitev, ki preveri le status kandidata, ne prostega mesta. Ob hkratnih preklicih ali sprejemih lahko dva študenta dobita isto mesto (enako pri `PATCH /prijave/:id/sprejmi`). |
| 5. Ob začetku akcije se preostale prijave v vrsti prekličejo (P12) | ✗ | Ni implementirano: ni opravila ob začetku akcije, prijave ostanejo v statusu `CAKALNA_VRSTA`. |

## Povzetek

Projekt pokriva vse funkcionalnosti MVP, dokumentacija in koda se večinoma ujemata. Od petih pregledanih zgodb tri (US-07, US-08, US-10) v celoti ustrezajo pogojem sprejemljivosti, dve (US-04, US-11) delno. Odprte točke:

1. Prijava v sistem ne preveri `aktiven` (US-04, kriterij 3).
2. Dodelitev mesta ni atomarna (US-11, kriterij 4).
3. Samodejni preklic čakalne vrste ob začetku akcije manjka (US-11, kriterij 5, P12).

Za nadaljnje delo (CI/CD) je pomembno še: projekt nima testov, backend nima linterja, URL API-ja je v `frontend/src/api.js` zapisan fiksno (`http://localhost:5050/api`), baza pa je lokalna.
