// =========================================================
// 0. CONFIGURARE
// =========================================================
// Cheia API personală OMDb (gratuită, de la https://www.omdbapi.com/apikey.aspx).
// Planul gratuit are o limită de 1.000 de cereri pe zi.
const API_KEY = "c9c93fd1";
const API_URL = "https://www.omdbapi.com/";

// Sugestiile de pe homepage, identificate prin ID-ul IMDb (parametrul "i").
// ID-ul e mai sigur decât titlul: "Dark" sau "The Office" au mai multe variante.
const SUGGESTIONS = [
  "tt1375666", // Inception
  "tt0903747", // Breaking Bad
  "tt0816692", // Interstellar
  "tt0944947", // Game of Thrones
  "tt0468569", // The Dark Knight
  "tt7366338", // Chernobyl
  "tt6751668", // Parasite
  "tt4574334", // Stranger Things
  "tt0245429", // Spirited Away
  "tt5753856", // Dark
  "tt0111161", // The Shawshank Redemption
  "tt0386676", // The Office
];

// =========================================================
// 1. SELECTAREA ELEMENTELOR DIN DOM
// =========================================================
// Le căutăm o singură dată și le păstrăm în constante.
const form = document.getElementById("search-form");
const input = document.getElementById("movie-input");
const searchButton = form.querySelector("button");
const results = document.getElementById("results");
const grid = document.getElementById("suggestions-grid");
const randomButton = document.getElementById("random-btn");
// querySelectorAll returnează o NodeList (seamănă cu un array, are .forEach)
const filterButtons = document.querySelectorAll(".filter");

// STAREA aplicației, ținută în variabile JS:
// un Map "imdbID -> obiectul filmului", ca la click pe o sugestie să avem
// datele deja la îndemână, fără un nou fetch.
const moviesById = new Map();
let currentFilter = "all";

// =========================================================
// 2. FETCH CĂTRE OMDb (funcție reutilizabilă)
// =========================================================
// O folosim și la căutare ({ t: "titlu" }), și la sugestii ({ i: "tt..." }).
async function fetchOmdb(params) {
  // Cache în sessionStorage: dacă am cerut deja aceleași date în acest tab,
  // nu mai consumăm o cerere din limita zilnică.
  const cacheKey = "omdb:" + new URLSearchParams(params).toString();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  // URLSearchParams construiește query string-ul ȘI codifică automat
  // caracterele speciale (spații, ă, &...). Echivalent cu encodeURIComponent.
  // { t: "Star Wars", apikey: "..." } -> "t=Star+Wars&apikey=..."
  const query = new URLSearchParams({ ...params, apikey: API_KEY });

  // "await" pune funcția pe pauză până vine răspunsul, FĂRĂ să blocheze pagina.
  const response = await fetch(`${API_URL}?${query}`);

  // Corpul răspunsului e text JSON -> response.json() îl transformă în obiect JS.
  // OMDb trimite JSON chiar și la erori (ex. cheie invalidă, status 401),
  // de aceea citim JSON-ul înainte de orice altă verificare.
  const data = await response.json();

  // OMDb semnalează erorile prin { "Response": "False", "Error": "..." }.
  // "throw" oprește funcția și trimite eroarea la blocul catch al apelantului.
  if (data.Response === "False") {
    throw new Error(data.Error);
  }

  writeCache(cacheKey, data);
  return data;
}

// =========================================================
// 3. CĂUTAREA DIN FORMULAR
// =========================================================
// "submit" se declanșează și la click pe buton, și la Enter în input.
form.addEventListener("submit", (event) => {
  // Comportamentul implicit al unui formular = reîncărcarea paginii.
  // preventDefault() îl oprește, ca să facem noi cererea cu fetch().
  event.preventDefault();

  // FLUXUL DATELOR, pasul 1: citim textul introdus de utilizator.
  // .value = conținutul curent al input-ului; .trim() scoate spațiile de la capete.
  const query = input.value.trim();

  if (query === "") {
    showMessage("Te rog introdu un titlu.", true);
    return;
  }

  // FLUXUL DATELOR, pasul 2: trimitem textul către funcția asincronă.
  searchMovie(query);
});

