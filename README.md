# My Movie Box (MMB Tv)

A mobile-first, single-page movie discovery web application.

## Run locally
1. From the root `mmb-tv` folder, start a local static server:
   - VS Code: install **Live Server** and select **Open with Live Server** on `index.html`.
2. Visit the URL shown by Live Server.

You can also open `index.html` directly, but a local HTTP server is recommended. Bootstrap is loaded from a CDN and requires internet access, as does the TMDB API. Without an API key the page loads with an explanatory message instead of fabricated movie data.

## Features

- Popular, weekly trending, and top-rated movie collections.
- Search movies by title with client-side form validation.
- Filter by genre, release year and minimum vote average; sort by popularity, rating, release date and title.
- Paginated results via **Load more**.
- Movie details in an accessible Bootstrap modal: overview, cast, director, genres, runtime and optional YouTube trailer.
- Save and remove favourites in browser localStorage; My List view.
- Responsive Bootstrap 5 design with custom mobile-first CSS, loading skeletons, empty states, API error handling, semantic HTML and keyboard focus styles.

**Note on filtering:** TMDB's `/search/movie` and `/discover/movie` are different operations. Submitting advanced filters switches to discover mode; submitting a title switches to search mode. The movie title sort option is provided through TMDB's discover endpoint.

## Security and limitations

For **demonstration only**, the TMDB API key is placed in client-side JavaScript and is therefore visible in page source and network requests. This is **not secure and standard practice**.

TMDB API usage is subject to TMDB terms, rate limits and attribution requirements. This product uses the TMDB API but is not endorsed or certified by TMDB. See https://developer.themoviedb.org/ and https://www.themoviedb.org/terms-of-use.

## External sources and attribution

- Bootstrap 5 framework (CDN): https://getbootstrap.com/docs/5.3/getting-started/introduction/
- TMDB API reference: https://developer.themoviedb.org/reference/intro/getting-started
- TMDB poster images and movie metadata are supplied dynamically by TMDB.
- No third-party template was copied. Application layout, styles, SVG assets and application JavaScript were written for this project.