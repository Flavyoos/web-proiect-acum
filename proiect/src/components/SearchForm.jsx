import { useState } from "react";

// Formular "controlat": valoarea input-ului stă în state-ul React,
// nu o mai citim din DOM cu input.value.
export default function SearchForm({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  function handleSubmit(event) {
    // Oprim reîncărcarea paginii, exact ca în varianta vanilla.
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      {/* În JSX: for -> htmlFor, class -> className */}
      <label htmlFor="movie-input" className="visually-hidden">
        Numele filmului sau serialului
      </label>
      <input
        type="text"
        id="movie-input"
        name="title"
        placeholder="ex: Inception, Breaking Bad..."
        autoComplete="off"
        required
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit" disabled={isSearching}>
        Caută
      </button>
    </form>
  );
}
