'use strict';
window.MovieUI = (()=>{
 const escape = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const year = date => /^\d{4}/.test(date||'') ? date.slice(0,4) : 'Unknown';
 const rating = n => Number.isFinite(Number(n)) && Number(n)>0 ? Number(n).toFixed(1) : 'N/A';
 const grid=document.getElementById('movieGrid');
 function renderMovies(movies, savedIds){
   grid.innerHTML=movies.map(movie=>{const saved=savedIds.includes(Number(movie.id));return `<div class="col"><article class="movie-card h-100"><div class="poster-wrap"><img class="movie-poster" loading="lazy" src="${escape(MovieAPI.poster(movie.poster_path))}" alt="${escape(movie.title)} poster" onerror="this.onerror=null;this.src='assets/placeholder.svg'"><span class="rating-pill" aria-label="Rating ${rating(movie.vote_average)} out of 10">★ ${rating(movie.vote_average)}</span></div><div class="card-details"><h3 title="${escape(movie.title)}">${escape(movie.title)}</h3><p class="movie-year">${escape(year(movie.release_date))}</p><div class="card-actions"><button class="btn btn-accent btn-sm" data-details="${Number(movie.id)}" type="button" aria-label="View details for ${escape(movie.title)}">View details</button><button class="save-btn ${saved?'saved':''}" type="button" data-save="${Number(movie.id)}" aria-label="${saved?'Remove':'Save'} ${escape(movie.title)} ${saved?'from':'to'} my list" aria-pressed="${saved}">${saved?'♥':'♡'}</button></div></div></article></div>`;}).join('');
 }
 function renderDetails(movie,saved){
  const genres=(movie.genres||[]).map(g=>g.name).join(', ')||'Not available';
  const cast=(movie.credits?.cast||[]).slice(0,6).map(c=>c.name).join(', ')||'Not available';
  const director=(movie.credits?.crew||[]).find(c=>c.job==='Director')?.name||'Not available';
  const trailer=(movie.videos?.results||[]).find(v=>v.site==='YouTube' && v.type==='Trailer');
  const trailerUrl=trailer && /^[\w-]+$/.test(trailer.key) ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  document.getElementById('modalTitle').textContent=movie.title||'Movie details';
  document.getElementById('modalBody').innerHTML=`<div class="row g-4"><div class="col-sm-4"><img class="img-fluid rounded detail-poster" src="${escape(MovieAPI.poster(movie.poster_path))}" alt="${escape(movie.title)} poster" onerror="this.onerror=null;this.src='assets/placeholder.svg'"></div><div class="col-sm-8"><p class="detail-meta">${escape(year(movie.release_date))} <span>★ ${rating(movie.vote_average)}</span> ${escape(movie.runtime?`${movie.runtime} min`:'')}</p><p>${escape(movie.overview||'No synopsis is currently available.')}</p><dl class="detail-list"><dt>Director</dt><dd>${escape(director)}</dd><dt>Cast</dt><dd>${escape(cast)}</dd><dt>Genres</dt><dd>${escape(genres)}</dd><dt>Original language</dt><dd>${escape((movie.original_language||'N/A').toUpperCase())}</dd></dl><div class="d-flex flex-wrap gap-2"><button class="btn btn-accent" data-save="${Number(movie.id)}" type="button">${saved?'♥ Remove from My List':'♡ Add to My List'}</button>${trailerUrl?`<a class="btn btn-outline-primary" href="${trailerUrl}" target="_blank" rel="noopener noreferrer">▶ Watch trailer <span class="visually-hidden">(opens in new tab)</span></a>`:''}</div></div></div>`;
 }
 return {renderMovies,renderDetails,escape};
})();
