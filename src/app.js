'use strict';
/* ===== Utilitaires ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const I=(n,c='')=>`<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const MARK=(s=80,c='var(--blue)')=>`<svg width="${s*382/424}" height="${s}" style="color:${c}" aria-hidden="true"><use href="#lg-mark"/></svg>`;
const WORD=(w=180,c='#000')=>`<svg width="${w}" height="${w*275/690}" style="color:${c}" role="img" aria-label="Mon RDV Médical"><use href="#lg-text"/></svg>`;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const pad2=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const todayISO=()=>iso(new Date());
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtDate=s=>cap(new Date(s+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
const fmtShort=s=>new Date(s+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const sha=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rdv:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return btoa(unescape(encodeURIComponent('rdv:'+s)))}};
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ago=t=>{const m=Math.round((Date.now()-t)/60000);if(m<1)return'À l’instant';if(m<60)return`Il y a ${m} min`;const h=Math.round(m/60);if(h<24)return`Il y a ${h}h`;const d=Math.round(h/24);return d===1?'Hier':`Il y a ${d}j`};
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,PHONE_RE=/^(\+212|0)[5-7]\d{8}$/;

/* ===== Stockage local (démo : pas de serveur) ===== */
const KEY='rdv:v2';
let DB=(()=>{try{return JSON.parse(localStorage.getItem(KEY))||{users:[],session:null,guest:null,data:{}}}catch(e){return{users:[],session:null,guest:null,data:{}}}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('Stockage plein : photo trop lourde ?')}};
const me=()=>DB.session==='guest'?(DB.guest?{...DB.guest,id:'guest',guest:1}:null):DB.users.find(u=>u.id===DB.session)||null;
const D=()=>DB.data[DB.session]||(DB.data[DB.session]={appts:[],notifs:[],ratings:{},remind:true});
const allAppts=()=>Object.values(DB.data).flatMap(d=>d.appts||[]);
const prov=id=>PROVIDERS.find(p=>p.id===id);
const initials=n=>(n||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=(u,c='')=>`<span class="av ${c}">${u&&u.photo?`<img src="${u.photo}" alt="">`:esc(initials(u&&u.name))}</span>`;
const status=a=>a.cancelled?'ko':(new Date(a.date+'T'+a.time)<new Date()?'ok':'up');
const STX={up:'À venir',ok:'Terminé',ko:'Annulé'};
const rating=p=>{const r=(D().ratings||{})[p.id];return r?(p.r*9+r)/10:p.r};

/* ===== UI : toast, modal, drawer ===== */
let tT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>t.classList.remove('on'),2600)}
function modal(h){$('#mod').innerHTML=`<div class="msh" role="dialog" aria-modal="true">${h}</div>`;$('#mod').classList.add('on')}
function closeModal(){$('#mod').classList.remove('on');$('#mod').innerHTML=''}
function drawer(open){const d=$('#drw');if(!open){d.classList.remove('on');return}
 const u=me();d.innerHTML=`<nav><div class="top2">${MARK(46)}<div>${WORD(120)}</div></div>
 <button data-go="home">${I('home')}Accueil</button><button data-go="calendar">${I('cal')}Mes rendez-vous</button><button data-go="notifs">${I('bell')}Notifications</button><button data-go="profile">${I('user')}Profil</button><button data-a="support">${I('headset')}Support</button>
 <button class="lo" data-a="logout">${I('logout')}${u&&u.guest?'Quitter le mode visiteur':'Se déconnecter'}</button></nav>`;d.classList.add('on')}

/* ===== État de l'interface ===== */
const UI={tab:'doc',q:'',shown:10,pos:null,f:{spec:'',city:'',top:0,avail:0,sort:''},draft:null,editId:null,lastId:null,cm:new Date().getMonth(),cy:new Date().getFullYear(),sel:null,prefill:null,first:true};
const unread=()=>{if(!me())return 0;const n=Date.now();return D().notifs.filter(x=>x.at<=n&&!x.read).length};

/* ===== Routeur ===== */
const go=h=>{location.hash='#/'+h};
const PUBLIC=['splash','welcome','login','register','visitor'];
function route(){drawer(false);closeModal();const [r,a]=(location.hash.slice(2)||'splash').split('/');
 if(!PUBLIC.includes(r)&&!me()){return go('login')}
 if(['login','register','visitor','welcome'].includes(r)&&me()&&r!=='register'){return go('home')}
 const f=SC[r]||SC.splash;try{f(a)}catch(e){console.error(e);$('#screen').innerHTML=`<div class="screen"><div class="empty" style="margin:auto">${I('alert')}<br>Une erreur est survenue.<br><button class="btn blue" data-go="home">Retour à l’accueil</button></div></div>`}}
const mount=h=>{$('#screen').innerHTML=`<div class="screen">${h}</div>`};