async function searchMovie(title) {
  showMessage("Se caută...");
  searchButton.disabled = true;

  try {
    // FLUXUL DATELOR, pasul 3-4: fetch + parsare JSON (în fetchOmdb).
    const movie = await fetchOmdb({ t: title });

    // FLUXUL DATELOR, pasul 5: obiectul JS devine HTML în pagină.
    renderCard(movie);
    clearPicked();
  } catch (error) {
    // TypeError = fetch() n-a putut contacta serverul (fără internet etc.).
    // Altfel e o eroare trimisă de OMDb (prin "throw" din fetchOmdb).
    console.error("Eroare la căutare:", error);
    const text = error instanceof TypeError
      ? "Nu s-a putut contacta serverul. Verifică conexiunea la internet."
      : translateError(error.message);
    showMessage(text, true);
  } finally {
    // "finally" rulează mereu, indiferent de succes sau eroare.
    searchButton.disabled = false;
  }
}

// =========================================================
// 4. ÎNCĂRCAREA SUGESTIILOR (mai multe fetch-uri în paralel)
// =========================================================
async function loadSuggestions() {
  // Cât timp așteptăm, afișăm "schelete" gri animate.
  renderSkeletons(SUGGESTIONS.length);

  // .map() creează un array de Promise-uri — toate cererile pornesc DEODATĂ.
  // Promise.allSettled() așteaptă să se termine toate, chiar dacă unele eșuează
  // (Promise.all s-ar opri la prima eroare și am pierde și sugestiile bune).
  const outcomes = await Promise.allSettled(
    SUGGESTIONS.map((id) => fetchOmdb({ i: id }))
  );

  // Fiecare rezultat are forma { status: "fulfilled", value } sau
  // { status: "rejected", reason }. Păstrăm doar valorile reușite.
  const movies = outcomes
    .filter((outcome) => outcome.status === "fulfilled")
    .map((outcome) => outcome.value);

  if (movies.length === 0) {
    const p = document.createElement("p");
    p.className = "message message--error";
    p.textContent = "Sugestiile nu au putut fi încărcate.";
    grid.replaceChildren(p);
    randomButton.disabled = true;
    return;
  }

  // Salvăm fiecare film în Map, după ID, pentru click-urile ulterioare.
  movies.forEach((movie) => moviesById.set(movie.imdbID, movie));

  // Transformăm fiecare obiect în element HTML și le punem pe toate în grilă.
  // "..." (spread) desface array-ul în argumente separate pentru replaceChildren.
  const cards = movies.map(createSuggestionCard);
  grid.replaceChildren(...cards);

  applyFilter(currentFilter);
}

// Creează UN card de sugestie (un <button>, deci e accesibil și din tastatură).
function createSuggestionCard(movie, index) {
  const { imdbID, Title, Year, Type, Poster, imdbRating } = movie;

  const card = document.createElement("button");
  card.type = "button";
  card.className = "suggestion";
  // dataset.id -> atributul HTML data-id="tt..."; dataset.type -> data-type="movie"
  // Le citim mai târziu la click și la filtrare.
  card.dataset.id = imdbID;
  card.dataset.type = Type;
  // Întârziere progresivă a animației: cardurile apar unul după altul.
  card.style.animationDelay = `${index * 40}ms`;

  // --- Posterul + badge-urile peste el ---
  const posterWrap = document.createElement("div");
  posterWrap.className = "suggestion__poster-wrap";

  if (Poster && Poster !== "N/A") {
    const img = document.createElement("img");
    img.className = "suggestion__poster";
    img.src = Poster;
    img.alt = ""; // decorativ: titlul e scris oricum dedesubt
    img.loading = "lazy";
    posterWrap.append(img);
  } else {
    const empty = document.createElement("div");
    empty.className = "suggestion__poster suggestion__poster--empty";
    empty.textContent = "Poster indisponibil";
    posterWrap.append(empty);
  }

  if (imdbRating && imdbRating !== "N/A") {
    const rating = document.createElement("span");
    rating.className = "suggestion__badge suggestion__badge--rating";
    rating.textContent = `★ ${imdbRating}`;
    posterWrap.append(rating);
  }

  const typeBadge = document.createElement("span");
  typeBadge.className = "suggestion__badge suggestion__badge--type";
  typeBadge.textContent = typeLabel(Type);
  posterWrap.append(typeBadge);

  // --- Titlu + an ---
  const info = document.createElement("div");
  info.className = "suggestion__info";

  const title = document.createElement("h3");
  title.className = "suggestion__title";
  title.textContent = Title;

  const year = document.createElement("p");
  year.className = "suggestion__year";
  year.textContent = Year;

  info.append(title, year);
  card.append(posterWrap, info);
  return card;
}

