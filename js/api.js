'use strict';
window.MovieAPI = (() => {
 const cfg = window.MMB_CONFIG;
 const configured = () => Boolean(cfg.API_KEY && cfg.API_KEY !== 'TMDB_API_KEY');
 async function request(path, params = {}) {
   if (!configured()) throw new Error('Missing TMDB API key in js/config.js to load live movies.');
   const url = new URL(cfg.BASE_URL + path);
   Object.entries({api_key:cfg.API_KEY,language:cfg.LANGUAGE,...params}).forEach(([k,v])=>{if(v!==undefined && v!==null && v!=='') url.searchParams.set(k,String(v));});
   const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),12000);
   try { const response = await fetch(url,{signal:controller.signal}); if(!response.ok) throw new Error(`TMDB request failed (${response.status}). Check API key or try again.`); return await response.json(); }
   catch(err){if(err.name==='AbortError') throw new Error('The request timed out. Please try again.'); throw err;}
   finally {clearTimeout(timeout);}
 }
 const poster = (path,size='w500') => path ? `${cfg.IMAGE_URL}${size}${path}` : 'assets/placeholder.svg';
 async function registerUser({email,password,username}){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  let response;
  try{
   response=await fetch('https://api.freeapi.app/api/v1/users/register',{method:'POST',headers:{accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({email,password,role:'ADMIN',username}),signal:controller.signal});
  }catch(error){if(error.name==='AbortError')throw new Error('Registration is taking too long. Please try again.');throw new Error('We could not reach the registration service. Check your connection and try again.');}
  finally{clearTimeout(timeout);}
  let data={};
  try{data=await response.json();}catch{}
  if(!response.ok||data.success===false)throw new Error(data.message||'We could not create your account right now. Please check your details and try again.');
  return data;
 }
 return {configured,request,poster,
  registerUser,
  popular:(page=1)=>request('/movie/popular',{page}),
  trending:(page=1)=>request('/trending/movie/week',{page}),
  topRated:(page=1)=>request('/movie/top_rated',{page}),
  search:(query,page=1)=>request('/search/movie',{query,page,include_adult:false}),
  discover:(filters,page=1)=>request('/discover/movie',{...filters,page,include_adult:false}),
  genres:()=>request('/genre/movie/list'),
  details:id=>request(`/movie/${encodeURIComponent(id)}`,{append_to_response:'credits,videos'})};
})();