/* ===== Éléments communs ===== */
const authHdr=()=>`<header class="hdr auth">${MARK(40)}<div style="display:inline-block;vertical-align:top;margin:2px 0 0 8px;text-align:left">${WORD(112)}</div><div class="slogan">Parce que vous êtes au cœur de tout, nous avons rapproché la guérison</div></header>`;
const homeHdr=()=>{const u=me(),n=unread();return`<header class="hdr home"><button class="ib" data-a="drawer" aria-label="Menu">${I('menu')}</button><div class="hi"><em>Bienvenue</em><b>${esc((u.name||'').split(' ')[0])}!</b></div><button class="ib" data-go="notifs" aria-label="Notifications">${I('bell')}${n?`<span class="badge">${n}</span>`:''}</button><button data-go="profile" aria-label="Profil">${avatar(u)}</button></header>`};
const barHdr=(t,back,home=1,dk=0)=>`<header class="hdr bar"><button class="ib ${dk?'dk':''}" data-back="${back}" aria-label="Retour">${I('back')}</button><h1>${t}</h1>${home?`<button class="ib dk" data-go="home" aria-label="Accueil">${I('home')}</button>`:''}</header>`;
const stars=r=>Array.from({length:5},(_,i)=>`<svg class="i ${i<Math.round(r)?'f':''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('');
const field=(id,label,icon,attrs='',extra='')=>`<div class="fld" id="f-${id}"><label for="${id}">${label}</label><div>${I(icon)}<input id="${id}" ${attrs}>${extra}</div></div>`;
const eye=`<button type="button" data-a="eye" aria-label="Afficher le mot de passe" style="color:#111">${I('eyeoff')}</button>`;
function ferr(id,msg){const f=$('#f-'+id)||$('#'+id)?.closest('.bi');if(f)f.classList.add('err');const e=$('#err');if(e)e.textContent=msg;$('#'+id)?.focus()}
const clearErr=()=>{$$('.err').forEach(x=>x.classList.remove('err'));const e=$('#err');if(e)e.textContent=''};

/* ===== Écrans ===== */
const SC={
splash(){$('#screen').innerHTML=`<div class="splash screen">${MARK(130,'#fff')}${WORD(210,'#fff')}<div class="sl">Parce que vous êtes au cœur de tout, nous avons rapproché la guérison</div><div class="fr">from<b>DES 101</b></div></div>`;
 const d=UI.first?1500:0;UI.first=false;setTimeout(()=>{if((location.hash.slice(2)||'splash')==='splash')go(me()?'home':'welcome')},d)},
welcome(){mount(`${authHdr()}<img class="welcome-ill" src="${A_IMG('ill-doctors.png')}" alt="" width="300"><div class="band">Avec <b>Mon RDV Médical</b> n’oubliez pas vos rendez-vous.<br>Détendez-vous votre rendez-vous est désormais confirmé !<br><br>Vous pouvez obtenir votre rendez-vous facilement, gagner du temps avec <b>Mon RDV Médical</b> et sélectionner le médecin de votre choix sans changer votre place.<br><b>Mon RDV Médical</b>, une meilleure organisation, une meilleure transparence et un service fiable. Vous avez la liberté de choisir. Fixez vos rendez-vous et ayez l’esprit tranquille.</div><div class="pad" style="padding-top:8px"><button class="btn blue" data-go="login" style="font-size:19px">Commencer</button></div>`)},
login(){mount(`${authHdr()}<div class="pad" style="position:relative;padding-top:12px"><div class="fh">Se connecter :</div><div class="sub">Content de te revoir</div>
 <div class="pill" aria-hidden="true"><span>${I('user')}</span><span class="on">${I('user')}</span><span>${I('user')}</span></div><div class="chk" aria-hidden="true"><i></i><i class="on"></i><i></i></div><img class="woman" src="${A_IMG('ill-woman.png')}" alt="">
 <form id="fm" novalidate>${field('em','Adresse Email','mail','type="email" placeholder="Entrer émail" autocomplete="email" inputmode="email"')}${field('pw','Mot de passe','lock','type="password" placeholder="Saisir le mot de passe" autocomplete="current-password"',eye)}
 <button type="button" class="link" data-a="forgot">Oublier le mot de passe?</button><div class="em" id="err" role="alert"></div><button class="btn" type="submit">Se connecter</button></form>
 <div class="or">Or</div><button class="btn" data-go="visitor">${I('visitor')}Continue comme un visiteur</button><div class="foot">J’ai pas un compte? <a class="lk" href="#/register">S’inscrire</a></div></div>`);
 $('#fm').onsubmit=async e=>{e.preventDefault();clearErr();const em=$('#em').value.trim().toLowerCase(),pw=$('#pw').value;
  if(!EMAIL_RE.test(em))return ferr('em','Adresse e-mail invalide.');if(!pw)return ferr('pw','Saisissez votre mot de passe.');
  const u=DB.users.find(x=>x.email===em);if(!u||u.hash!==await sha(em+pw))return ferr('pw','E-mail ou mot de passe incorrect.');
  DB.session=u.id;save();toast('Content de te revoir, '+u.name.split(' ')[0]+' !');go('home')}},
register(){const pf=UI.prefill||{};UI.prefill=null;mount(`${authHdr()}<div class="pad"><div class="fh">Inscription :</div><div class="sub">Créez votre compte pour gérer vos rendez-vous</div>
 <form id="fm" novalidate>${field('nm','Nom complet','badge',`placeholder="Nom et Prénom" autocomplete="name" value="${esc(pf.name||'')}"`)}${field('em','Adresse Email','mail',`type="email" placeholder="Entrer émail" autocomplete="email" value="${esc(pf.email||'')}"`)}${field('pw','Mot de passe','lock','type="password" placeholder="Min. 6 caractères" autocomplete="new-password"',eye)}
 <div class="em" id="err" role="alert"></div><button class="btn" type="submit">S’inscrire</button></form><div class="or">Or</div><button class="btn" data-go="visitor">${I('visitor')}Continue comme un visiteur</button><div class="foot">J’ai déjà un compte? <a class="lk" href="#/login">Se connecter</a></div></div>`);
 $('#fm').onsubmit=async e=>{e.preventDefault();clearErr();const nm=$('#nm').value.trim(),em=$('#em').value.trim().toLowerCase(),pw=$('#pw').value;
  if(nm.length<3)return ferr('nm','Entrez votre nom et prénom.');if(!EMAIL_RE.test(em))return ferr('em','Adresse e-mail invalide.');if(pw.length<6)return ferr('pw','Mot de passe : 6 caractères minimum.');
  if(DB.users.some(x=>x.email===em))return ferr('em','Un compte existe déjà avec cet e-mail.');
  const u={id:rid(),name:nm,email:em,phone:pf.phone||'',hash:await sha(em+pw)};DB.users.push(u);
  const g=DB.data.guest;DB.data[u.id]=g&&DB.session==='guest'?g:{appts:[],notifs:[],ratings:{},remind:true};if(g&&DB.session==='guest'){delete DB.data.guest;DB.guest=null}
  DB.session=u.id;DB.data[u.id].notifs.push({id:rid(),type:'new',title:'Bienvenue !',text:'Votre compte est créé. Trouvez un médecin et prenez rendez-vous en quelques clics.',at:Date.now(),read:0});save();toast('Compte créé');go('home')}},
visitor(){mount(`${authHdr()}<div class="pad" style="padding-top:26px"><div class="fh">Mode Visiteur :</div><div class="sub">Accédez à l’application sans créer de compte. Saisissez simplement votre nom complet.</div>
 <form id="fm" novalidate style="margin-top:26px">${field('nm','Nom complet','badge','placeholder="Nom et Prénom" autocomplete="name"')}<div class="em" id="err" role="alert"></div><button class="btn" type="submit">${I('visitor')}Commencer</button></form>
 <div class="or">Or</div><button class="btn" data-go="login">Se connecter</button><button class="btn" data-go="register">S’inscrire</button></div>`);
 $('#fm').onsubmit=e=>{e.preventDefault();clearErr();const nm=$('#nm').value.trim();if(nm.length<3)return ferr('nm','Entrez votre nom complet.');DB.guest={name:nm};DB.session='guest';DB.data.guest=DB.data.guest||{appts:[],notifs:[],ratings:{},remind:true};save();go('home')}},
home(){const f=UI.f,fc=(f.spec?1:0)+(f.city?1:0)+f.top+f.avail+(f.sort?1:0);mount(`${homeHdr()}<div class="search">${I('search')}<label class="sr" for="q">Rechercher</label><input id="q" type="search" placeholder="Chercher un méd ou un cabinet..." value="${esc(UI.q)}" autocomplete="off"><button class="fb ${fc?'on':''}" data-a="filters" aria-label="Filtres">${I('sliders')}</button></div>
 <div class="tabs" role="tablist"><button role="tab" data-a="tab" data-v="doc" class="${UI.tab=='doc'?'on':''}">${I('user')}Médecins</button><button role="tab" data-a="tab" data-v="cab" class="${UI.tab=='cab'?'on':''}">${I('pin','f')}Cabinets</button></div><div id="lst"></div>`);
 $('#q').oninput=e=>{UI.q=e.target.value;UI.shown=10;list()};list()},
provider(id){const p=prov(id);if(!p)return go('home');const av=p.avail;mount(`${homeHdr()}<div class="search">${I('search')}<input readonly value="${esc(p.n)}" aria-label="Recherche"><span style="color:var(--blue)">${I('sliders')}</span></div>
 <div class="tabs"><button class="${p.t=='doc'?'on':''}" data-a="tab" data-v="doc">${I('user')}Médecins</button><button class="${p.t=='cab'?'on':''}" data-a="tab" data-v="cab">${I('pin','f')}Cabinets</button></div>
 <div class="sheet"><button class="back" data-back="home">${I('back')}Retour</button>
 <div class="pd">${imgTag(p)}<div style="flex:1"><b>${esc(p.n)}</b><div class="ps">${esc(p.s)} <span class="av24 ${av?'':'no'}">${av?(p.h24?'Disponible 24h/24':'Disponible'):'Indisponible'}</span></div><p>${esc(p.short)}</p><div class="stars" style="justify-content:flex-start">${stars(rating(p))}</div></div></div>
 <div class="act"><div class="pat">Patients<b>${I('users')}${p.pat}</b></div><button class="btn" data-a="book" data-v="${p.id}" ${av?'':'disabled'}>Prendre un rendez-vous</button></div>
 <div class="chips">${p.t=='doc'?`<span>${I('briefcase')}${p.exp} ans d’expérience</span>`:''}<span>${I('tag')}${p.price} MAD</span><span>${I('lang')}${esc(p.langs)}</span>${p.tel?`<a href="tel:${p.tel}">${I('phone')}Appeler</a>`:''}</div>
 ${av?'':'<p class="em" style="margin:0 0 8px">Indisponible pour le moment : la prise de rendez-vous est fermée.</p>'}
 <div class="sec">A propos :</div><ul class="about">${p.about.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <div class="sec" style="margin-top:18px">${p.t=='cab'?'Hospital':'Cabinet'}</div><button class="place" data-a="route" data-v="${p.id}">${I('pin')}<span>${esc(p.place)}<small>${esc(p.addr)}</small></span>${I('chevron')}</button></div>`)},
book(id){const p=prov(id);if(!p||!p.avail)return go('home');const u=me(),ed=UI.editId?D().appts.find(a=>a.id===UI.editId):null,dr=UI.draft&&UI.draft.pid===id?UI.draft:null;
 const v=ed||dr||{};const pa=ed?ed.patient:dr?{name:dr.name,phone:dr.phone,email:dr.email}:{name:u.name||'',phone:u.phone||'',email:u.email||''};
 UI.sel2=v.time||'';mount(`${homeHdr()}<div class="search">${I('search')}<input readonly value="${esc(p.n)}" aria-label="Recherche"><span style="color:var(--blue)">${I('sliders')}</span></div><div class="tabs"><button class="on" data-a="tab" data-v="${p.t}">${I(p.t=='doc'?'user':'pin')}${p.t=='doc'?'Médecins':'Cabinets'}</button></div>
 <div class="sheet"><button class="back" data-back="provider/${p.id}">${I('back')}${ed?'Modifier le rendez-vous':'Prendre un rendez-vous'}</button>
 <div class="bk">${imgTag(p)}<div style="flex:1"><b>${esc(p.n)}</b><small>${esc(p.s)}. ${esc(p.city)}</small><small style="color:var(--blue)">${p.h24?'Disponible 24h/24':'Disponible'}</small></div><div class="rate" role="group" aria-label="Noter">${[1,2,3,4,5].map(n=>`<button data-a="rate" data-v="${p.id}:${n}" aria-label="${n} étoiles"><svg class="i ${n<=Math.round(rating(p))?'f':''}"><use href="#i-star"/></svg></button>`).join('')}</div></div>
 <form id="fm" novalidate><div class="bf">Nom Complet</div><div class="bi">${I('user')}<input id="bn" placeholder="Nom et Prénom...." value="${esc(pa.name)}" autocomplete="name"></div>
 <div class="bf">Téléphone</div><div class="bi">${I('phone')}<input id="bp" type="tel" placeholder="06 12 34 56 78" value="${esc(pa.phone)}" autocomplete="tel" inputmode="tel"></div>
 <div class="bf">Adress E-mail</div><div class="bi">${I('mail')}<input id="be" type="email" placeholder="Adress Email...." value="${esc(pa.email)}" autocomplete="email"></div>
 <div class="bf">Date Souhaitée</div><div class="bi">${I('cal')}<input id="bd" type="date" min="${todayISO()}" max="${iso(new Date(Date.now()+90*864e5))}" value="${esc(v.date||'')}"></div>
 <div class="bf">Créneau horaire</div><div class="slots" id="sl" role="group"></div><div class="em" id="sm" style="margin:6px 0 0"></div>
 <div class="bf">Motif de consultation:</div><textarea class="bt" id="bm" maxlength="300" placeholder="Décrivez brièvement votre motif....">${esc(v.motif||'')}</textarea>
 ${u.guest&&!ed?`<label class="acc"><input type="checkbox" id="ba" ${dr&&dr.createAccount?'checked':''}><span>Voulez-vous créer un compte avec ces information ?<small>Retrouvez vos RDV et historique facilement</small></span></label>`:''}
 <div class="em" id="err" role="alert"></div><button class="btn blue" type="submit" style="font-size:16px;box-shadow:0 4px 0 #0a5e8c">${ed?'Enregistrer les modifications':'Confirmer le Rendez-Vous'}</button><button type="button" class="btn gray" data-back="${ed?'calendar':'provider/'+p.id}" style="box-shadow:none">Annuler</button></form></div>`);
 const upd=()=>slots(p);$('#bd').onchange=()=>{UI.sel2='';upd()};upd();
 $('#fm').onsubmit=e=>{e.preventDefault();clearErr();const o={pid:p.id,name:$('#bn').value.trim(),phone:$('#bp').value.replace(/[\s.-]/g,''),email:$('#be').value.trim().toLowerCase(),date:$('#bd').value,time:UI.sel2,motif:$('#bm').value.trim(),createAccount:!!$('#ba')?.checked};
  if(o.name.length<3)return ferr('bn','Entrez votre nom complet.');if(!PHONE_RE.test(o.phone))return ferr('bp','Téléphone invalide (ex. 06 12 34 56 78 ou +212 6…).');if(!EMAIL_RE.test(o.email))return ferr('be','Adresse e-mail invalide.');
  if(!o.date)return ferr('bd','Choisissez une date.');if(!o.time){$('#sm').textContent='Choisissez un créneau horaire.';return}
  if(ed){const x=D().appts.find(a=>a.id===ed.id);Object.assign(x,{date:o.date,time:o.time,motif:o.motif,patient:{name:o.name,phone:o.phone,email:o.email}});D().notifs.push({id:rid(),type:'new',title:'RDV modifié',text:`Votre rendez-vous avec ${p.n} est déplacé au ${fmtShort(o.date)} à ${o.time}.`,at:Date.now(),read:0});save();UI.editId=null;toast('Rendez-vous modifié');return go('calendar')}
  UI.draft=o;save();go('pay/'+p.id)}},
pay(id){const p=prov(id),o=UI.draft;if(!p||!o||o.pid!==id)return go('home');UI.pm=UI.pm||'card';const M=[['card','Carte Bancaire','Visa, MasterCard, CMI, BMCE','card'],['mobile','Mobile Money','Orange Pay, Cash Plus, MT Cash','mobile'],['bank','Virement Bancaire','BMCE Direct, Attijari Mobile, CIH Mobile','mobile']];
 mount(`${barHdr('Paiement','book/'+id).replace(`data-back="book/${id}"`,`data-a="leavepay" data-v="${id}"`).replace('data-go="home"','data-a="leavepay" data-v="home"')}<div class="sum"><small>Résumé du RDV</small><div class="r"><div><b>Dr. ${esc(p.n)}</b><small style="font-weight:800;color:#555">${esc(p.s)}</small></div><div class="amt">${p.price} MAD</div></div><div class="m">${I('cal')}<span>${fmtShort(o.date)}</span>${I('clock')}<span>${o.time}</span></div></div>
 <div class="sec" style="text-align:center;font-size:15px;font-weight:500">Méthode de paiement :</div><div id="pms">${M.map(m=>`<button class="pm ${UI.pm==m[0]?'on':''}" data-a="pm" data-v="${m[0]}" role="radio" aria-checked="${UI.pm==m[0]}"><span class="ic">${I(m[3])}</span><span><b>${m[1]}</b><small>${m[2]}</small></span><span class="rd"></span></button>`).join('')}</div>
 <div id="pdt"></div><div class="sec-note">${I('shield')}Paiement sécurisé et chiffré (démo : aucun débit réel)</div><div class="em" id="err" role="alert" style="margin:0 20px"></div><div style="padding:0 18px 20px"><button class="btn info" data-a="icsd">${I('cal')}Enregistrer sur le calendrier</button><button class="btn blue" id="pb" style="font-size:16px">Payer ${p.price}DH</button></div>`);pmForm(p);
 $('#pb').onclick=()=>doPay(p)},
done(id){const a=D().appts.find(x=>x.id===id);if(!a)return go('home');const p=prov(a.pid),u=me();mount(`<header class="hdr green"><div class="chkc">${I('check')}</div><h1 style="font:800 18px Montserrat,Arial,sans-serif">Confirmé !</h1><p style="font:500 11px Montserrat,Arial,sans-serif;opacity:.9">Votre rendez-vous a été réservé avec succès</p></header>
 <div class="ccard"><h2>Dr. ${esc(p.n)}</h2><div class="sp">${esc(p.s)}</div><div class="row">${I('cal')}<span><b>${fmtDate(a.date)}</b>Date du rendez-vous</span></div><div class="row">${I('clock')}<span><b>${a.time}</b>Heure</span></div><div class="row">${I('pin')}<span><b>${esc(p.addr)}</b>${esc(p.place)}</span></div><div class="pay"><span>${a.paid?'Montant payé':'À régler (virement)'}</span><b>${a.price}DH</b></div><div style="text-align:center;font:600 10px Montserrat,Arial,sans-serif;color:#777;margin-top:6px">Réf. ${a.ref}</div></div>
 <div style="padding:0 24px 20px"><button class="btn soft" data-a="pdf" data-v="${a.id}">${I('download')}Télécharger le reçu PDF</button><button class="btn info" data-a="ics" data-v="${a.id}">${I('cal')}Enregistrer sur le calendrier</button>
 ${u.guest&&UI.createAcc?`<button class="btn blue" data-a="mkacc">Créer mon compte avec ces informations</button>`:''}<button class="btn gray" data-go="home">${I('home')}Retour à l’accueil</button></div>`)},
calendar(){const ap=D().appts,y=UI.cy,m=UI.cm,first=new Date(y,m,1).getDay(),nd=new Date(y,m+1,0).getDate(),by={};
 ap.forEach(a=>{const d=new Date(a.date+'T12:00');if(d.getMonth()==m&&d.getFullYear()==y){const k=d.getDate(),s=status(a),rk={up:3,ko:2,ok:1};if(!by[k]||rk[s]>rk[by[k]])by[k]=s}});
 const t=todayISO(),cells=[...Array(first).fill(0),...Array.from({length:nd},(_,i)=>i+1)];
 let list=[...ap];if(UI.sel)list=list.filter(a=>a.date===UI.sel);const o={up:0,ok:1,ko:2};list.sort((a,b)=>o[status(a)]-o[status(b)]||(status(a)==='up'?(a.date+a.time).localeCompare(b.date+b.time):(b.date+b.time).localeCompare(a.date+a.time)));
 const yrs=[];for(let k=y-2;k<=y+2;k++)yrs.push(k);
 mount(`${barHdr('Calendrier','home',1,1)}<div class="cal"><div class="sel"><label class="sr" for="cm">Mois</label><select id="cm">${MONTHS.map((n,i)=>`<option value="${i}" ${i==m?'selected':''}>${n}</option>`).join('')}</select><label class="sr" for="cy">Année</label><select id="cy">${yrs.map(k=>`<option ${k==y?'selected':''}>${k}</option>`).join('')}</select></div>
 <div class="gr">${['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(d=>`<div class="h">${d}</div>`).join('')}${cells.map(d=>{if(!d)return'<div></div>';const k=`${y}-${pad2(m+1)}-${pad2(d)}`;return`<button class="d ${by[d]||''} ${k===t?'today':''} ${UI.sel===k?'sel':''}" data-a="day" data-v="${k}" aria-label="${d} ${MONTHS[m]}">${d}</button>`}).join('')}</div></div>
 <div style="margin:10px 0 4px">${UI.sel?`<div class="ttl">${fmtDate(UI.sel)} <button class="lk" data-a="day" data-v="${UI.sel}" style="font-size:11px;margin-left:6px">Tout afficher</button></div>`:''}${list.length?list.map(a=>{const p=prov(a.pid),s=status(a);return`<button class="ap" data-a="appt" data-v="${a.id}"><span class="ci">${I('cal')}</span><span><b>${p.t=='doc'?'Dr. ':''}${esc(p.n)}</b><small>${esc(p.s.replace(/\.$/,''))}. ${fmtShort(a.date)}</small></span><span class="chip ${s}">${STX[s]}</span></button>`}).join(''):`<div class="empty">${I('cal')}<br>${UI.sel?'Aucun rendez-vous ce jour-là.':'Aucun rendez-vous pour le moment. Réservez votre première consultation.'}</div>`}</div>
 <div style="padding:6px 18px 24px"><button class="btn blue" data-go="home" style="box-shadow:0 4px 0 #0a5e8c">Ajouter un Rendez-Vous ${I('plus')}</button></div>`);
 $('#cm').onchange=e=>{UI.cm=+e.target.value;UI.sel=null;SC.calendar()};$('#cy').onchange=e=>{UI.cy=+e.target.value;UI.sel=null;SC.calendar()}},
notifs(){const n=Date.now(),L=D().notifs.filter(x=>x.at<=n).sort((a,b)=>b.at-a.at);const IC={ok:'check',pay:'check',ko:'alert',rem:'clock',new:'cal',msg:'mail'};
 mount(`${barHdr('Notification','home',1,1)}<div style="padding-top:2px">${L.length?L.map(x=>`<button class="nt ${x.read?'':'un'}" data-a="nread" data-v="${x.id}"><span class="ni ${x.type=='pay'?'ok':x.type=='msg'?'new':x.type}">${I(IC[x.type]||'cal')}</span><span style="flex:1"><b>${esc(x.title)}<i>${ago(x.at)}</i></b><p>${esc(x.text)}</p></span></button>`).join(''):`<div class="empty">${I('bell')}<br>Aucune notification pour le moment.</div>`}</div>
 ${L.length?`<div class="ng"><button class="btn info" data-a="readall">Tout marquer comme lu</button><button class="btn pink" data-a="clearn">Effacer</button></div>`:''}`)},
profile(){const u=me(),ap=D().appts,c={up:0,ok:0,ko:0};ap.forEach(a=>c[status(a)]++);const hist=[...ap].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,3);
 mount(`<header class="hdr bar" style="justify-content:space-between;padding-bottom:50px"><button class="ib dk" data-back="home" aria-label="Retour" style="color:#fff">${I('back')}</button><h1 style="text-align:center">Profil</h1><button class="ib dk" data-go="home" aria-label="Accueil">${I('home')}</button></header>
 <div class="prf" style="margin-top:-36px">${avatar(u)}<div><b>${esc((u.name||'').split(' ')[0])}</b><small>${esc(u.email||'Compte visiteur')}</small><small style="color:#aaa">${esc(u.phone||(u.guest?'Données non sauvegardées':'Ajouter un téléphone'))}</small></div>${u.guest?'':`<button class="ed" data-a="edit" aria-label="Modifier le profil">${I('edit')}</button>`}</div>
 <div class="st"><div><b>${ap.length}</b>RDV Total</div><div><b>${c.up}</b>À venir</div><div><b>${c.ok}</b>Terminé</div></div>
 <div class="sec" style="margin:0 18px 4px;font-size:14px">Historiques des RDV</div>${hist.length?hist.map(a=>{const p=prov(a.pid),s=status(a);return`<button class="ap" data-a="appt" data-v="${a.id}"><span class="ci">${I('cal')}</span><span><b>${p.t=='doc'?'Dr. ':''}${esc(p.n)}</b><small>${esc(p.s.replace(/\.$/,''))}. ${fmtShort(a.date)}</small></span><span class="chip ${s}">${STX[s]}</span></button>`}).join(''):'<div class="empty" style="padding:12px">Aucun rendez-vous.</div>'}
 <div style="margin-top:10px"><button class="mr" data-a="notset"><span class="ic">${I('bell')}</span><span><b>Notifications</b><small>Gérer Votre notices</small></span>${I('chevron')}</button>
 <button class="mr" data-a="secu"><span class="ic">${I('shield')}</span><span><b>Sécurité</b><small>Mot de passe & Confidentialité</small></span>${I('chevron')}</button>
 <button class="mr" data-a="support"><span class="ic">${I('headset')}</span><span><b>Support</b><small>Aide et contact</small></span>${I('chevron')}</button></div>
 ${u.guest?'<div style="padding:4px 18px"><button class="btn blue" data-go="register">Créer un compte</button></div>':''}<div style="padding:4px 18px 26px"><button class="btn pink" data-a="logout">${I('logout')}${u.guest?'Quitter':'Se déconnecter'}</button></div><p style="text-align:center;font:600 10px Montserrat,Arial,sans-serif;color:#999;padding-bottom:22px">Mon RDV Médical · v1.0 · DES 101</p>`)}
};

/* ===== Listes, carte, créneaux, paiement ===== */
const dist=(a,b,c,d)=>{const r=x=>x*Math.PI/180,x=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const km=p=>UI.pos?dist(UI.pos[0],UI.pos[1],p.lat,p.lng):null;
function match(p){const q=norm(UI.q),f=UI.f;if(f.spec&&p.k!==f.spec)return 0;if(f.city&&p.city!==f.city)return 0;if(f.top&&!p.top)return 0;if(f.avail&&!p.avail)return 0;return!q||norm([p.n,p.s,p.k,p.city,p.addr,p.short].join(' ')).includes(q)}
function sortL(a){const o=UI.f.sort;if(o==='note')return[...a].sort((x,y)=>rating(y)-rating(x));if(o==='prix')return[...a].sort((x,y)=>x.price-y.price);if(o==='distance'&&UI.pos)return[...a].sort((x,y)=>km(x)-km(y));return a}
const card=p=>{const d=km(p);return`<article class="pc"><div class="pph">${imgTag(p,'loading="lazy"')}<div class="stars">${stars(rating(p))}</div></div><div class="pb"><div class="pt"><b>${esc(p.n)}</b>${p.top?'<span class="top">Top</span>':''}</div><div class="ps">${esc(p.s)}<span class="cty"> · ${esc(p.city)}${d!=null?' · '+d.toFixed(d<10?1:0).replace('.',',')+' km':''}</span></div><p>${esc(p.short)}</p></div><button class="voir" data-go="provider/${p.id}" aria-label="Voir ${esc(p.n)}">Voir</button></article>`};
let MAP=null;
function list(){const el=$('#lst');if(!el)return;const q=UI.q.trim(),all=sortL(PROVIDERS.filter(p=>p.t===UI.tab&&match(p))),L=all.slice(0,UI.shown),more=all.length>L.length?`<div style="padding:4px 18px 22px"><button class="btn ghost" data-a="more">Afficher plus (${all.length-L.length})</button></div>`:'';
 if(UI.tab==='doc'){el.innerHTML=`<div class="ttl ${q?'':'c'}">${q?'Résultats de recherche':'Liste de Profil'} : ${all.length}</div>${L.map(card).join('')||'<div class="empty">'+I('search')+'<br>Aucun médecin trouvé. Essayez un autre nom, une spécialité ou retirez les filtres.</div>'}${more}`;return}
 el.innerHTML=`${q?'<div class="ttl">Résultat :</div>':''}<div class="mt"><span class="ttl c" style="font-size:20px;margin:0">Map :</span><button class="lk loc" data-a="locate">${I('locate')}Autour de moi</button></div><div class="map" id="map" role="application" aria-label="Carte des cabinets"></div><div class="ttl c">${q?'':'Suggestions :'}</div>${L.map(card).join('')||'<div class="empty">'+I('pin')+'<br>Aucun cabinet trouvé.</div>'}${more}`;initMap(all)}
function initMap(items){const el=$('#map');if(!el)return;if(MAP){try{MAP.remove()}catch(e){}MAP=null}const LF=window.L;
 if(!LF){el.style.backgroundImage=`url(${A_IMG('map.jpg')})`;el.innerHTML='<div class="mi">Carte interactive indisponible hors ligne</div>';return}
 MAP=LF.map(el).setView([33.99,-6.85],10);LF.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(MAP);
 const ic=LF.divIcon({className:'',html:`<div class="pin" style="margin:-34px 0 0 -14px">${I('pin','f').replace('class="i f"','class="i f" style="width:28px;height:28px"')}</div>`,iconSize:[28,34]});
 items.forEach(p=>LF.marker([p.lat,p.lng],{icon:ic,title:p.n}).addTo(MAP).bindPopup(`<b>${esc(p.n)}</b><br>${esc(p.addr)}<br><a href="#/provider/${p.id}">Voir</a>`));
 if(UI.pos)LF.circleMarker(UI.pos,{radius:7,color:'#fff',weight:2,fillColor:'#2657a3',fillOpacity:1}).addTo(MAP).bindPopup('Vous êtes ici');
 const pts=items.map(p=>[p.lat,p.lng]);if(UI.pos)pts.push(UI.pos);if(pts.length>1)MAP.fitBounds(pts,{padding:[30,30],maxZoom:12});else if(pts.length)MAP.setView(pts[0],13);setTimeout(()=>MAP&&MAP.invalidateSize(),80)}
function locate(cb){if(!navigator.geolocation)return toast('Géolocalisation non disponible');toast('Recherche de votre position…');navigator.geolocation.getCurrentPosition(p=>{UI.pos=[p.coords.latitude,p.coords.longitude];cb()},()=>toast('Position indisponible : autorisez la localisation'),{timeout:8000,maximumAge:60000})}
function slots(p){const SL=p.slots||SLOTS;const d=$('#bd').value,box=$('#sl'),sm=$('#sm');sm.textContent='';if(!d){box.innerHTML=SL.map(s=>`<button type="button" class="slot" disabled>${s}</button>`).join('');return}
 const dow=new Date(d+'T12:00').getDay();if(p.closed.includes(dow)){box.innerHTML=SL.map(s=>`<button type="button" class="slot" disabled>${s}</button>`).join('');sm.textContent='Fermé ce jour-là. Choisissez une autre date.';UI.sel2='';return}
 const taken=allAppts().filter(a=>a.pid===p.id&&a.date===d&&!a.cancelled&&a.id!==UI.editId).map(a=>a.time),now=new Date(),isT=d===todayISO();
 const ok=s=>!taken.includes(s)&&!(isT&&new Date(d+'T'+s)<=now);if(UI.sel2&&!ok(UI.sel2))UI.sel2='';
 box.innerHTML=SL.map(s=>`<button type="button" class="slot ${UI.sel2===s?'on':''}" data-a="slot" data-v="${s}" ${ok(s)?'':'disabled'} aria-pressed="${UI.sel2===s}">${s}</button>`).join('');
 if(!SL.some(ok))sm.textContent='Aucun créneau libre ce jour-là.'}
function pmForm(p){const m=UI.pm,b=$('#pdt');if(m==='card')b.innerHTML=`<div class="sec" style="text-align:center;font-size:15px;font-weight:500">Détails de la carte :</div><div class="pf"><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="Numéro de la carte" maxlength="19" aria-label="Numéro de la carte"><div class="two"><input id="cx" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" aria-label="Expiration"><input id="cv" inputmode="numeric" autocomplete="cc-csc" placeholder="CVV" maxlength="4" aria-label="CVV" type="password"></div></div>`;
 else if(m==='mobile')b.innerHTML=`<div class="pf" style="margin-top:8px"><input id="mp" type="tel" inputmode="tel" placeholder="Numéro Mobile Money (06…)" aria-label="Numéro Mobile Money" value="${esc(UI.draft.phone)}"></div>`;
 else{UI.ref=UI.ref||'RDV-'+Math.random().toString(36).slice(2,8).toUpperCase();b.innerHTML=`<div class="ref">Effectuez le virement puis conservez la référence :<br><b>${UI.ref}</b><br>RIB (démo) : 007 780 0001234567890123 45<br>Votre rendez-vous est réservé ; le paiement sera confirmé à réception.</div>`}
 const cn=$('#cn');if(cn){cn.oninput=()=>cn.value=cn.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();$('#cx').oninput=e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v};$('#cv').oninput=e=>e.target.value=e.target.value.replace(/\D/g,'')}}
const luhn=n=>{let s=0,a=0;for(let i=n.length-1;i>=0;i--){let d=+n[i];if(a){d*=2;if(d>9)d-=9}s+=d;a=!a}return n.length>=13&&s%10===0};
function doPay(p){const o=UI.draft,m=UI.pm;$('#err').textContent='';
 if(m==='card'){const n=$('#cn').value.replace(/\s/g,''),x=$('#cx').value,c=$('#cv').value,[mm,yy]=x.split('/');
  if(!luhn(n))return bad('Numéro de carte invalide.');if(!/^\d\d\/\d\d$/.test(x)||+mm<1||+mm>12||new Date(2000+ +yy,+mm,0,23,59)<new Date())return bad('Date d’expiration invalide.');if(!/^\d{3,4}$/.test(c))return bad('CVV invalide.')}
 if(m==='mobile'&&!PHONE_RE.test($('#mp').value.replace(/[\s.-]/g,'')))return bad('Numéro Mobile Money invalide.');
 const b=$('#pb');b.disabled=true;b.innerHTML='<span class="spin"></span>Paiement en cours…';
 setTimeout(()=>{const taken=allAppts().some(a=>a.pid===p.id&&a.date===o.date&&a.time===o.time&&!a.cancelled);
  if(taken){b.disabled=false;b.textContent='Payer '+p.price+'DH';return bad('Ce créneau vient d’être réservé. Choisissez-en un autre.')}
  const a={id:rid(),ref:m==='bank'?UI.ref:'RDV-'+Math.random().toString(36).slice(2,8).toUpperCase(),pid:p.id,date:o.date,time:o.time,motif:o.motif,price:p.price,method:m,paid:m!=='bank',patient:{name:o.name,phone:o.phone,email:o.email},created:Date.now()};
  const d=D(),n=Date.now();d.appts.push(a);d.notifs.push({id:rid(),type:'ok',title:'RDV Confirmé',text:`Votre rendez-vous avec Dr. ${p.n} est confirmé pour le ${fmtShort(a.date)} à ${a.time}.`,at:n,read:0});
  if(a.paid)d.notifs.push({id:rid(),type:'pay',title:'Paiement reçu',text:`Votre paiement de ${p.price} MAD a été traité avec succès.`,at:n,read:0});
  const rt=new Date(a.date+'T'+a.time).getTime()-864e5;if(rt>n)d.notifs.push({id:rid(),type:'rem',title:'Rappel de RDV',text:`N’oubliez pas votre rendez-vous demain à ${a.time} avec ${p.n}.`,at:rt,read:0,defer:1,aid:a.id});
  d.notifs.push({id:rid(),type:'msg',title:'Message de '+p.n,text:'Merci d’arriver 10 minutes avant l’heure du rendez-vous et de vous munir de votre pièce d’identité.',at:n+45000,read:0,defer:1});UI.createAcc=o.createAccount;UI.prefill=o.createAccount?{name:o.name,email:o.email,phone:o.phone}:null;UI.draft=null;UI.ref=null;UI.pm='card';save();go('done/'+a.id)},1300);
 function bad(t){$('#err').textContent=t;return}}

/* ===== Actions (délégation d'événements) ===== */
function ics(a){const p=prov(a.pid),s=a.date.replace(/-/g,'')+'T'+a.time.replace(':','')+'00',e=new Date(a.date+'T'+a.time);e.setMinutes(e.getMinutes()+30);const en=`${iso(e).replace(/-/g,'')}T${pad2(e.getHours())}${pad2(e.getMinutes())}00`;
 const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mon RDV Medical//FR','BEGIN:VEVENT',`UID:${a.id}@mon-rdv-medical`,`DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g,'')}`,`DTSTART:${s}`,`DTEND:${en}`,`SUMMARY:RDV ${p.n} (${p.s})`,`LOCATION:${p.addr}`,`DESCRIPTION:Référence ${a.ref}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Rappel de rendez-vous','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');dl(new Blob([t],{type:'text/calendar'}),`rdv-${a.ref}.ics`)}
function dl(b,n){const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=n;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(l.href),2000)}
function pdf(a){const p=prov(a.pid);if(!window.jspdf){return printReceipt(a,p)}const{jsPDF}=window.jspdf,d=new jsPDF({unit:'mm',format:'a5'});d.setFillColor(0,159,227);d.rect(0,0,148,28,'F');d.setTextColor(255);d.setFontSize(18);d.setFont('helvetica','bold');d.text('Mon RDV Médical',10,14);d.setFontSize(10);d.setFont('helvetica','normal');d.text('Reçu de rendez-vous',10,21);
 d.setTextColor(20);let y=42;const row=(k,v)=>{d.setFont('helvetica','bold');d.text(k,10,y);d.setFont('helvetica','normal');d.text(String(v),55,y,{maxWidth:80});y+=9};
 row('Référence',a.ref);row('Patient',a.patient.name);row('Téléphone',a.patient.phone);row('Médecin / Cabinet',(p.t=='doc'?'Dr. ':'')+p.n);row('Spécialité',p.s);row('Date',fmtDate(a.date));row('Heure',a.time);row('Lieu',p.addr);row('Paiement',({card:'Carte bancaire',mobile:'Mobile Money',bank:'Virement'})[a.method]+(a.paid?'':' (en attente)'));
 d.setDrawColor(0,159,227);d.line(10,y,138,y);y+=10;d.setFontSize(14);d.setFont('helvetica','bold');d.text(`Total : ${a.price} MAD`,10,y);d.setFontSize(8);d.setFont('helvetica','normal');d.setTextColor(110);d.text('Parce que vous êtes au cœur de tout, nous avons rapproché la guérison.',10,190);d.save(`recu-${a.ref}.pdf`)}
function printReceipt(a,p){const w=window.open('','_blank');if(!w)return toast('Autorisez les fenêtres pour imprimer le reçu');w.document.write(`<title>Reçu ${a.ref}</title><body style="font:15px Montserrat,Arial;padding:30px"><h1 style="color:#009fe3">Mon RDV Médical</h1><h3>Reçu de rendez-vous</h3><p>Réf. <b>${a.ref}</b><br>Patient : ${esc(a.patient.name)}<br>${p.t=='doc'?'Dr. ':''}${esc(p.n)} — ${esc(p.s)}<br>${fmtDate(a.date)} à ${a.time}<br>${esc(p.addr)}</p><h2>Total : ${a.price} MAD</h2>`);w.document.close();w.print()}
function apptSheet(a){const p=prov(a.pid),s=status(a);modal(`<h2>Rendez-vous <button data-a="close" aria-label="Fermer">${I('x')}</button></h2><div class="kv"><span>${p.t=='doc'?'Médecin':'Cabinet'}</span><b>${esc(p.n)}</b></div><div class="kv"><span>Spécialité</span><b>${esc(p.s)}</b></div><div class="kv"><span>Date</span><b>${fmtDate(a.date)}</b></div><div class="kv"><span>Heure</span><b>${a.time}</b></div><div class="kv"><span>Lieu</span><b>${esc(p.addr)}</b></div><div class="kv"><span>Statut</span><span class="chip ${s}" style="margin:0">${STX[s]}</span></div><div class="kv"><span>Montant</span><b>${a.price} MAD ${a.paid?'(payé)':'(à régler)'}</b></div><div class="kv"><span>Référence</span><b>${a.ref}</b></div>${a.motif?`<div class="kv"><span>Motif</span><b style="text-align:right;max-width:60%">${esc(a.motif)}</b></div>`:''}
 <button class="btn soft" data-a="pdf" data-v="${a.id}">${I('download')}Reçu PDF</button><button class="btn info" data-a="ics" data-v="${a.id}">${I('cal')}Ajouter au calendrier</button>${s==='up'?`<button class="btn ghost" data-a="mod" data-v="${a.id}">Modifier la date / l’heure</button><button class="btn pink" data-a="cancel" data-v="${a.id}">Annuler le rendez-vous</button>`:''}`)}
function pwModal(title,forgot){modal(`<h2>${title}<button data-a="close" aria-label="Fermer">${I('x')}</button></h2><form id="mf" novalidate>${forgot?`<div class="fld" id="f-fe"><label for="fe">Adresse Email</label><div>${I('mail')}<input id="fe" type="email" placeholder="Entrer émail"></div></div>`:`<div class="fld" id="f-op"><label for="op">Mot de passe actuel</label><div>${I('lock')}<input id="op" type="password" autocomplete="current-password"></div></div>`}<div class="fld" id="f-np"><label for="np">Nouveau mot de passe</label><div>${I('lock')}<input id="np" type="password" placeholder="Min. 6 caractères" autocomplete="new-password"></div></div>${forgot?'<p style="font:500 11px Montserrat,Arial,sans-serif;color:#666">Démo : sans serveur d’e-mail, la réinitialisation se fait directement sur cet appareil.</p>':''}<div class="em" id="err"></div><button class="btn blue" type="submit">Enregistrer</button></form>`);
 $('#mf').onsubmit=async e=>{e.preventDefault();clearErr();const np=$('#np').value;let u;
  if(forgot){const em=$('#fe').value.trim().toLowerCase();u=DB.users.find(x=>x.email===em);if(!u)return ferr('fe','Aucun compte avec cet e-mail.')}else{u=me();if(u.hash!==await sha(u.email+$('#op').value))return ferr('op','Mot de passe actuel incorrect.')}
  if(np.length<6)return ferr('np','6 caractères minimum.');DB.users.find(x=>x.id===u.id).hash=await sha(u.email+np);save();closeModal();toast('Mot de passe mis à jour')}}
function resize(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=256,c=document.createElement('canvas');c.width=c.height=s;const m=Math.min(im.width,im.height),x=(im.width-m)/2,y=(im.height-m)/2;c.getContext('2d').drawImage(im,x,y,m,m,0,0,s,s);cb(c.toDataURL('image/jpeg',.8))};im.onerror=()=>toast('Image illisible');im.src=r.result};r.readAsDataURL(file)}

