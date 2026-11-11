// =========================================================
// Comunicarea cu OMDb API (fără nimic specific React aici)
// =========================================================
// Cheia API personală OMDb (gratuită, de la https://www.omdbapi.com/apikey.aspx).
// Planul gratuit are o limită de 1.000 de cereri pe zi.
const API_KEY = "c9c93fd1";
const API_URL = "https://www.omdbapi.com/";

// Sugestiile de pe homepage, identificate prin ID-ul IMDb (parametrul "i").
export const SUGGESTIONS = [
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

// Cererile aflate "în zbor": dacă aceeași cerere e pornită de două ori
// în același timp (React StrictMode rulează efectele de 2 ori în dezvoltare),
// a doua primește aceeași Promise, deci nu consumăm o cerere în plus.
const pending = new Map();

export function fetchOmdb(params) {
  const cacheKey = "omdb:" + new URLSearchParams(params).toString();

  const cached = readCache(cacheKey);
  if (cached) return Promise.resolve(cached);
  if (pending.has(cacheKey)) return pending.get(cacheKey);

  const request = (async () => {
    const query = new URLSearchParams({ ...params, apikey: API_KEY });
    const response = await fetch(`${API_URL}?${query}`);
    // OMDb trimite JSON chiar și la erori, deci îl citim înainte de verificări.
    const data = await response.json();

    if (data.Response === "False") {
      throw new Error(data.Error);
    }

    writeCache(cacheKey, data);
    return data;
  })().finally(() => pending.delete(cacheKey));

  pending.set(cacheKey, request);
  return request;
}

// Transformă o eroare (de rețea sau de la OMDb) într-un mesaj în română.
export function errorMessage(error) {
  // TypeError = fetch() n-a putut contacta serverul (fără internet etc.).
  if (error instanceof TypeError) {
    return "Nu s-a putut contacta serverul. Verifică conexiunea la internet.";
  }
  const messages = {
    "Movie not found!": "Nu am găsit niciun film sau serial cu acest titlu.",
    "Invalid API key!": "Cheie API invalidă. Verifică constanta API_KEY din src/api/omdb.js.",
    "No API key provided.": "Lipsește cheia API din src/api/omdb.js.",
    "Request limit reached!": "Ai atins limita zilnică de cereri pentru cheia API.",
  };
  return messages[error.message] || `Eroare: ${error.message}`;
}

export function typeLabel(type) {
  return type === "series" ? "Serial" : "Film";
}

// OMDb pune "N/A" când un câmp lipsește.
export function hasValue(value) {
  return Boolean(value) && value !== "N/A";
}

// sessionStorage păstrează date doar cât e deschis tab-ul.
// try/catch: în modul privat accesul poate arunca erori, iar aplicația
// trebuie să meargă și fără cache.
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
