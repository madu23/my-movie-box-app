# My Movie Box (MMB Tv)

A mobile-first, single-page movie discovery web application for a web development academic assessment.

## Run locally

1. Extract the ZIP.
2. Obtain a free TMDB v3 API key at https://www.themoviedb.org/settings/api.
3. Open `js/config.js` and replace `YOUR_TMDB_API_KEY` with your own key.
4. From the extracted `mmb-tv` folder, start a local static server:
   - Python: `python -m http.server 8000`
   - Or VS Code: install **Live Server** and select **Open with Live Server** on `index.html`.
5. Visit http://localhost:8000 (or the URL shown by Live Server).

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

## Assessment rubric mapping

- **HTML (20%)**: semantic `header`, `nav`, `main`, `section`, `article`, `footer`, headings, labels, lists, anchors, accessible modal.
- **CSS (20%)**: external stylesheet, mobile-first media queries, tag/class/ID and attribute/pseudo-class selectors, responsive layout, original styling. Bootstrap 5 supports layout but custom CSS implements the branding.
- **JavaScript (15%)**: modular scripts, events, DOM rendering, input validation, async fetch, loading/errors, localStorage.
- **Forms (15%)**: search field, dropdown selects, submit and reset buttons, accessible labels, required and minimum-length validation.
- **API (15%)**: TMDB popular, trending, top-rated, search, discover, genre list and detailed metadata with appended credits and videos.
- **UI/UX/accessibility (15%)**: responsive grid, keyboard navigation, skip link, visible focus, semantic landmarks, form labels, ARIA live updates, alt text, status and empty states.

## Branding

As specified in the assignment: primary `#1d1a45`, secondary `#f33535`, background `#dbeaf1`, Arial font. The MMB Tv logo, favicon and decorative hero SVG are original project assets.

## Security and limitations

For this **academic demonstration only**, the TMDB API key is placed in client-side JavaScript and is therefore visible in page source and network requests. This is **not secure for production**. A production deployment should store the credential server-side behind a proxy or serverless function. Use a dedicated development key and do not commit real credentials to a public repository. Acknowledging the risk does not make the key private.

TMDB API usage is subject to TMDB terms, rate limits and attribution requirements. This product uses the TMDB API but is not endorsed or certified by TMDB. See https://developer.themoviedb.org/ and https://www.themoviedb.org/terms-of-use.

## External sources and attribution

- Bootstrap 5 framework (CDN): https://getbootstrap.com/docs/5.3/getting-started/introduction/
- TMDB API reference: https://developer.themoviedb.org/reference/intro/getting-started
- TMDB poster images and movie metadata are supplied dynamically by TMDB.
- No third-party template was copied. Application layout, styles, SVG assets and application JavaScript were written for this project.

**Attribution note:** The included `tmdb-mark.svg` is a text-only placeholder for identification, not TMDB's official logo. Before public submission, replace it with the official approved TMDB logo downloaded from TMDB's branding resources, as required by their attribution guidelines.

## Manual testing checklist

1. Check desktop, tablet and mobile widths (320px, 375px, 768px, 1280px).
2. Search `Batman`, submit one character, and submit an empty field.
3. Change collections, apply each filter, clear filters, load more.
4. Open details and check cast, runtime and trailers where available.
5. Save a film, open My List, refresh, remove the film and check persistence.
6. Test with an invalid API key, disconnected network, and missing poster.
7. Navigate using keyboard only, test visible focus, and check labels with a screen reader.
