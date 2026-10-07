# Risicomatrix-bouwer

Een zelfstandige GitHub Pages-app om stapsgewijs een risicomatrix op te bouwen en daarna direct toe te passen bij risicobeoordelingen.

## Functionaliteit

De gebruiker doorloopt zes stappen:

1. organisatiewaarden kiezen en benoemen;
2. aantal effectklassen kiezen, van 3 t/m 7;
3. effectbeschrijvingen per waarde en effectklasse invoeren;
4. aantal kansklassen kiezen, van 3 t/m 7;
5. kansklassen beschrijven;
6. per cel bepalen of het risico zeer laag, laag, middel, hoog of zeer hoog is.

Na stap 6 wordt de risicomatrix opgebouwd. Vervolgens kan deze direct worden gebruikt voor een beoordeling door één kansklasse en per waarde een effectklasse te kiezen.

De configuratie wordt lokaal in de browser opgeslagen. De gebruiker kan de configuratie ook exporteren als JSON en later weer importeren.

## Bestandsstructuur

```text
risicomatrix-bouwer/
├─ index.html
├─ assets/
│  ├─ styles.css
│  └─ app.js
├─ examples/
│  └─ voorbeeld-configuratie.json
├─ .gitignore
├─ .nojekyll
└─ README.md
```

## Publiceren met GitHub Pages

1. Maak op GitHub een nieuwe repository, bijvoorbeeld `risicomatrix-bouwer`.
2. Upload alle bestanden en mappen uit deze repository naar de `main` branch.
3. Ga in GitHub naar **Settings > Pages**.
4. Kies bij **Build and deployment** voor **Deploy from a branch**.
5. Kies branch **main** en map **/(root)**.
6. Sla de instelling op.

De pagina wordt daarna beschikbaar op een adres in de vorm:

```text
https://<gebruikersnaam>.github.io/risicomatrix-bouwer/
```

## Lokaal testen

Omdat de applicatie volledig uit HTML, CSS en JavaScript bestaat, is geen build-stap nodig. Je kunt `index.html` direct openen of de map met een eenvoudige lokale webserver serveren.

Bijvoorbeeld met Python:

```bash
python -m http.server 8000
```

Open daarna `http://localhost:8000`.

## Voorbeeldconfiguratie

In `examples/voorbeeld-configuratie.json` staat een eenvoudige 5 x 5 voorbeeldmatrix. Deze kun je via **Configuratie importeren** in de applicatie laden.

## Techniek

De applicatie gebruikt alleen browsertechnologie:

- HTML5
- CSS3
- vanilla JavaScript
- `localStorage` voor lokale opslag
- JSON-import en -export voor overdraagbare configuraties

Er zijn geen externe libraries, accounts, databases of API's nodig.
