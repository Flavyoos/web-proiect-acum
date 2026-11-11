import { useState } from "react";
import SuggestionCard from "./SuggestionCard.jsx";

const FILTERS = [
  { value: "all", label: "Toate" },
  { value: "movie", label: "Filme" },
  { value: "series", label: "Seriale" },
];

// status: "loading" | "error" | "ready"
export default function Suggestions({ movies, status, skeletonCount, pickedId, onPick }) {
  const [filter, setFilter] = useState("all");

  const matchesFilter = (movie) => filter === "all" || movie.Type === filter;

  // "Surprinde-mă": alege la întâmplare o sugestie vizibilă (respectă filtrul),
  // evitând să o aleagă de două ori la rând pe aceeași.
  function pickRandom() {
    let candidates = movies.filter(matchesFilter);
    if (candidates.length > 1) {
      candidates = candidates.filter((movie) => movie.imdbID !== pickedId);
    }
    if (candidates.length === 0) return;
    onPick(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  return (
    <section className="suggestions" aria-labelledby="suggestions-title">
      <div className="suggestions__header">
        <h2 id="suggestions-title">Sugestii pentru tine</h2>

        <div className="suggestions__controls">
          <div className="filters" role="group" aria-label="Filtrează sugestiile">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={value === filter ? "filter is-active" : "filter"}
                aria-pressed={value === filter}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="random-btn"
            onClick={pickRandom}
            disabled={status !== "ready"}
          >
            Surprinde-mă
          </button>
        </div>
      </div>

      <div className="suggestions__grid">
        {status === "loading" &&
          Array.from({ length: skeletonCount }, (_, i) => <div key={i} className="skeleton" />)}

        {status === "error" && (
          <p className="message message--error">Sugestiile nu au putut fi încărcate.</p>
        )}

        {status === "ready" &&
          movies.map((movie, index) => (
            // "key" ajută React să știe ce card e care între randări.
            <SuggestionCard
              key={movie.imdbID}
              movie={movie}
              index={index}
              isHidden={!matchesFilter(movie)}
              isPicked={movie.imdbID === pickedId}
              onPick={onPick}
            />
          ))}
      </div>
    </section>
  );
}
