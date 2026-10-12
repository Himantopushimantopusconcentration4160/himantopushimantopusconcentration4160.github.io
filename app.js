(function(){
"use strict";
var REGIONS = ["서울","경기","인천","강원","충청","전라","경상","부산","제주"];
var SITE = "다꾸 체험단 모음";

var seed = {items:[]};
var state = {
  items: [],
  q: "", region: "전체", status: "open",
  loading: true
};
try{ var s = sessionStorage.getItem("dakku-ui"); if(s){ s = JSON.parse(s); state.region = s.region || "전체"; state.status = (s.status && s.status!=="all") ? s.status : "open"; } }catch(e){}
function saveUi(){ try{ sessionStorage.setItem("dakku-ui", JSON.stringify({region:state.region,status:state.status})); }catch(e){} }

/* ---------- date logic (자동 마감 계산) ---------- */
function today(){ var d=new Date(); d.setHours(0,0,0,0); return d; }
function parseDate(s){ if(!s) return null; var p=String(s).split("-"); if(p.length<3) return null; var d=new Date(+p[0],+p[1]-1,+p[2]); d.setHours(0,0,0,0); return isNaN(d)?null:d; }
function ymd(d){ return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function isPick(it){ return String(it.name||"").indexOf("풀빌라")>=0; }
function fmt(s){ var d=parseDate(s); if(!d) return "-"; return (d.getMonth()+1)+"."+d.getDate(); }
function statusOf(it){
  var t=today(), st=parseDate(it.start), en=parseDate(it.end);
  if(it.closed) return {key:"closed",label:"🔒 마감",dday:"마감"};
  if(en && t>en) return {key:"closed",label:"🔒 마감",dday:"마감"};
  if(st && t<st){ var n=Math.round((st-t)/864e5); return {key:"soon",label:"⏰ 오픈예정",dday:"오픈 D-"+n}; }
  if(en){ var left=Math.round((en-t)/864e5); return {key:"open",label:"🔥 모집중",dday: left===0?"오늘 마감 🚨":(left<=3?"D-"+left+" ⏳":"D-"+left)}; }
  return {key:"open",label:"🔥 모집중",dday:"상시"};
}

/* ---------- helpers ---------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function safeUrl(u){ u=String(u||"").trim(); if(!u) return ""; if(/^https?:\/\//i.test(u)) return u; if(/^images\/[\w.-]+$/.test(u)) return u; return ""; }
function uid(){ return "h"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function filtered(){
  var q=state.q.trim().toLowerCase();
  return state.items.slice().sort(function(a,b){ var pa=isPick(a)&&statusOf(a).key!=="closed", pb=isPick(b)&&statusOf(b).key!=="closed"; if(pa!==pb) return pa?-1:1; return (b.createdAt||0)-(a.createdAt||0); }).filter(function(it){
    if(state.region!=="전체" && it.region!==state.region) return false;
    var s=statusOf(it).key;
    var td=ymd(today());
    if(state.status==="open" && s!=="open") return false;
    if(state.status==="closed" && s!=="closed") return false;
    if(state.status==="todayOpen" && !(it.start===td && s!=="closed")) return false;
    if(state.status==="pick" && !isPick(it)) return false;
    if(state.status==="fav" && !isFav(it.id)) return false;
    if(state.status==="todayClose" && !(it.end===td && s==="open")) return false;
    if(q){ var hay=(it.name+" "+it.region+" "+it.benefit).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  });
}

/* ---------- render ---------- */
var app=document.getElementById("app");
function shell(){
  app.innerHTML =
   '<div class="disclose">이 사이트는 쿠팡, 여기어때, 마이리얼트립, 토스 등으로부터 일정액의 수수료를 제공받습니다.</div>'+
      '<header class="top"><div class="wrap">'+
     '<div class="bar"><a class="logo" href="#" id="home"><i>다</i>'+SITE+'</a></div>'+
     '<label class="search"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'+
       '<input id="q" type="search" placeholder="어디로 떠나볼까요? 숙소·지역 검색" autocomplete="off" aria-label="숙소 검색"></label>'+
     '<nav class="chips" id="chips" aria-label="지역 필터"></nav>'+
   '</div></header>'+
   '<main class="wrap">'+
     '<section class="hero"><h1>✨ 전국 숙박 체험단,<br><span class="grad">한곳에서 쏙쏙</span> 골라봐요 🏝️</h1><p>오늘도 공짜 호캉스 떠나볼까요? 🧳 모집이 끝나면 자동으로 마감돼요</p></section>'+
     '<section id="today" class="today"></section><section id="deals" class="deals"></section>'+
     '<div class="toolbar"><div class="seg" id="seg">'+
       '<button data-s="pick">추천 💜</button><button data-s="todayOpen">오늘오픈 🆕</button><button data-s="todayClose">오늘마감 🚨</button><button data-s="open">모집중 🔥</button><button data-s="closed">모집마감 🔒</button><button data-s="fav">찜 ❤️</button>'+
     '</div><span class="count" id="count"></span></div>'+
     '<div class="grid" id="grid"></div>'+
   '</main>'+
   '<footer><div class="wrap">'+
     
     '<div class="foot-meta">'+SITE+' · 체험단 모집 정보는 각 모집처의 공지를 기준으로 하며, 신청 조건과 일정은 변경될 수 있습니다.</div>'+
   '</div></footer>'+
   '<button class="fab" id="fab" hidden>➕ 숙소 등록</button>';

  var chips=document.getElementById("chips");
  var EMO={"전체":"🌏","서울":"🏙️","경기":"🌳","인천":"✈️","강원":"⛰️","충청":"🌾","전라":"🍃","경상":"🌊","부산":"🎡","제주":"🍊"};
  chips.innerHTML=["전체"].concat(REGIONS).map(function(r){return '<button class="chip" data-r="'+r+'"><span class="ring"><span>'+EMO[r]+'</span></span><span class="lb">'+r+'</span></button>';}).join("");
  chips.addEventListener("click",function(e){ var b=e.target.closest(".chip"); if(!b) return; state.region=b.dataset.r; saveUi(); render(); });
  document.getElementById("seg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; state.status=b.dataset.s; saveUi(); render(); });
  var qi=document.getElementById("q"); qi.addEventListener("input",function(){ state.q=qi.value; renderGrid(); });
  document.getElementById("home").addEventListener("click",function(e){ e.preventDefault(); state.q="";qi.value="";state.region="전체";state.status="open";saveUi();render();window.scrollTo({top:0,behavior:"smooth"}); });
  document.getElementById("grid").addEventListener("click",onGridClick);
  document.getElementById("today").addEventListener("click",function(e){ var b=e.target.closest("[data-go]"); if(!b) return; state.status=b.dataset.go; saveUi(); render(); var t=document.getElementById("seg"); if(t) t.scrollIntoView({behavior:"smooth",block:"center"}); });
}

function render(){
  [].forEach.call(document.querySelectorAll(".chip"),function(b){ b.classList.toggle("on",b.dataset.r===state.region); });
  [].forEach.call(document.querySelectorAll("#seg button"),function(b){ b.classList.toggle("on",b.dataset.s===state.status); });
  renderToday(); renderDeals(); renderGrid();
}

function card(it){
  var s=statusOf(it), img=safeUrl(it.image), view=safeUrl(it.viewUrl), apply=safeUrl(it.applyUrl);
  var closed=s.key==="closed";
  return '<article class="card'+(closed?' is-closed':'')+'">'+
    '<div class="thumb">'+
      (view?'<a class="thumb-link" href="'+esc(view)+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+esc(it.name)+' 숙소보기">':'<div class="thumb-link">')+
      '<div class="ph">'+esc(it.region||"숙소")+'</div>'+
      (img?'<img src="'+esc(img)+'" alt="'+esc(it.name)+' 대표 사진" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+
      '<span class="badge '+s.key+'">'+s.label+'</span>'+(isPick(it)?'<span class="pick">💜 추천</span>':'')+
      (view?'</a>':'</div>')+
      '<button class="favbtn'+(isFav(it.id)?' on':'')+'" data-act="fav" data-id="'+esc(it.id)+'" aria-label="찜하기">'+(isFav(it.id)?'❤️':'🤍')+'</button></div>'+
    '<div class="meta"><span class="region">📍 '+esc(it.region)+'</span><span class="dot"></span><span class="dday '+s.key+'">'+s.dday+'</span></div>'+
    '<h3 class="name">'+esc(it.name)+'</h3>'+
    '<p class="benefit">🎁 '+esc(it.benefit)+'</p>'+
    '<p class="period">🗓️ '+(it.start?fmt(it.start)+' ':'')+'~ '+fmt(it.end)+' 모집</p>'+
    '<div class="actions card-act">'+
      (view?'<a class="btn view" href="'+esc(view)+'" target="_blank" rel="noopener noreferrer sponsored">🏨 숙소보기</a>':'<span class="btn disabled">숙소보기</span>')+
      (closed?'<span class="btn disabled">마감</span>':(apply?'<a class="btn apply" href="'+esc(apply)+'" target="_blank" rel="noopener noreferrer">✍️ 신청</a>':'<span class="btn disabled">준비중</span>'))+
    '</div></article>';
}

function renderGrid(){
  var g=document.getElementById("grid"); if(state.loading){ g.innerHTML='<div class="empty">불러오는 중… ✈️</div>'; return; }
  var list=filtered();
  var openCount=state.items.filter(function(i){return statusOf(i).key!=="closed";}).length;
  document.getElementById("count").innerHTML='<b>'+list.length+'</b>개 숙소 · 모집 중 '+openCount;
  var cards=[], n=0; list.forEach(function(it,i){ cards.push(card(it)); if((i+1)%4===0){ cards.push(adBox(n++)); } }); if(list.length && list.length%4!==0 && n===0){ cards.push(adBox(0)); }
  g.innerHTML = list.length ? cards.join("") : '<div class="empty"><b>🥲 조건에 맞는 숙소가 없어요</b>다른 지역이나 검색어로 찾아보세요.</div>';
  mountAds();
}

var ADS=[];
var DEALS=[];
var FAV=[]; try{ FAV=JSON.parse(localStorage.getItem("dakku-fav")||"[]")||[]; }catch(e){ FAV=[]; }
function isFav(id){ return FAV.indexOf(id)>=0; }
function toggleFav(id){ var i=FAV.indexOf(id); if(i>=0) FAV.splice(i,1); else FAV.push(id); try{ localStorage.setItem("dakku-fav",JSON.stringify(FAV)); }catch(e){} }
var LAST=0; try{ LAST=+(localStorage.getItem("dakku-last")||0); localStorage.setItem("dakku-last",String(Date.now())); }catch(e){}
function renderToday(){
  var el=document.getElementById("today"); if(!el) return;
  var td=ymd(today()), opened=0, closing=0, open=0, fresh=0, favSoon=0;
  state.items.forEach(function(it){ var k=statusOf(it).key; if(k==="open") open++; if(it.start===td&&k!=="closed") opened++; if(it.end===td&&k==="open") closing++;
    if(LAST && (it.createdAt||0)>LAST && k!=="closed") fresh++;
    if(isFav(it.id)&&k==="open"){ var en=parseDate(it.end); if(en && (en-today())/864e5<=3) favSoon++; } });
  var d=today(), wk="일월화수목금토"[d.getDay()];
  var html='<div class="upd">📅 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+wk+') · 매일 아침 새 체험단과 특가가 올라와요</div>'+
    '<div class="stats"><button data-go="todayOpen"><b>'+opened+'</b><span>🆕 오늘 오픈</span></button><button data-go="todayClose"><b>'+closing+'</b><span>🚨 오늘 마감</span></button><button data-go="open"><b>'+open+'</b><span>🔥 모집중</span></button></div>';
  if(fresh>0) html+='<div class="note new">✨ 지난 방문 이후 새 체험단 <b>'+fresh+'곳</b>이 올라왔어요</div>';
  if(favSoon>0) html+='<button class="note fav" data-go="fav">❤️ 찜한 체험단 중 <b>'+favSoon+'곳</b>이 3일 안에 마감돼요 ›</button>';
  el.innerHTML=html;
}
function renderDeals(){
  var el=document.getElementById("deals"); if(!el) return; if(!DEALS.length){ el.innerHTML=""; return; }
  el.innerHTML='<div class="dh"><h2>🎁 오늘의 숨은 특가</h2><span>'+(seed.dealsUpdated?fmt(seed.dealsUpdated)+' 업데이트':'')+'</span></div><div class="drow">'+
    DEALS.map(function(x){ return '<a class="dcard" style="background:'+esc(x.c||"#f6f4ff")+'" href="'+esc(safeUrl(x.u))+'" target="_blank" rel="noopener noreferrer sponsored">'+(x.tag?'<span class="dtag">'+esc(x.tag)+'</span>':'')+'<span class="de">'+esc(x.e)+'</span><b>'+esc(x.t)+'</b><small>'+esc(x.d)+'</small></a>'; }).join("")+'</div>';
}
function adBox(i){ if(!ADS.length) return ''; var a=ADS[i%ADS.length]; return '<div class="adbox"><a class="adtile" style="background:'+a.c+';border-color:'+a.k+'" href="'+a.u+'" target="_blank" rel="noopener noreferrer sponsored"><span class="ademo">'+a.e+'</span><span class="adtx"><b>'+a.t+'</b><small>'+a.d+'</small></span><span class="adgo">'+a.b+' ›</span></a></div>'; }
function mountAds(){}
/* ---------- events ---------- */
function onGridClick(e){
  var b=e.target.closest("[data-act]"); if(!b) return;
  if(b.dataset.act==="fav"){ e.preventDefault(); toggleFav(b.dataset.id); renderGrid(); renderToday(); return; }
}

var toastT;
function toast(msg){ var t=document.querySelector(".toast"); if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t);} t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(function(){t.remove();},2600); }

shell(); render();
fetch("data.json?v="+Date.now().toString(36).slice(0,-3),{cache:"no-cache"}).then(function(r){ return r.json(); }).then(function(d){
  seed=d||seed; state.items=Array.isArray(seed.items)?seed.items:[]; ADS=Array.isArray(seed.ads)?seed.ads:[]; DEALS=Array.isArray(seed.deals)?seed.deals:[];
  state.loading=false; render();
}).catch(function(){ state.loading=false; var g=document.getElementById("grid"); if(g) g.innerHTML='<div class="empty"><b>잠시 후 다시 시도해주세요</b>목록을 불러오지 못했어요.</div>'; });
})();