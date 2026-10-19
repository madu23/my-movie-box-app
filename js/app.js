'use strict';
/* MMB Tv application controller. All data comes from TMDB once configured. */
(()=>{
 const $=id=>document.getElementById(id);
 const state={collection:'popular',query:'',filters:{},page:1,totalPages:1,movies:[],requestId:0,genres:[],watchlist:loadSaved()};
 const modal=bootstrap.Modal.getOrCreateInstance($('movieModal'));
 function loadSaved(){try {const value=JSON.parse(localStorage.getItem('mmb-watchlist')||'[]');return Array.isArray(value)?value.filter(m=>Number.isInteger(m.id)):[];}catch{return [];}}
 function persist(){try{localStorage.setItem('mmb-watchlist',JSON.stringify(state.watchlist));}catch{showStatus('Unable to save favourites in this browser.','warning');} updateCount();}
 function updateCount(){$('watchlistCount').textContent=state.watchlist.length;}
 function showStatus(message,type='info'){$('status').innerHTML=message?`<div class="alert alert-${type}" role="alert">${MovieUI.escape(message)}</div>`:'';}
 function setLoading(value){$('movieGrid').setAttribute('aria-busy',String(value));if(value){$('movieGrid').innerHTML=Array.from({length:10},()=>'<div class="col"><div class="skeleton-card"><div class="skeleton-poster"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div></div></div>').join('');$('resultCount').textContent='Loading movies...';$('loadMore').hidden=true;}}
 function updateTabs(){document.querySelectorAll('[data-collection]').forEach(b=>{const selected=b.dataset.collection===state.collection;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});}
 function heading(){return state.collection==='watchlist'?'My Saved Movies':state.query?'Search Results':Object.keys(state.filters).length?'Discover Movies':({popular:'Popular Movies',trending:'Trending This Week',top_rated:'Top Rated Movies'})[state.collection];}
 function draw(){MovieUI.renderMovies(state.movies,state.watchlist.map(m=>m.id));$('moviesHeading').textContent=heading();$('resultCount').textContent=`Showing ${state.movies.length} movie${state.movies.length===1?'':'s'}`;$('loadMore').hidden=state.collection==='watchlist'||state.page>=state.totalPages; if(!state.movies.length)showStatus(state.collection==='watchlist'?'Your list is empty. Save movies using the heart icon.':'No movies found. Try another search or filter.','info');else showStatus('');}
 async function fetchMovies(append=false){
   const current=++state.requestId;
   if(state.collection==='watchlist'){state.movies=[...state.watchlist];state.totalPages=1;draw();return;}
   if(!MovieAPI.configured()){state.movies=[];$('movieGrid').innerHTML='';$('resultCount').textContent='API configuration required';$('loadMore').hidden=true;showStatus('Add your free TMDB API key to js/config.js, then refresh this page to load real movies.','warning');return;}
   if(!append)setLoading(true);showStatus('');
   try{
     let result;
     if(state.query)result=await MovieAPI.search(state.query,state.page);
     else if(Object.keys(state.filters).length)result=await MovieAPI.discover(state.filters,state.page);
     else result=await ({popular:MovieAPI.popular,trending:MovieAPI.trending,top_rated:MovieAPI.topRated}[state.collection])(state.page);
     if(current!==state.requestId)return;
     state.totalPages=Math.min(result.total_pages||1,500);
     const items=(result.results||[]).filter(m=>m.id&&m.title);
     state.movies=append?[...state.movies,...items.filter(m=>!state.movies.some(x=>x.id===m.id))]:items;
     draw();
   }catch(error){if(current!==state.requestId)return;if(!append){state.movies=[];$('movieGrid').innerHTML='';}$('resultCount').textContent='Unable to load movies';$('loadMore').hidden=true;showStatus(error.message||'An unexpected error occurred.','danger');}
   finally{if(current===state.requestId)$('movieGrid').setAttribute('aria-busy','false');}
 }
 async function loadGenres(){if(!MovieAPI.configured())return;try{const data=await MovieAPI.genres();state.genres=data.genres||[];const select=$('genreFilter');state.genres.forEach(g=>select.add(new Option(g.name,String(g.id))));}catch{ /* Filters remain usable without genres if this endpoint fails. */ }}
 function resetFilters(){ $('filterForm').reset();state.filters={}; }
 function selectCollection(collection){state.collection=collection;state.query='';$('searchInput').value='';resetFilters();state.page=1;state.movies=[];updateTabs();fetchMovies();}
 function toggleSave(id){const existing=state.watchlist.findIndex(m=>m.id===id);if(existing>=0)state.watchlist.splice(existing,1);else{const movie=state.movies.find(m=>m.id===id);if(movie)state.watchlist.unshift(movie);}persist();if(state.collection==='watchlist')fetchMovies();else draw();const openId=Number($('movieModal').dataset.movieId);if($('movieModal').classList.contains('show')&&openId===id){const button=$('modalBody').querySelector('[data-save]');if(button)button.textContent=state.watchlist.some(m=>m.id===id)?'♥ Remove from My List':'♡ Add to My List';}}
 async function openDetails(id){$('movieModal').dataset.movieId=id;$('modalTitle').textContent='Loading movie...';$('modalBody').innerHTML='<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';modal.show();try{const movie=await MovieAPI.details(id);if(Number($('movieModal').dataset.movieId)!==id)return;MovieUI.renderDetails(movie,state.watchlist.some(m=>m.id===id));}catch(e){$('modalBody').innerHTML=`<p class="alert alert-danger">${MovieUI.escape(e.message)}</p>`;}}
 $('searchForm').addEventListener('submit',event=>{event.preventDefault();const input=$('searchInput');const query=input.value.trim();if(query.length<2){$('searchError').textContent='Please enter at least two characters.';input.setAttribute('aria-invalid','true');input.focus();return;}$('searchError').textContent='';input.removeAttribute('aria-invalid');state.query=query;state.collection='popular';resetFilters();state.page=1;state.movies=[];updateTabs();fetchMovies();$('movies').scrollIntoView({behavior:'smooth'});});
 $('searchInput').addEventListener('input',()=>{$('searchError').textContent='';$('searchInput').removeAttribute('aria-invalid');});
 $('filterForm').addEventListener('submit',e=>{e.preventDefault();state.query='';$('searchInput').value='';state.collection='popular';state.page=1;state.movies=[];const genre=$('genreFilter').value,year=$('yearFilter').value,rating=$('ratingFilter').value,sort=$('sortFilter').value;state.filters={sort_by:sort,...(genre?{with_genres:genre}:{}),...(year?{primary_release_year:year}:{}),...(rating?{'vote_average.gte':rating,'vote_count.gte':100}:{})};updateTabs();fetchMovies();});
 $('clearFilters').addEventListener('click',()=>{resetFilters();state.page=1;state.movies=[];fetchMovies();});
 $('resetAll').addEventListener('click',()=>selectCollection('popular'));
 document.querySelectorAll('[data-collection]').forEach(b=>b.addEventListener('click',()=>selectCollection(b.dataset.collection)));
 $('watchlistNav').addEventListener('click',()=>{selectCollection('watchlist');$('movies').scrollIntoView({behavior:'smooth'});});
 $('loadMore').addEventListener('click',()=>{if(state.page<state.totalPages){state.page++;fetchMovies(true);}});
 $('movieGrid').addEventListener('click',e=>{const details=e.target.closest('[data-details]'),save=e.target.closest('[data-save]');if(details)openDetails(Number(details.dataset.details));if(save)toggleSave(Number(save.dataset.save));});
 $('modalBody').addEventListener('click',e=>{const save=e.target.closest('[data-save]');if(save)toggleSave(Number(save.dataset.save));});
 $('currentYear').textContent=new Date().getFullYear();$('dataMode').textContent=MovieAPI.configured()?'Movie information provided by TMDB':'Awaiting TMDB API key';
 const currentYear=new Date().getFullYear();for(let y=currentYear+1;y>=1950;y--){$('yearFilter').add(new Option(String(y),String(y)));}
 updateCount();loadGenres();fetchMovies();
})();