const A={
 drawer:()=>drawer(true),close:()=>closeModal(),
 tab:(v)=>{UI.tab=v;UI.shown=10;if((location.hash.slice(2)||'').split('/')[0]!=='home')go('home');else SC.home()},
 eye:(v,b)=>{const i=b.parentElement.querySelector('input');const sh=i.type==='password';i.type=sh?'text':'password';b.innerHTML=I(sh?'eye':'eyeoff')},
 forgot:()=>pwModal('Mot de passe oublié',1),
 filters:()=>{const f=UI.f,ci=[...new Set(PROVIDERS.map(p=>p.city))].sort((a,b)=>a.localeCompare(b,'fr'));
  modal(`<h2>Filtres<button data-a="close" aria-label="Fermer">${I('x')}</button></h2><div class="fld"><label for="fs">Spécialité</label><div><select id="fs"><option value="">Toutes</option>${CATS(UI.tab).map(s=>`<option ${f.spec==s?'selected':''}>${esc(s)}</option>`).join('')}</select></div></div><div class="fld"><label for="fc">Ville</label><div><select id="fc"><option value="">Toutes</option>${ci.map(s=>`<option ${f.city==s?'selected':''}>${esc(s)}</option>`).join('')}</select></div></div>
  <div class="fld"><label for="fo">Trier par</label><div><select id="fo">${[['','Pertinence'],['note','Meilleure note'],['prix','Prix croissant'],['distance','Distance (autour de moi)']].map(([v,l])=>`<option value="${v}" ${f.sort==v?'selected':''}>${l}</option>`).join('')}</select></div></div>
  <label class="tg">Profils « Top » seulement<input type="checkbox" id="ft" ${f.top?'checked':''}></label><label class="tg">Disponibles seulement<input type="checkbox" id="fa" ${f.avail?'checked':''}></label><button class="btn blue" data-a="applyf">Appliquer</button><button class="btn gray" data-a="resetf">Réinitialiser</button>`)},
 applyf:()=>{UI.f={spec:$('#fs').value,city:$('#fc').value,sort:$('#fo').value,top:$('#ft').checked?1:0,avail:$('#fa').checked?1:0};UI.shown=10;const done=()=>{closeModal();SC.home()};if(UI.f.sort==='distance'&&!UI.pos)locate(done);else done()},
 resetf:()=>{UI.f={spec:'',city:'',top:0,avail:0,sort:''};UI.shown=10;closeModal();SC.home()},
 more:()=>{UI.shown+=10;list()},
 locate:()=>locate(()=>{UI.f.sort='distance';UI.shown=10;list();toast('Résultats triés par distance')}),
 route:(v)=>{const p=prov(v);window.open(`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`,'_blank','noopener')},
 book:(v)=>{UI.editId=null;go('book/'+v)},
 rate:(v)=>{const[id,n]=v.split(':');D().ratings[id]=+n;save();if(!UI.editId)UI.draft={pid:id,name:$('#bn').value,phone:$('#bp').value,email:$('#be').value,date:$('#bd').value,time:UI.sel2,motif:$('#bm').value,createAccount:!!$('#ba')?.checked};SC.book(id);toast('Merci pour votre note')},
 slot:(v,b)=>{UI.sel2=v;$$('.slot').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});$('#sm').textContent=''},
 pm:(v)=>{UI.pm=v;$$('.pm').forEach(x=>{x.classList.toggle('on',x.dataset.v===v);x.setAttribute('aria-checked',x.dataset.v===v)});pmForm(prov(location.hash.split('/')[2]))},
 icsd:()=>{const o=UI.draft;ics({id:'draft',ref:'à confirmer',pid:o.pid,date:o.date,time:o.time})},
 leavepay:(v)=>modal(`<h2>Voulez-vous terminer le processus de paiement ?</h2><p style="font:500 13px/1.5 Montserrat,Arial,sans-serif;margin-bottom:8px">Votre créneau n’est pas encore réservé. Vos informations sont conservées si vous revenez au formulaire.</p><button class="btn blue" data-a="close">Continuer le paiement</button><button class="btn gray" data-a="quitpay" data-v="${v}">Quitter</button>`),
 quitpay:(v)=>{closeModal();go(v==='home'?'home':'book/'+v)},
 pdf:(v)=>pdf(D().appts.find(a=>a.id===v)),ics:(v)=>ics(D().appts.find(a=>a.id===v)),
 mkacc:()=>go('register'),
 day:(v)=>{UI.sel=UI.sel===v?null:v;SC.calendar()},
 appt:(v)=>apptSheet(D().appts.find(a=>a.id===v)),
 mod:(v)=>{const a=D().appts.find(x=>x.id===v);UI.editId=v;closeModal();go('book/'+a.pid)},
 cancel:(v)=>{const a=D().appts.find(x=>x.id===v),p=prov(a.pid);modal(`<h2>Annuler ce rendez-vous ?</h2><p style="font:500 13px/1.5 Montserrat,Arial,sans-serif;margin-bottom:8px">${esc(p.n)} — ${fmtShort(a.date)} à ${a.time}.<br>${a.paid?'Le remboursement est traité sous 3 à 5 jours ouvrés (démo).':''}</p><button class="btn pink" data-a="cancel2" data-v="${v}">Oui, annuler</button><button class="btn gray" data-a="close">Non, garder</button>`)},
 cancel2:(v)=>{const a=D().appts.find(x=>x.id===v),p=prov(a.pid);a.cancelled=1;D().notifs=D().notifs.filter(n=>n.aid!==v);D().notifs.push({id:rid(),type:'new',title:'Nouveau créneau disponible',text:`${p.n} a un nouveau créneau le ${fmtShort(a.date)} à ${a.time}.`,at:Date.now()+30000,read:0,defer:1});D().notifs.push({id:rid(),type:'ko',title:'RDV Annulé',text:`Le rendez-vous avec ${p.n} du ${fmtShort(a.date)} a été annulé.`,at:Date.now(),read:0});save();closeModal();toast('Rendez-vous annulé');route()},
 nread:(v)=>{const n=D().notifs.find(x=>x.id===v);if(n&&!n.read){n.read=1;save();SC.notifs()}},
 readall:()=>{D().notifs.forEach(n=>n.read=1);save();SC.notifs()},
 clearn:()=>{const t=Date.now();D().notifs=D().notifs.filter(n=>n.at>t);save();SC.notifs()},
 edit:()=>{const u=me();modal(`<h2>Modifier le profil<button data-a="close" aria-label="Fermer">${I('x')}</button></h2><div style="text-align:center;margin-bottom:8px">${avatar(u,'')}<br><label class="btn ghost" style="display:inline-flex;width:auto;padding:6px 14px;font-size:12px;margin:8px 0 0">${I('camera')}Changer la photo<input type="file" id="ph" accept="image/*" class="sr"></label></div><form id="mf" novalidate>${field('en','Nom complet','badge',`value="${esc(u.name)}"`)}${field('ep','Téléphone','phone',`type="tel" placeholder="06 12 34 56 78" value="${esc(u.phone||'')}"`)}<div class="em" id="err"></div><button class="btn blue" type="submit">Enregistrer</button></form>`);
  let photo=null;$('#ph').onchange=e=>{const f=e.target.files[0];if(f)resize(f,d=>{photo=d;$('.msh .av').innerHTML=`<img src="${d}" alt="">`})};
  $('#mf').onsubmit=e=>{e.preventDefault();clearErr();const n=$('#en').value.trim(),p=$('#ep').value.replace(/[\s.-]/g,'');if(n.length<3)return ferr('en','Entrez votre nom.');if(p&&!PHONE_RE.test(p))return ferr('ep','Téléphone invalide.');const x=DB.users.find(k=>k.id===u.id);x.name=n;x.phone=p;if(photo)x.photo=photo;save();closeModal();toast('Profil mis à jour');SC.profile()}},
 notset:()=>{const d=D(),np=window.Notification?Notification.permission:'denied';modal(`<h2>Notifications<button data-a="close" aria-label="Fermer">${I('x')}</button></h2><label class="tg">Rappel la veille du rendez-vous<input type="checkbox" id="nr" ${d.remind?'checked':''}></label><div class="tg"><span>Alertes sur cet appareil<br><small style="font-weight:500;color:#777">${np==='granted'?'Activées':np==='denied'?'Bloquées dans le navigateur':'Non activées'}</small></span>${np==='default'?`<button class="btn blue" data-a="askperm" style="width:auto;padding:8px 14px;margin:0;font-size:12px">Activer</button>`:''}</div><button class="btn blue" data-a="savenot">Enregistrer</button>`)},
 askperm:()=>{Notification.requestPermission().then(()=>A.notset())},
 savenot:()=>{D().remind=$('#nr').checked;save();closeModal();toast('Préférences enregistrées')},
 secu:()=>{const u=me();modal(`<h2>Sécurité<button data-a="close" aria-label="Fermer">${I('x')}</button></h2>${u.guest?'<p style="font:500 13px/1.5 Montserrat,Arial,sans-serif">Créez un compte pour protéger vos données par mot de passe.</p><button class="btn blue" data-go="register">Créer un compte</button>':`<button class="btn info" data-a="chpw">${I('lock')}Changer le mot de passe</button><button class="btn gray" data-a="export">${I('download')}Exporter mes données</button><button class="btn pink" data-a="delacc">${I('trash')}Supprimer mon compte</button><p style="font:500 11px/1.4 Montserrat,Arial,sans-serif;color:#666">Vos données sont stockées uniquement sur cet appareil.</p>`}`)},
 chpw:()=>pwModal('Changer le mot de passe',0),
 export:()=>{const u=me(),o={profil:{nom:u.name,email:u.email,telephone:u.phone},rendez_vous:D().appts};dl(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}),'mes-donnees.json')},
 delacc:()=>modal(`<h2>Supprimer le compte ?</h2><p style="font:500 13px/1.5 Montserrat,Arial,sans-serif">Vos rendez-vous et notifications seront effacés définitivement de cet appareil.</p><button class="btn pink" data-a="delacc2">Supprimer définitivement</button><button class="btn gray" data-a="close">Annuler</button>`),
 delacc2:()=>{const id=DB.session;DB.users=DB.users.filter(u=>u.id!==id);delete DB.data[id];DB.session=null;save();closeModal();toast('Compte supprimé');go('welcome')},
 support:()=>{drawer(false);modal(`<h2>Support<button data-a="close" aria-label="Fermer">${I('x')}</button></h2><details class="faq"><summary>Comment prendre un rendez-vous ?</summary><p>Choisissez un médecin ou un cabinet, appuyez sur « Prendre un rendez-vous », remplissez le formulaire puis payez.</p></details><details class="faq"><summary>Comment annuler ou modifier ?</summary><p>Ouvrez le Calendrier, appuyez sur le rendez-vous puis « Modifier » ou « Annuler ».</p></details><details class="faq"><summary>Où est mon reçu ?</summary><p>Sur la page de confirmation ou dans le détail du rendez-vous : « Reçu PDF ».</p></details>
  <form id="mf" novalidate style="margin-top:10px"><div class="fld" id="f-sm"><label for="sm2">Votre message</label><div><input id="sm2" placeholder="Décrivez votre problème"></div></div><div class="em" id="err"></div><button class="btn blue" type="submit">Envoyer par e-mail</button></form>`);
  $('#mf').onsubmit=e=>{e.preventDefault();const m=$('#sm2').value.trim();if(m.length<5)return ferr('sm2','Écrivez votre message.');location.href=`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support Mon RDV Médical')}&body=${encodeURIComponent(m)}`}},
 logout:()=>{drawer(false);const g=DB.session==='guest';if(g){delete DB.data.guest;DB.guest=null}DB.session=null;save();toast(g?'Session visiteur terminée':'Déconnecté');go('login')}
};
document.addEventListener('click',e=>{const t=e.target;
 if(t.id==='mod')return closeModal();if(t.id==='drw')return drawer(false);
 const b=t.closest('[data-back]');if(b){const d=b.dataset.back;if(history.length>1&&d==='home'&&false)history.back();else go(d);return}
 const g=t.closest('[data-go]');if(g){e.preventDefault();return go(g.dataset.go)}
 const a=t.closest('[data-a]');if(a&&A[a.dataset.a]){e.preventDefault();A[a.dataset.a](a.dataset.v,a)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();drawer(false)}});

/* ===== Rappels : notifications échues ===== */
let lastSeen=Date.now();
function setBadge(){const n=unread(),b=$('.hdr.home [data-go="notifs"]');if(!b)return;let x=b.querySelector('.badge');if(n){if(!x){x=document.createElement('span');x.className='badge';b.appendChild(x)}x.textContent=n}else if(x)x.remove()}
function tick(){if(!me())return;const d=D(),n=Date.now(),all=d.notifs.filter(x=>x.at>lastSeen&&x.at<=n),due=all.filter(x=>x.defer);lastSeen=n;if(all.length)setBadge();if(!due.length)return;
 due.forEach(x=>{if(d.remind&&window.Notification&&Notification.permission==='granted')try{new Notification(x.title,{body:x.text,icon:'assets/icons/icon-192.png'})}catch(e){}});toast(due[0].title+' : '+due[0].text);setBadge();if((location.hash.slice(2)||'').split('/')[0]==='notifs')SC.notifs()}
setInterval(tick,5000);

/* ===== Démarrage ===== */
addEventListener('hashchange',route);
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
document.readyState==='loading'?addEventListener('DOMContentLoaded',route):route();
