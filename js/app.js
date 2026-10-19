'use strict';
/* MMB Tv application controller. All data comes from TMDB once configured. */
(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    collection: 'popular',
    query: '',
    filters: {},
    page: 1,
    totalPages: 1,
    movies: [],
    requestId: 0,
    genres: [],
    watchlist: loadSaved(),
    isRegistered: loadRegistration(),
  };
  const modal = bootstrap.Modal.getOrCreateInstance($('movieModal'));
  const registerModal = bootstrap.Modal.getOrCreateInstance($('registerModal'));
  let moviesNavigationPending = false;
  let genreRequestStarted = false;
  function loadRegistration() {
    try {
      return sessionStorage.getItem('mmb-registered') === 'true';
    } catch {
      return false;
    }
  }
  function setRegistered() {
    state.isRegistered = true;
    try {
      sessionStorage.setItem('mmb-registered', 'true');
    } catch {}

    $('registerNavItem').hidden = true;
    loadGenres();
    fetchMovies();
  }

  function loadSaved() {
    try {
      const value = JSON.parse(localStorage.getItem('mmb-watchlist') || '[]');
      return Array.isArray(value)
        ? value.filter((movie) => Number.isInteger(movie.id))
        : [];
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem('mmb-watchlist', JSON.stringify(state.watchlist));
    } catch {
      showStatus('Unable to save favourites in this browser.', 'warning');
    }
    updateCount();
  }

  function updateCount() {
    $('watchlistCount').textContent = state.watchlist.length;
  }

  if (state.isRegistered) {
    $('registerNavItem').hidden = true;
  }

  function showStatus(message, type = 'info') {
    $('status').innerHTML = message
      ? `<div class="alert alert-${type}" role="alert">${MovieUI.escape(message)}</div>`
      : '';
  }

  function promptForRegistration() {
    if (state.isRegistered || $('registerModal').classList.contains('show')) {
      return;
    }
    showStatus('Please register to view movies or add them to your list.', 'info');
    registerModal.show();
  }

  function setLoading(value) {
    $('movieGrid').setAttribute('aria-busy', String(value));
    if (!value) {
      return;
    }

    const skeletonCards = Array.from(
      { length: 10 },
      () =>
        '<div class="col"><div class="skeleton-card"><div class="skeleton-poster"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div></div></div>',
    );
    $('movieGrid').innerHTML = skeletonCards.join('');
    $('resultCount').textContent = 'Loading movies...';
    $('loadMore').hidden = true;
  }

  function updateTabs() {
    document.querySelectorAll('[data-collection]').forEach((button) => {
      const isSelected = button.dataset.collection === state.collection;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function heading() {
    if (state.collection === 'watchlist') {
      return 'My Saved Movies';
    }
    if (state.query) {
      return 'Search Results';
    }
    if (Object.keys(state.filters).length) {
      return 'Discover Movies';
    }

    return {
      popular: 'Popular Movies',
      trending: 'Trending This Week',
      top_rated: 'Top Rated Movies',
    }[state.collection];
  }

  function draw() {
    MovieUI.renderMovies(
      state.movies,
      state.watchlist.map((movie) => movie.id),
    );
    $('moviesHeading').textContent = heading();
    $('resultCount').textContent = `Showing ${state.movies.length} movie${
      state.movies.length === 1 ? '' : 's'
    }`;
    $('loadMore').hidden =
      state.collection === 'watchlist' || state.page >= state.totalPages;

    if (!state.movies.length) {
      const emptyMessage =
        state.collection === 'watchlist'
          ? 'Your list is empty. Save movies using the heart icon.'
          : 'No movies found. Try another search or filter.';
      showStatus(emptyMessage, 'info');
      return;
    }

    showStatus('');
  }

  async function fetchMovies(append = false) {
    const current = ++state.requestId;
    if (!state.isRegistered) {
      state.movies = [];
      $('movieGrid').innerHTML = '';
      $('resultCount').textContent = 'Registration required to browse movies';
      $('loadMore').hidden = true;
      showStatus('Please register to view movies or add them to your list.', 'info');
      return;
    }
    if (state.collection === 'watchlist') {
      state.movies = [...state.watchlist];
      state.totalPages = 1;
      draw();
      return;
    }
    if (!MovieAPI.configured()) {
      state.movies = [];
      $('movieGrid').innerHTML = '';
      $('resultCount').textContent = 'API configuration required';
      $('loadMore').hidden = true;
      showStatus(
        'Add your free TMDB API key to js/config.js, then refresh this page to load real movies.',
        'warning',
      );
      return;
    }

    if (!append) {
      setLoading(true);
    }
    showStatus('');

    try {
      let result;
      if (state.query) {
        result = await MovieAPI.search(state.query, state.page);
      } else if (Object.keys(state.filters).length) {
        result = await MovieAPI.discover(state.filters, state.page);
      } else {
        const collectionRequest = {
          popular: MovieAPI.popular,
          trending: MovieAPI.trending,
          top_rated: MovieAPI.topRated,
        }[state.collection];
        result = await collectionRequest(state.page);
      }

      if (current !== state.requestId) {
        return;
      }

      state.totalPages = Math.min(result.total_pages || 1, 500);
      const movies = (result.results || []).filter(
        (movie) => movie.id && movie.title,
      );
      state.movies = append
        ? [
            ...state.movies,
            ...movies.filter(
              (movie) => !state.movies.some((existing) => existing.id === movie.id),
            ),
          ]
        : movies;
      draw();
    } catch (error) {
      if (current !== state.requestId) {
        return;
      }
      if (!append) {
        state.movies = [];
        $('movieGrid').innerHTML = '';
      }
      $('resultCount').textContent = 'Unable to load movies';
      $('loadMore').hidden = true;
      showStatus(error.message || 'An unexpected error occurred.', 'danger');
    } finally {
      if (current === state.requestId) {
        $('movieGrid').setAttribute('aria-busy', 'false');
      }
    }
  }

  async function loadGenres() {
    if (
      state.genres.length ||
      genreRequestStarted ||
      !state.isRegistered ||
      !MovieAPI.configured()
    ) {
      return;
    }

    genreRequestStarted = true;
    try {
      const data = await MovieAPI.genres();
      state.genres = data.genres || [];
      const select = $('genreFilter');
      state.genres.forEach((genre) => {
        select.add(new Option(genre.name, String(genre.id)));
      });
    } catch {
      /* Filters remain usable without genres if this endpoint fails. */
    }
  }

  function resetFilters() {
    $('filterForm').reset();
    state.filters = {};
  }

  function selectCollection(collection) {
    if (!state.isRegistered) {
      promptForRegistration();
      return;
    }

    state.collection = collection;
    state.query = '';
    $('searchInput').value = '';
    resetFilters();
    state.page = 1;
    state.movies = [];
    updateTabs();
    fetchMovies();
  }

  function toggleSave(id) {
    const existingIndex = state.watchlist.findIndex((movie) => movie.id === id);
    if (existingIndex >= 0) {
      state.watchlist.splice(existingIndex, 1);
    } else {
      const movie = state.movies.find((item) => item.id === id);
      if (movie) {
        state.watchlist.unshift(movie);
      }
    }

    persist();
    if (state.collection === 'watchlist') {
      fetchMovies();
    } else {
      draw();
    }

    const openMovieId = Number($('movieModal').dataset.movieId);
    if ($('movieModal').classList.contains('show') && openMovieId === id) {
      const saveButton = $('modalBody').querySelector('[data-save]');
      if (saveButton) {
        saveButton.textContent = state.watchlist.some((movie) => movie.id === id)
          ? '\u2665 Remove from My List'
          : '\u2661 Add to My List';
      }
    }
  }

  async function openDetails(id) {
    $('movieModal').dataset.movieId = id;
    $('modalTitle').textContent = 'Loading movie...';
    $('modalBody').innerHTML =
      '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    modal.show();

    try {
      const movie = await MovieAPI.details(id);
      if (Number($('movieModal').dataset.movieId) !== id) {
        return;
      }
      MovieUI.renderDetails(
        movie,
        state.watchlist.some((savedMovie) => savedMovie.id === id),
      );
    } catch (error) {
      $('modalBody').innerHTML = `<p class="alert alert-danger">${MovieUI.escape(error.message)}</p>`;
    }
  }

  $('searchForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('searchInput');
    const query = input.value.trim();
    if (query.length < 2) {
      $('searchError').textContent = 'Please enter at least two characters.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    $('searchError').textContent = '';
    input.removeAttribute('aria-invalid');
    state.query = query;
    state.collection = 'popular';
    resetFilters();
    state.page = 1;
    state.movies = [];
    updateTabs();
    fetchMovies();
    $('movies').scrollIntoView({ behavior: 'smooth' });
  });

  $('searchInput').addEventListener('input', () => {
    $('searchError').textContent = '';
    $('searchInput').removeAttribute('aria-invalid');
  });

  $('filterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = '';
    $('searchInput').value = '';
    state.collection = 'popular';
    state.page = 1;
    state.movies = [];

    const genre = $('genreFilter').value;
    const releaseYear = $('yearFilter').value;
    const minimumRating = $('ratingFilter').value;
    const sort = $('sortFilter').value;
    state.filters = {
      sort_by: sort,
      ...(genre ? { with_genres: genre } : {}),
      ...(releaseYear ? { primary_release_year: releaseYear } : {}),
      ...(minimumRating
        ? { 'vote_average.gte': minimumRating, 'vote_count.gte': 100 }
        : {}),
    };

    updateTabs();
    fetchMovies();
  });

  $('clearFilters').addEventListener('click', () => {
    resetFilters();
    state.page = 1;
    state.movies = [];
    fetchMovies();
  });

  $('resetAll').addEventListener('click', () => selectCollection('popular'));

  document.querySelectorAll('a[href="#movies"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (state.isRegistered) {
        return;
      }
      event.preventDefault();
      moviesNavigationPending = true;
      registerModal.show();
    });
  });

  $('registerNav').addEventListener('click', promptForRegistration);
  $('registerModal').addEventListener('hidden.bs.modal', () => {
    if (!state.isRegistered) {
      moviesNavigationPending = false;
    }
  });

  const registerForm = $('registerForm');
  const passwordInput = $('registerPassword');
  const confirmPasswordInput = $('registerConfirmPassword');
  const registerFields = [
    $('registerUsername'),
    $('registerEmail'),
    passwordInput,
    confirmPasswordInput,
  ];
  const touchedRegisterFields = new Set();
  let registerSubmitting = false;

  function registerFieldError(field) {
    const value = field.value.trim();
    if (field === registerFields[0]) {
      if (!value) {
        return 'Username is required.';
      }
      return value.length < 4 ? 'Username must be at least 4 characters.' : '';
    }
    if (field === registerFields[1]) {
      if (!value) {
        return 'Email is required.';
      }
      return field.validity.typeMismatch ? 'Enter a valid email address.' : '';
    }
    if (field === passwordInput) {
      return field.value ? '' : 'Password is required.';
    }
    if (!field.value) {
      return 'Please confirm your password.';
    }
    return field.value !== passwordInput.value ? 'Passwords do not match.' : '';
  }

  function updateRegisterValidation(fieldToReveal) {
    if (fieldToReveal) touchedRegisterFields.add(fieldToReveal);
    registerFields.forEach(field => {
      const message = registerFieldError(field);
      const showError = touchedRegisterFields.has(field);
      field.setCustomValidity(message);
      $(`${field.id}Error`).textContent = showError ? message : '';
      field.setAttribute('aria-invalid', String(showError && Boolean(message)));
    });
    $('registerSubmit').disabled = registerSubmitting || !registerForm.checkValidity();
  }
  registerFields.forEach(field => {
    field.addEventListener('blur', () => updateRegisterValidation(field));
    field.addEventListener('input', () => updateRegisterValidation());
  });
  updateRegisterValidation();

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    registerFields.forEach(field => touchedRegisterFields.add(field));
    updateRegisterValidation();
    if (!registerForm.checkValidity()) return;

    const submit = $('registerSubmit');
    const feedback = $('registerFeedback');
    registerSubmitting = true;
    updateRegisterValidation();
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Creating account...';
    feedback.className = 'mb-3';
    feedback.textContent = 'Creating your account...';

    try {
      await MovieAPI.registerUser({
        email: $('registerEmail').value.trim(),
        password: passwordInput.value,
        username: $('registerUsername').value.trim(),
      });
      setRegistered();
      registerForm.reset();
      touchedRegisterFields.clear();
      updateRegisterValidation();
      feedback.className = 'alert alert-success mb-3';
      feedback.textContent = 'You are registered. Welcome to My Movie Box!';

      if (moviesNavigationPending) {
        moviesNavigationPending = false;
        showStatus('Registration complete. Enjoy exploring the movies!', 'success');
        registerModal.hide();
        $('movies').scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      feedback.className = 'alert alert-danger mb-3';
      feedback.textContent = error.message || 'Something went wrong. Please try again.';
    } finally {
      registerSubmitting = false;
      updateRegisterValidation();
      submit.removeAttribute('aria-busy');
      submit.textContent = 'Create account';
    }
  });

  document.querySelectorAll('[data-collection]').forEach((button) => {
    button.addEventListener('click', () => selectCollection(button.dataset.collection));
  });
  $('watchlistNav').addEventListener('click', () => {
    selectCollection('watchlist');
    $('movies').scrollIntoView({ behavior: 'smooth' });
  });
  $('loadMore').addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      fetchMovies(true);
    }
  });
  $('movieGrid').addEventListener('click', (event) => {
    const detailsButton = event.target.closest('[data-details]');
    const saveButton = event.target.closest('[data-save]');
    if (detailsButton) {
      openDetails(Number(detailsButton.dataset.details));
    }
    if (saveButton) {
      toggleSave(Number(saveButton.dataset.save));
    }
  });
  $('modalBody').addEventListener('click', (event) => {
    const saveButton = event.target.closest('[data-save]');
    if (saveButton) {
      toggleSave(Number(saveButton.dataset.save));
    }
  });

  $('currentYear').textContent = new Date().getFullYear();
  $('dataMode').textContent = MovieAPI.configured()
    ? 'Movie information provided by TMDB'
    : 'Awaiting TMDB API key';

  const currentYear = new Date().getFullYear();
  for (let year = currentYear + 1; year >= 1950; year--) {
    $('yearFilter').add(new Option(String(year), String(year)));
  }

  updateCount();
  if (state.isRegistered) {
    loadGenres();
    fetchMovies();
  } else {
    $('resultCount').textContent = 'Registration required to browse movies';
    showStatus('Please register to view movies or add them to your list.', 'info');
  }
})();
