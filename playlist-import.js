(function(root){
  'use strict';
  function parse(text){
    let url;try{url=new URL(text.trim());}catch{throw new Error('Paste a YouTube playlist link, including https://.');}
    const id=url.searchParams.get('list');
    if(url.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(url.hostname)||!id||! /^(PL|UU|OLAK5uy_)[A-Za-z0-9_-]{10,100}$/.test(id))throw new Error('Use a YouTube playlist link with a list= identifier.');
    return id;
  }
  function convert(data,id){
    if(data?.id!==id||data.truncated!==false||!Array.isArray(data.videos)||data.videos.length!==data.itemCount)throw new Error('The service returned an incomplete playlist. Nothing was added; try again later.');
    const videos=data.videos.filter(v=>!v.unavailable&&v.seconds>0);
    const seen=new Set(),lessons=[];
    for(const v of videos){
      if(seen.has(v.id))continue;seen.add(v.id);
      const sec=v.seconds,parts=[Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60];
      const duration=parts[0]?`${parts[0]}:${String(parts[1]).padStart(2,'0')}:${String(parts[2]).padStart(2,'0')}`:`${parts[1]}:${String(parts[2]).padStart(2,'0')}`;
      lessons.push({id:v.id,title:v.title,durationSeconds:sec,duration,position:lessons.length+1});
    }
    if(!lessons.length)throw new Error('No available lectures with a known duration were found.');
    const track=root.CourseProgress.validateTrack({id:`yt_${id}`,playlist:id,title:data.title,creator:data.channel?.title||'YouTube',fetchedAt:Date.now(),lessons});
    return {track,skipped:data.videos.length-videos.length};
  }
  async function load(id){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
    try{
      const response=await root.fetch(`https://playlistduration.com/api/v1/playlist/${encodeURIComponent(id)}`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error(response.status===404?'Playlist not found or private. Use a public playlist.':response.status===429?'The playlist service is busy. Wait a minute and retry.':'The playlist service is temporarily unavailable. Please retry later.');
      return convert(await response.json(),id);
    }catch(error){if(error.name==='AbortError'||error.name==='TypeError')throw new Error('Could not reach the playlist service. Check your connection and retry.');throw error;}
    finally{clearTimeout(timer);}
  }
  root.PlaylistImport={parse,convert,load};
})(typeof window!=='undefined'?window:globalThis);
