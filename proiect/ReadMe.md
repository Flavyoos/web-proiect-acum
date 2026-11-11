# CineRadar — Căutător de Filme și Seriale

Aplicație web scrisă în **React 19**, cu **Vite** ca server de dezvoltare și build.
(Prima versiune, în HTML/CSS/JavaScript vanilla, se găsește în istoricul git: commit-ul `ecb978f`.)

Homepage-ul are:
- o zonă **hero** cu formularul de căutare;
- o grilă de **12 sugestii** (6 filme, 6 seriale) încărcate din OMDb, cu poster, rating IMDb și tip;
- **filtre** Toate / Filme / Seriale;
- butonul **„Surprinde-mă”**, care alege o sugestie la întâmplare;
- un **card de detalii** (gen, rating, descriere) afișat la căutare sau la click pe o sugestie, care se poate închide cu „×”;
- butonul **„Unde îl pot viziona?”**, care deschide JustWatch România cu platformele legale pe care e disponibil titlul, plus un link către pagina IMDb.

## Pornire

Ai nevoie de [Node.js](https://nodejs.org/) instalat. Din folderul `proiect`:

```bash
npm install     # o singură dată: instalează React și Vite în node_modules/
npm run dev     # pornește aplicația (de obicei la http://localhost:5173)
```

Alte comenzi:

```bash
npm run build   # creează versiunea finală, optimizată, în dist/
npm run preview # servește local versiunea din dist/
npm run lint    # verifică codul cu oxlint
```

Cheia API OMDb este setată în `src/api/omdb.js` (`const API_KEY = "...";`). Pentru o cheie nouă: [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx).

## Structura proiectului

```
proiect
├── index.html                → pagina goală cu <div id="root">, în care React desenează aplicația
├── package.json              → dependențele (react, react-dom, vite) și comenzile npm
├── vite.config.js            → configurarea Vite + plugin-ul React
└── src
    ├── main.jsx              → punctul de intrare: montează <App /> în #root
    ├── App.jsx               → starea aplicației: rezultat, sugestii, card ales
    ├── index.css             → design responsive: Flexbox, CSS Grid, media queries, animații
    ├── api/omdb.js           → fetch către OMDb, cache în sessionStorage, mesaje de eroare
    └── components
        ├── SearchForm.jsx    → formularul de căutare (input controlat)
        ├── MovieCard.jsx     → cardul de detalii
        ├── Suggestions.jsx   → filtrele, „Surprinde-mă” și grila
        └── SuggestionCard.jsx→ un card din grilă
```

## Cum circulă datele

**Căutare:**
```
input (useState)  →  onSubmit + preventDefault()  →  fetchOmdb({ t: titlu })  →  fetch + response.json()
     →  setResult({ kind: "movie", movie })  →  React redesenează  →  <MovieCard /> în .results
```

**Sugestii:**
```
useEffect(..., [])  →  SUGGESTIONS.map(id => fetchOmdb({ i: id }))  →  Promise.allSettled()
     →  setSuggestions(movies)  →  <SuggestionCard /> pentru fiecare film
     →  onClick  →  handlePick(movie)  →  setResult(...)  →  <MovieCard />
```

1. **Formular** – valoarea input-ului stă în state (`useState`); la submit, `event.preventDefault()` oprește reîncărcarea paginii.
2. **Cerere** – `fetchOmdb()` construiește URL-ul cu `URLSearchParams` și apelează `fetch()`; `await` așteaptă răspunsul fără să blocheze pagina.
3. **Parsare** – `response.json()` transformă textul JSON în obiect JavaScript; dacă `Response === "False"`, funcția face `throw`.
4. **Cache** – răspunsurile reușite sunt salvate în `sessionStorage`, ca refresh-ul să nu consume din limita de 1.000 de cereri/zi.
5. **Afișare** – schimbarea state-ului face ca React să redeseneze componentele; nu mai modificăm DOM-ul de mână.

## De la vanilla JS la React

| Vanilla JS | React |
|---|---|
| `document.getElementById` + variabile globale | `useState` în `App.jsx` |
| `createElement` + `append` + `replaceChildren` | JSX returnat de componente |
| `addEventListener("submit" / "click")` | `onSubmit`, `onClick` |
| event delegation pe grilă | fiecare card primește `onPick` prin props |
| `classList.toggle("is-active")` | `className` calculat din state |
| `loadSuggestions()` la final de script | `useEffect(() => ..., [])` |
| `class`, `for` în HTML | `className`, `htmlFor` în JSX |
| `textContent` (protecție la HTML injectat) | `{text}` în JSX, escapat automat |

## Idei de extindere

- Căutare cu mai multe rezultate folosind parametrul `s=` în loc de `t=` (returnează un array `Search`), afișate în aceeași grilă.
- Listă de „favorite” salvată în `localStorage`.
- Plot complet în cardul de detalii, cu parametrul `plot=full`.
- Pagini separate pentru fiecare film cu React Router.
