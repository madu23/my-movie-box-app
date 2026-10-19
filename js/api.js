'use strict';
window.MovieAPI = (() => {
 const cfg = window.MMB_CONFIG;
 const configured = () => Boolean(cfg.API_KEY && cfg.API_KEY !== 'YOUR_TMDB_API_KEY');
 async function request(path, params = {}) {
   if (!configured()) throw new Error('Add your TMDB API key to js/config.js to load live movies.');
   const url = new URL(cfg.BASE_URL + path);
   Object.entries({api_key:cfg.API_KEY,language:cfg.LANGUAGE,...params}).forEach(([k,v])=>{if(v!==undefined && v!==null && v!=='') url.searchParams.set(k,String(v));});
   const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),12000);
   try { const response = await fetch(url,{signal:controller.signal}); if(!response.ok) throw new Error(`TMDB request failed (${response.status}). Check your API key or try again.`); return await response.json(); }
   catch(err){if(err.name==='AbortError') throw new Error('The request timed out. Please try again.'); throw err;}
   finally {clearTimeout(timeout);}
 }
 const poster = (path,size='w500') => path ? `${cfg.IMAGE_URL}${size}${path}` : 'assets/placeholder.svg';
 return {configured,request,poster,
  popular:(page=1)=>request('/movie/popular',{page}),
  trending:(page=1)=>request('/trending/movie/week',{page}),
  topRated:(page=1)=>request('/movie/top_rated',{page}),
  search:(query,page=1)=>request('/search/movie',{query,page,include_adult:false}),
  discover:(filters,page=1)=>request('/discover/movie',{...filters,page,include_adult:false}),
  genres:()=>request('/genre/movie/list'),
  details:id=>request(`/movie/${encodeURIComponent(id)}`,{append_to_response:'credits,videos'})};
})();
