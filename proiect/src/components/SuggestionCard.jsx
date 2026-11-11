import { hasValue, typeLabel } from "../api/omdb.js";

// Un card din grila de sugestii. E un <button>, deci merge și din tastatură.
export default function SuggestionCard({ movie, index, isHidden, isPicked, onPick }) {
  const { Title, Year, Type, Poster, imdbRating } = movie;

  // Construim lista de clase în funcție de props (în loc de classList.toggle).
  const className = ["suggestion", isHidden && "is-hidden", isPicked && "is-picked"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      // Întârziere progresivă a animației: cardurile apar unul după altul.
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => onPick(movie)}
    >
      <div className="suggestion__poster-wrap">
        {hasValue(Poster) ? (
          <img className="suggestion__poster" src={Poster} alt="" loading="lazy" />
        ) : (
          <div className="suggestion__poster suggestion__poster--empty">Poster indisponibil</div>
        )}

        {hasValue(imdbRating) && (
          <span className="suggestion__badge suggestion__badge--rating">★ {imdbRating}</span>
        )}
        <span className="suggestion__badge suggestion__badge--type">{typeLabel(Type)}</span>
      </div>

      <div className="suggestion__info">
        <h3 className="suggestion__title">{Title}</h3>
        <p className="suggestion__year">{Year}</p>
      </div>
    </button>
  );
}
