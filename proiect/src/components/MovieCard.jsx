import { hasValue, typeLabel } from "../api/omdb.js";

// Cardul de detalii. React tratează textul din {...} ca text simplu
// (ca textContent), deci datele de la OMDb nu pot injecta HTML.
export default function MovieCard({ movie, onClose }) {
  const { Title, Year, Type, Genre, Plot, Poster, imdbRating, imdbID } = movie;

  const meta = [typeLabel(Type), Year, Genre, hasValue(imdbRating) && `★ ${imdbRating}`]
    .filter(hasValue)
    .join(" · ");

  // JustWatch România: pe ce platforme legale poate fi vizionat titlul.
  const watchUrl = new URL("https://www.justwatch.com/ro/search");
  watchUrl.searchParams.set("q", Title);

  return (
    <article className="movie-card">
      <button
        type="button"
        className="movie-card__close"
        aria-label="Închide detaliile"
        onClick={onClose}
      >
        ×
      </button>

      {hasValue(Poster) ? (
        <img className="movie-card__poster" src={Poster} alt={`Posterul pentru ${Title}`} />
      ) : (
        <div className="movie-card__poster movie-card__poster--empty">Poster indisponibil</div>
      )}

      <div className="movie-card__body">
        <h2 className="movie-card__title">{Title}</h2>
        <p className="movie-card__meta">{meta}</p>
        <p>{hasValue(Plot) ? Plot : "Descrierea nu este disponibilă."}</p>

        <div className="movie-card__actions">
          <a className="btn btn--primary" href={watchUrl.href} target="_blank" rel="noopener">
            Unde îl pot viziona?
          </a>
          {imdbID && (
            <a
              className="btn btn--secondary"
              href={`https://www.imdb.com/title/${imdbID}/`}
              target="_blank"
              rel="noopener"
            >
              Pagina IMDb
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