// =========================================================
// 5. INTERACTIVITATE: click pe sugestii, filtre, "Surprinde-mă"
// =========================================================

// EVENT DELEGATION: un SINGUR listener pe grilă, nu câte unul pe fiecare card.
// Click-ul "urcă" (bubbling) de la elementul apăsat până la grilă;
// .closest(".suggestion") găsește cardul din care a pornit click-ul.
// Avantaj: funcționează și pentru carduri adăugate ulterior.
grid.addEventListener("click", (event) => {
  const card = event.target.closest(".suggestion");
  if (!card) return; // click în afara unui card

  const movie = moviesById.get(card.dataset.id);
  if (!movie) return;

  renderCard(movie);
  markPicked(card);

  // Derulăm pagina până la card (lin, datorită scroll-behavior din CSS).
  results.scrollIntoView({ block: "start" });
});

// Filtrele: la click, citim data-filter al butonului apăsat.
filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

function applyFilter(filter) {
  currentFilter = filter;

  // Actualizăm aspectul butoanelor: classList.toggle(clasă, condiție)
  // adaugă clasa dacă condiția e true și o scoate dacă e false.
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive);
  });

  // Ascundem cardurile care nu se potrivesc filtrului.
  grid.querySelectorAll(".suggestion").forEach((card) => {
    const matches = filter === "all" || card.dataset.type === filter;
    card.classList.toggle("is-hidden", !matches);
  });
}

// "Surprinde-mă": alege la întâmplare un card VIZIBIL (respectă filtrul activ).
randomButton.addEventListener("click", () => {
  // [...NodeList] transformă NodeList-ul într-un array adevărat.
  let candidates = [...grid.querySelectorAll(".suggestion:not(.is-hidden)")];

  // Evităm să alegem de două ori la rând același card.
  if (candidates.length > 1) {
    candidates = candidates.filter((card) => !card.classList.contains("is-picked"));
  }
  if (candidates.length === 0) return;

  // Math.random() dă un număr în [0, 1) -> îl transformăm într-un index valid.
  const randomIndex = Math.floor(Math.random() * candidates.length);

  // .click() simulează un click: refolosim exact logica din event delegation.
  candidates[randomIndex].click();
});

function markPicked(card) {
  clearPicked();
  card.classList.add("is-picked");
}

function clearPicked() {
  grid.querySelectorAll(".is-picked").forEach((el) => el.classList.remove("is-picked"));
}

