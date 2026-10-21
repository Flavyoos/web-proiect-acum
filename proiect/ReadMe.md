# CineRadar — Căutător de Filme și Seriale

Aplicație web scrisă exclusiv în **HTML5, CSS vanilla și JavaScript vanilla** (fără framework-uri), pentru recapitularea conceptelor de bază.

Homepage-ul are:
- o zonă **hero** cu formularul de căutare;
- o grilă de **12 sugestii** (6 filme, 6 seriale) încărcate din OMDb, cu poster, rating IMDb și tip;
- **filtre** Toate / Filme / Seriale;
- butonul **„Surprinde-mă”**, care alege o sugestie la întâmplare;
- un **card de detalii** (gen, rating, descriere) afișat la căutare sau la click pe o sugestie, care se poate închide cu „×”;
- butonul **„Unde îl pot viziona?”**, care deschide JustWatch România cu platformele legale pe care e disponibil titlul, plus un link către pagina IMDb.

## Structura proiectului

```
proiect
├── index.html   → structura semantică (header/hero, main, form, section, footer)
├── style.css    → design responsive: Flexbox, CSS Grid, media queries, animații
├── script.js    → submit, fetch() asincron, sugestii, filtre, creare de elemente în DOM
└── ReadMe.md
```

## Pornire

1. Cheia API OMDb este deja setată în `script.js` (`const API_KEY = "...";`). Pentru o cheie nouă: [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx).
2. Deschide `index.html` în browser (sau folosește extensia **Live Server** din VS Code).

## Cum circulă datele

**Căutare:**
```
input.value  →  submit + preventDefault()  →  fetchOmdb({ t: titlu })  →  fetch + response.json()
     →  obiect JS { Title, Plot, Poster, ... }  →  createElement + append  →  card în #results
```

**Sugestii:**
```
SUGGESTIONS (ID-uri IMDb)  →  .map(id => fetchOmdb({ i: id }))  →  Promise.allSettled()
     →  Map moviesById  →  createSuggestionCard()  →  grila #suggestions-grid
     →  click (event delegation)  →  moviesById.get(id)  →  renderCard()  →  #results
```

1. **Formular** – utilizatorul scrie un titlu și apasă „Caută” (sau Enter); `event.preventDefault()` oprește reîncărcarea paginii.
2. **Cerere** – `fetchOmdb()` construiește URL-ul cu `URLSearchParams` și apelează `fetch()`; `await` așteaptă răspunsul fără să blocheze pagina.
3. **Parsare** – `response.json()` transformă textul JSON în obiect JavaScript; dacă `Response === "False"`, funcția face `throw`.
4. **Cache** – răspunsurile reușite sunt salvate în `sessionStorage`, ca refresh-ul să nu consume din limita de 1.000 de cereri/zi.
5. **DOM** – `document.createElement()` + `textContent` + `append()`; `replaceChildren()` pune rezultatul în pagină.

## Concepte recapitulate

| Domeniu | Concepte |
|---|---|
| HTML5 | etichete semantice, `role="search"`, `<label for>`, `required`, atribute `data-*`, `aria-live`, `aria-pressed`, `aria-labelledby` |
| CSS | variabile `:root`, Flexbox, CSS Grid cu `repeat(auto-fill, minmax())`, `aspect-ratio`, `object-fit`, `position: absolute` în `relative`, `:empty`, `:focus-visible`, `clamp()`, `@media`, `prefers-reduced-motion`, `@keyframes` |
| JavaScript | `addEventListener`, `preventDefault`, `async/await`, `fetch`, `try/catch/finally`, `throw`, `Promise.allSettled`, `URLSearchParams`, `Map`, `dataset`, `classList.toggle`, **event delegation** + `closest()`, `Math.random`, `scrollIntoView`, `new URL()` + `searchParams`, `target="_blank"` + `rel="noopener"`, `sessionStorage`, `textContent` vs `innerHTML` |

## Idei de extindere

- Căutare cu mai multe rezultate folosind parametrul `s=` în loc de `t=` (returnează un array `Search`), afișate în aceeași grilă.
- Listă de „favorite” salvată în `localStorage`.
- Plot complet în cardul de detalii, cu parametrul `plot=full`.
