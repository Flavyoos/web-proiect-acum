import { useEffect, useRef, useState } from "react";
import { SUGGESTIONS, errorMessage, fetchOmdb } from "./api/omdb.js";
import SearchForm from "./components/SearchForm.jsx";
import MovieCard from "./components/MovieCard.jsx";
import Suggestions from "./components/Suggestions.jsx";

export default function App() {
  // STAREA aplicației. Când se schimbă, React redesenează singur ce trebuie
  // (nu mai apelăm createElement / replaceChildren de mână).
  // result: null | { kind: "message", text, isError } | { kind: "movie", movie }
  const [result, setResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsStatus, setSuggestionsStatus] = useState("loading");

  // useRef = o referință la elementul <section> din DOM, pentru scrollIntoView.
  const resultsRef = useRef(null);

  // useEffect cu [] rulează o dată, după prima afișare: încărcăm sugestiile.
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled(SUGGESTIONS.map((id) => fetchOmdb({ i: id }))).then((outcomes) => {
      if (cancelled) return;
      const movies = outcomes
        .filter((outcome) => outcome.status === "fulfilled")
        .map((outcome) => outcome.value);
      setSuggestions(movies);
      setSuggestionsStatus(movies.length > 0 ? "ready" : "error");
    });

    // Funcția de "cleanup": dacă componenta dispare, ignorăm răspunsul.
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(title) {
    if (title === "") {
      setResult({ kind: "message", text: "Te rog introdu un titlu.", isError: true });
      return;
    }

    setResult({ kind: "message", text: "Se caută..." });
    setIsSearching(true);
    try {
      const movie = await fetchOmdb({ t: title });
      setResult({ kind: "movie", movie });
      setPickedId(null);
    } catch (error) {
      console.error("Eroare la căutare:", error);
      setResult({ kind: "message", text: errorMessage(error), isError: true });
    } finally {
      setIsSearching(false);
    }
  }

  function handlePick(movie) {
    setResult({ kind: "movie", movie });
    setPickedId(movie.imdbID);
    // Derulăm până la card după ce React l-a afișat.
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
  }

  function handleClose() {
    setResult(null);
    setPickedId(null);
  }

  return (
    <>
      <header className="hero">
        <div className="hero__inner">
          <p className="hero__eyebrow">Căutător de filme &amp; seriale</p>
          <h1>
            Cine<span className="hero__brand-accent">Radar</span>
          </h1>
          <p className="hero__subtitle">
            Găsește-ți următorul film sau serial preferat: caută orice titlu sau alege din
            sugestiile de mai jos.
          </p>
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        </div>
      </header>

      <main className="container">
        <section ref={resultsRef} className="results" aria-live="polite">
          {result?.kind === "message" && (
            <p className={result.isError ? "message message--error" : "message"}>{result.text}</p>
          )}
          {result?.kind === "movie" && <MovieCard movie={result.movie} onClose={handleClose} />}
        </section>

        <Suggestions
          movies={suggestions}
          status={suggestionsStatus}
          skeletonCount={SUGGESTIONS.length}
          pickedId={pickedId}
          onPick={handlePick}
        />
      </main>

      <footer className="site-footer">
        <p>
          <strong>CineRadar</strong> · Date furnizate de{" "}
          <a href="https://www.omdbapi.com/" target="_blank" rel="noopener">
            OMDb API
          </a>
        </p>
      </footer>
    </>
  );
}