// =========================================================
// 6. MANIPULAREA DOM-ULUI — cardul de detalii
// =========================================================
// Creăm fiecare element cu document.createElement(), îi setăm conținutul
// cu textContent și îl atașăm cu append(). Folosim textContent (nu innerHTML)
// pentru că textul vine de la un server extern: textContent îl tratează
// strict ca text, deci nu se poate executa cod HTML/JS injectat.
function renderCard(movie) {
  // Destructurare: extragem din obiectul JSON doar câmpurile de care avem nevoie.
  const { Title, Year, Type, Genre, Plot, Poster, imdbRating, imdbID } = movie;

  // <article> = bucată de conținut independentă (potrivit pentru un card)
  const card = document.createElement("article");
  card.className = "movie-card";

  // --- Butonul de închidere ---
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "movie-card__close";
  closeButton.setAttribute("aria-label", "Închide detaliile");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    results.replaceChildren(); // fără argumente = golește containerul
    clearPicked();
  });

  // --- Posterul ---
  // OMDb returnează "N/A" când nu are imagine -> afișăm un placeholder.
  let posterEl;
  if (Poster && Poster !== "N/A") {
    posterEl = document.createElement("img");
    posterEl.src = Poster;
    posterEl.alt = `Posterul pentru ${Title}`;
  } else {
    posterEl = document.createElement("div");
    posterEl.classList.add("movie-card__poster--empty");
    posterEl.textContent = "Poster indisponibil";
  }
  posterEl.classList.add("movie-card__poster");

  // --- Zona de text ---
  const body = document.createElement("div");
  body.className = "movie-card__body";

  const titleEl = document.createElement("h2");
  titleEl.className = "movie-card__title";
  titleEl.textContent = Title;

  // Construim linia de detalii doar din valorile care există (nu "N/A").
  const metaParts = [typeLabel(Type), Year, Genre];
  if (imdbRating && imdbRating !== "N/A") metaParts.push(`★ ${imdbRating}`);
  const metaEl = document.createElement("p");
  metaEl.className = "movie-card__meta";
  metaEl.textContent = metaParts.filter((part) => part && part !== "N/A").join(" · ");

  const plotEl = document.createElement("p");
  plotEl.textContent = Plot && Plot !== "N/A" ? Plot : "Descrierea nu este disponibilă.";

  // --- Butoanele de sub descriere ---
  const actions = document.createElement("div");
  actions.className = "movie-card__actions";

  // Buton principal: JustWatch România arată pe ce platforme LEGALE
  // (Netflix, HBO Max, Prime Video...) poate fi vizionat titlul.
  // new URL() + searchParams.set() construiesc link-ul și codifică automat titlul.
  const watchUrl = new URL("https://www.justwatch.com/ro/search");
  watchUrl.searchParams.set("q", Title);
  actions.append(createLinkButton("Unde îl pot viziona?", watchUrl.href, "btn btn--primary"));

  // Buton secundar: pagina IMDb (trailer, distribuție, recenzii).
  if (imdbID) {
    actions.append(
      createLinkButton("Pagina IMDb", `https://www.imdb.com/title/${imdbID}/`, "btn btn--secondary")
    );
  }

  // --- Asamblarea: copiii intră în părinți ---
  body.append(titleEl, metaEl, plotEl, actions);
  card.append(closeButton, posterEl, body);

  // replaceChildren() înlocuiește ce era înainte în container cu noul card.
  results.replaceChildren(card);
}

// =========================================================
// 7. FUNCȚII AJUTĂTOARE
// =========================================================

// Afișează un mesaj simplu (încărcare sau eroare) în containerul de rezultate.
function showMessage(text, isError = false) {
  const p = document.createElement("p");
  p.className = isError ? "message message--error" : "message";
  p.textContent = text;
  results.replaceChildren(p);
}

// Pune în grilă N "schelete" de încărcare.
function renderSkeletons(count) {
  // Array.from({ length: n }, fn) creează un array de n elemente generate de fn.
  const skeletons = Array.from({ length: count }, () => {
    const div = document.createElement("div");
    div.className = "skeleton";
    return div;
  });
  grid.replaceChildren(...skeletons);
}

// Creează un link <a> stilizat ca buton, care se deschide într-un tab nou.
// (Folosim <a>, nu <button>: navigarea către altă pagină e treaba unui link.)
function createLinkButton(text, href, className) {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = text;
  link.target = "_blank";   // deschide într-un tab nou
  link.rel = "noopener";    // securitate: pagina nouă nu primește acces la window.opener
  return link;
}

function typeLabel(type) {
  return type === "series" ? "Serial" : "Film";
}

// Traduce cele mai comune erori OMDb în română.
function translateError(error) {
  const messages = {
    "Movie not found!": "Nu am găsit niciun film sau serial cu acest titlu.",
    "Invalid API key!": "Cheie API invalidă. Verifică constanta API_KEY din script.js.",
    "No API key provided.": "Lipsește cheia API din script.js.",
    "Request limit reached!": "Ai atins limita zilnică de cereri pentru cheia API.",
  };
  return messages[error] || `Eroare: ${error}`;
}

// sessionStorage păstrează date doar cât e deschis tab-ul.
// try/catch: în modul privat sau cu stocarea blocată, accesul poate arunca erori,
// iar aplicația trebuie să meargă și fără cache.
function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorăm: cache-ul e doar un bonus
  }
}

// =========================================================
// 8. PORNIREA APLICAȚIEI
// =========================================================
// Scriptul e la finalul <body>, deci DOM-ul există deja -> putem porni direct.
loadSuggestions();
