import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "./firebase";

// ═══════════════════════════════════════════════════════════════
// NOKTA DİZAYN v4.5 — MÜŞTERİ SUNUM + MİMARİ PROJE PORTALI
// ═══════════════════════════════════════════════════════════════

const ADMINS=["ndgroupcompnies@gmail.com","adnan.ipekli@gmail.com","gozdeipekli@gmail.com","turnaertan@gmail.com"];

const STATUS_FLOW=[
  {id:"konsept",label:"Konsept Sunum",color:"#9B59B6",icon:"🎨",phase:"sunum"},
  {id:"konsept-onay",label:"Konsept Onay",color:"#8E44AD",icon:"👁️",phase:"sunum"},
  {id:"detay",label:"Detay Çalışma",color:"#2980B9",icon:"📐",phase:"detay"},
  {id:"teklif",label:"Fiyat Teklifi",color:"#F39C12",icon:"💰",phase:"detay"},
  {id:"onay",label:"Müşteri Onay",color:"#E67E22",icon:"✅",phase:"uygulama"},
  {id:"uretim",label:"Üretim",color:"#3498DB",icon:"🏭",phase:"uygulama"},
  {id:"kurulum",label:"Kurulum",color:"#1ABC9C",icon:"🔧",phase:"uygulama"},
  {id:"tamamlandi",label:"Tamamlandı",color:"#27AE60",icon:"🎉",phase:"uygulama"},
];

const KDV=0.20;const ELEC_KWH=4.2;

const EQUIPMENT={
  currency:"EUR",
  sogutma:{label:"Soğutma",icon:"❄️",currency:"EUR",items:[
    // NAVİ — Bombe Cam Kasap & Şarküteri Vitrini (Derinlik 1165mm)
    {id:"navi3750",brand:"Ecocold",name:"Navi Kasap Vitrini 375cm",model:"NAVİ-1165/3750",w:375,h:116,sicaklik:"0/+4°C",power:450,price:2350,curr:"EUR",color:"#E74C3C"},
    {id:"navi2500",brand:"Ecocold",name:"Navi Kasap Vitrini 250cm",model:"NAVİ-1165/2500",w:250,h:116,sicaklik:"0/+4°C",power:320,price:1605,curr:"EUR",color:"#E74C3C"},
    {id:"navi1875",brand:"Ecocold",name:"Navi Kasap Vitrini 187cm",model:"NAVİ-1165/1875",w:187,h:116,sicaklik:"0/+4°C",power:260,price:1420,curr:"EUR",color:"#E74C3C"},
    {id:"navi625",brand:"Ecocold",name:"Navi Kasap Vitrini 62cm",model:"NAVİ-1165/625",w:62,h:116,sicaklik:"0/+4°C",power:120,price:890,curr:"EUR",color:"#E74C3C"},
    // APPLE — Plug-in Dondurucu (Negatif)
    {id:"apple212",brand:"Ecocold",name:"Apple 212 Dondurucu",model:"APPLE-212-NT",w:212,h:90,sicaklik:"-18/-22°C",power:600,price:980,curr:"EUR",color:"#2980B9"},
    // Merkezi Soğutma
    {id:"merkezi30",brand:"Ecocold",name:"Pozitif Merkezi Soğutma 30.3kW",model:"ZBD45+2xZB45",w:120,h:100,sicaklik:"-10/+45°C",power:4590,price:9820,curr:"EUR",color:"#1A5276"},
  ]},
  sutluk:{label:"Sütlük",icon:"🥛",currency:"EUR",items:[
    // MERGA — Sütlük (855mm derinlik, 2040mm yükseklik, Zemin+4 raf)
    {id:"merga3750",brand:"Ecocold",name:"Merga Sütlük 375cm",model:"MERGA-855/3750",w:375,h:86,sicaklik:"+2/+8°C",power:320,price:3100,curr:"EUR",color:"#5DADE2"},
    {id:"merga2814",brand:"Ecocold",name:"Merga Sütlük 281cm",model:"MERGA-855/2814",w:281,h:86,sicaklik:"+2/+8°C",power:260,price:2670,curr:"EUR",color:"#5DADE2"},
    {id:"merga2500",brand:"Ecocold",name:"Merga Sütlük 250cm",model:"MERGA-855/2500",w:250,h:86,sicaklik:"+2/+8°C",power:240,price:2250,curr:"EUR",color:"#5DADE2"},
    {id:"merga1875",brand:"Ecocold",name:"Merga Sütlük 187cm",model:"MERGA-855/1875",w:187,h:86,sicaklik:"+2/+8°C",power:200,price:2000,curr:"EUR",color:"#5DADE2"},
    {id:"merga1250",brand:"Ecocold",name:"Merga Sütlük 125cm",model:"MERGA-855/1250",w:125,h:86,sicaklik:"+2/+8°C",power:160,price:1510,curr:"EUR",color:"#5DADE2"},
  ]},
  raf:{label:"Raf",icon:"🗄️",currency:"EUR",items:[
    // DUVAR ÜNİTESİ (H2200 D500)
    {id:"duvar1000",brand:"Pasifik Raf",name:"Duvar Ünitesi 100cm",model:"DW-H2200-D500-L1000",w:100,h:50,power:0,price:101,curr:"EUR",color:"#9B59B6"},
    {id:"duvar900",brand:"Pasifik Raf",name:"Duvar Ünitesi 90cm",model:"DW-H2200-D500-L900",w:90,h:50,power:0,price:94,curr:"EUR",color:"#9B59B6"},
    {id:"duvar700",brand:"Pasifik Raf",name:"Duvar Ünitesi 70cm",model:"DW-H2200-D500-L700",w:70,h:50,power:0,price:80,curr:"EUR",color:"#9B59B6"},
    {id:"duvar500",brand:"Pasifik Raf",name:"Duvar Ünitesi 50cm",model:"DW-H2200-D500-L500",w:50,h:50,power:0,price:68,curr:"EUR",color:"#9B59B6"},
    // ORTA REYON / GONDOL (H1600 D400, çift taraf)
    {id:"orta1000",brand:"Pasifik Raf",name:"Orta Reyon 100cm",model:"OR-H1600-D400-L1000",w:100,h:90,power:0,price:153,curr:"EUR",color:"#8E44AD"},
    {id:"orta700",brand:"Pasifik Raf",name:"Orta Reyon 70cm",model:"OR-H1600-D400-L700",w:70,h:90,power:0,price:138,curr:"EUR",color:"#8E44AD"},
    {id:"orta500",brand:"Pasifik Raf",name:"Orta Reyon 50cm",model:"OR-H1600-D400-L500",w:50,h:90,power:0,price:113,curr:"EUR",color:"#8E44AD"},
    // TEK YÖN ORTA REYON (H1600 D400, tek taraf)
    {id:"tekyon1000",brand:"Pasifik Raf",name:"Tek Yön Reyon 100cm",model:"TY-H1600-D400-L1000",w:100,h:50,power:0,price:82,curr:"EUR",color:"#7D3C98"},
    {id:"tekyon900",brand:"Pasifik Raf",name:"Tek Yön Reyon 90cm",model:"TY-H1600-D400-L900",w:90,h:50,power:0,price:76,curr:"EUR",color:"#7D3C98"},
    // ÖZEL ÜRÜNLER
    {id:"manavduvar",brand:"Pasifik Raf",name:"Manav Duvar Reyonu",model:"MANAV-DW",w:100,h:100,power:0,price:958,curr:"EUR",color:"#27AE60"},
    {id:"manavoran",brand:"Pasifik Raf",name:"Orta Manav Reyonu",model:"MANAV-OR",w:100,h:90,power:0,price:793,curr:"EUR",color:"#27AE60"},
    {id:"kasabanko",brand:"Pasifik Raf",name:"Kasa Banko 200cm",model:"KASA-L2000",w:200,h:100,power:150,price:932,curr:"EUR",color:"#E67E22"},
    {id:"unlumamul",brand:"Pasifik Raf",name:"Unlu Mamül Reyonu",model:"UNLU-SET",w:150,h:100,power:0,price:1347,curr:"EUR",color:"#D4A017"},
    {id:"kuruyemis1000",brand:"Pasifik Raf",name:"Kuruyemiş Standı 100cm",model:"KY-L1000",w:100,h:100,power:0,price:195,curr:"EUR",color:"#B8860B"},
    {id:"yumurta1000",brand:"Pasifik Raf",name:"Yumurta Standı 100cm",model:"YUM-L1000",w:100,h:100,power:0,price:260,curr:"EUR",color:"#F39C12"},
  ]},
  unlu:{label:"Fırın",icon:"🥐",items:[
    {id:"unl-srf-1",brand:"Nokta Dizayn",name:"Self-Servis Ekmek Rafı 120cm",model:"ND-BRD-1200",w:120,h:50,power:0,price:12000,color:"#D4A017"},
    {id:"unl-lat-1",brand:"Nokta Dizayn",name:"Ahşap Lata Ünitesi 250cm",model:"ND-LAT-2500",w:250,h:45,power:0,price:35000,color:"#B8860B"},
    {id:"unl-vtr",brand:"Nokta Dizayn",name:"Isıtmalı Vitrin 120cm",model:"ND-HTV-1200",w:120,h:70,power:1200,price:28000,color:"#E8A317"},
  ]},
  kahve:{label:"Kahve",icon:"☕",items:[
    {id:"khv-oto-1",brand:"WMF",name:"Oto. Kahve 1500S",model:"WMF-1500S",w:40,h:60,power:2800,price:185000,color:"#8B4513"},
    {id:"khv-bar-1",brand:"Nokta Dizayn",name:"Kahve Bar Tezgahı 200cm",model:"ND-CBR-2000",w:200,h:65,power:0,price:32000,color:"#A0522D"},
  ]},
  tezgah:{label:"Tezgah",icon:"🖥️",items:[
    {id:"tzg-kas-1",brand:"Nokta Dizayn",name:"Kasa Tezgahı 150cm",model:"ND-CSH-1500",w:150,h:70,power:0,price:18000,color:"#E67E22"},
    {id:"tzg-san-1",brand:"Nokta Dizayn",name:"Sandviç Tezgahı 200cm",model:"ND-SND-2000",w:200,h:80,power:0,price:28000,color:"#27AE60"},
  ]},
};

const ZONE_PRESETS=[
  {id:"sarku",label:"Şarküteri",color:"#C0392B",icon:"🧀",dW:400,dH:200,material:"Soğutmalı cam vitrin tezgah, mermer kaplama, LED spot aydınlatma",mood:"Premium deli atmosferi. Asma et dekorasyonu, peynir teşhiri, zeytin bar."},
  {id:"sandvic",label:"Sandviç Bar",color:"#27AE60",icon:"🥖",dW:350,dH:180,material:"Paslanmaz çelik tezgah, granit üst yüzey, soğutmalı ingredient vitrini",mood:"Açık mutfak konsepti. Müşteri malzemeleri görüp seçiyor, taze hazırlık."},
  {id:"unlu",label:"Unlu Mamüller",color:"#D4A017",icon:"🥐",dW:250,dH:250,material:"Ahşap lata duvar paneli, doğal meşe raf sistemi, cam vitrinli alt dolap",mood:"Artisan fırın havası. Self-servis simit/poğaça, vitrin pastane ürünleri."},
  {id:"kahve",label:"Kahve Köşesi",color:"#8B4513",icon:"☕",dW:200,dH:200,material:"Kompakt laminat tezgah, ahşap bar, tabure, LED ışıklı tabela",mood:"Coffee-to-go konsepti. Otomatik makine, hızlı servis, sıcak ambiyans."},
  {id:"soguk",label:"Soğuk İçecek",color:"#2980B9",icon:"🧊",dW:200,dH:150,material:"Dikey cam kapaklı soğutucu kabinler, LED iç aydınlatma",mood:"Ferah ve düzenli içecek duvarı. Kolay erişim, marka bazlı sıralama."},
  {id:"sutluk",label:"Sütlük",color:"#5DADE2",icon:"🥛",dW:250,dH:120,material:"Açık tip soğutmalı raf sistemi, beyaz LED aydınlatma",mood:"Temiz ve hijyenik görünüm. Süt, yoğurt, peynir çeşitleri."},
  {id:"raf",label:"Gondol Raf",color:"#9B59B6",icon:"🫙",dW:300,dH:100,material:"Metal raf sistemi, ahşap detay, fiyat etiketlik, LED raf aydınlatma",mood:"Düzenli ve kolay gezilebilir market alanı. Ürün gruplarına göre bölümlü."},
  {id:"kasa",label:"Kasa",color:"#E67E22",icon:"🖥️",dW:200,dH:120,material:"Laminat tezgah, POS sistemi, poşet alanı, impulse raf",mood:"Hızlı ödeme noktası. Kasa önü cazip ürünler, müşteri ekranı."},
  {id:"grab",label:"Grab & Go",color:"#16A085",icon:"🥪",dW:200,dH:150,material:"Soğutmalı self-servis dolap, etiketlik, LED aydınlatma",mood:"Hazır paketli ürünler. Sandviç, salata, meyve — al ve git konsepti."},
  {id:"dondurma",label:"Dondurma",color:"#3498DB",icon:"🍦",dW:180,dH:100,material:"Yatay cam kapaklı dondurucu, LED iç aydınlatma",mood:"Dondurma ve buzlu ürünler. Cam kapak ile ürün görünürlüğü."},
  {id:"et",label:"Et Reyonu",color:"#E74C3C",icon:"🥩",dW:350,dH:150,material:"Soğutmalı et vitrini, kasap tezgahı, paslanmaz çelik",mood:"Profesyonel kasap reyonu. Taze et teşhiri, hijyenik sunum."},
  {id:"serbest",label:"Serbest",color:"#7F8C8D",icon:"📐",dW:200,dH:200,material:"Proje ihtiyacına göre belirlenecek",mood:"Özel kullanım alanı."},
];

const TEMPLATES=[
  {id:"market-50",name:"Mini Market 50m²",type:"market",width:1000,height:500,zones:[
    {tid:"kasa",label:"Kasa",color:"#E67E22",icon:"🖥️",x:50,y:380,w:180,h:100,equip:[],notes:"",material:"",mood:""},
    {tid:"soguk",label:"Soğuk İçecek",color:"#2980B9",icon:"🧊",x:780,y:50,w:170,h:400,equip:[],notes:"",material:"",mood:""},
    {tid:"raf",label:"Raf 1",color:"#9B59B6",icon:"🫙",x:280,y:60,w:200,h:80,equip:[],notes:"Atıştırmalık",material:"",mood:""},
    {tid:"raf",label:"Raf 2",color:"#8E44AD",icon:"🫙",x:280,y:180,w:200,h:80,equip:[],notes:"Temel gıda",material:"",mood:""},
    {tid:"unlu",label:"Unlu Mamül",color:"#D4A017",icon:"🥐",x:280,y:320,w:200,h:130,equip:[],notes:"",material:"",mood:""},
  ]},
  {id:"sarku-200",name:"Gurme Şarküteri 200m²",type:"sarku-deli",width:1800,height:1100,zones:[
    {tid:"sarku",label:"Şarküteri",color:"#C0392B",icon:"🧀",x:80,y:60,w:700,h:220,equip:[],notes:"L-tipi vitrin",material:"Soğutmalı cam vitrin, mermer kaplama",mood:"Premium deli atmosferi"},
    {tid:"sandvic",label:"Sandviç Bar",color:"#27AE60",icon:"🥖",x:850,y:60,w:550,h:200,equip:[],notes:"",material:"Paslanmaz çelik tezgah",mood:"Açık mutfak"},
    {tid:"unlu",label:"Unlu Mamül",color:"#D4A017",icon:"🥐",x:1470,y:60,w:260,h:480,equip:[],notes:"Ahşap lata",material:"Meşe lata duvar",mood:"Artisan fırın havası"},
    {tid:"kahve",label:"Kahve",color:"#8B4513",icon:"☕",x:1470,y:580,w:260,h:230,equip:[],notes:"",material:"",mood:"Coffee-to-go"},
    {tid:"soguk",label:"Soğuk İçecek",color:"#2980B9",icon:"🧊",x:1470,y:850,w:260,h:190,equip:[],notes:"",material:"",mood:""},
    {tid:"raf",label:"Gurme Raf 1",color:"#9B59B6",icon:"🫙",x:350,y:660,w:480,h:110,equip:[],notes:"",material:"",mood:""},
    {tid:"raf",label:"Gurme Raf 2",color:"#8E44AD",icon:"🫙",x:350,y:810,w:480,h:110,equip:[],notes:"",material:"",mood:""},
    {tid:"kasa",label:"Kasa",color:"#E67E22",icon:"🖥️",x:880,y:880,w:300,h:150,equip:[],notes:"",material:"",mood:""},
    {tid:"grab",label:"Grab&Go",color:"#16A085",icon:"🥪",x:880,y:340,w:260,h:170,equip:[],notes:"",material:"",mood:""},
  ]},
];

const ZONE_COLORS=["#C0392B","#E74C3C","#E67E22","#F39C12","#D4A017","#B8860B","#27AE60","#16A085","#1ABC9C","#2980B9","#3498DB","#5DADE2","#8B4513","#9B59B6","#8E44AD","#7F8C8D","#2C3E50","#34495E"];
const WALL_TYPES=[{id:"solid",label:"Duvar",color:"#4a5568",th:15},{id:"glass",label:"Cam",color:"#3a8adf",th:8},{id:"half",label:"Yarım",color:"#6b7280",th:12},{id:"column",label:"Kolon",color:"#4a5568",th:40}];
const ELEC_TYPES=[{id:"priz",label:"Priz",color:"#F1C40F",icon:"⚡"},{id:"aydinlatma",label:"Aydınlatma",color:"#F9E79F",icon:"💡"},{id:"pano",label:"Pano",color:"#E74C3C",icon:"🔌"},{id:"klima",label:"Klima",color:"#5DADE2",icon:"❄️"}];
const PLUMB_TYPES=[{id:"lavabo",label:"Lavabo",color:"#3498DB",icon:"🚰"},{id:"pissu",label:"Pis Su",color:"#7F8C8D",icon:"🔽"},{id:"temizsu",label:"Temiz Su",color:"#2ECC71",icon:"💧"}];
const PROJ_TYPES=[{id:"market",l:"Market",i:"🏪"},{id:"sarku-deli",l:"Şarküteri",i:"🧀"},{id:"bakery",l:"Fırın",i:"🥐"},{id:"cafe",l:"Kafe",i:"☕"},{id:"butcher",l:"Kasap",i:"🥩"},{id:"gourmet",l:"Gurme",i:"🫙"},{id:"other",l:"Diğer",i:"📐"}];

const SC=0.08;
function cm(v){return v*SC}
function fmt(n){return n.toLocaleString("tr-TR")}

async function ld(k){try{const v=await loadData(k);return v?JSON.parse(v):null}catch{return null}}
async function sv(k,v){try{await saveData(k,JSON.stringify(v))}catch(e){console.error(e)}}
async function ldS(k){try{const v=await loadData(k);return v?JSON.parse(v):null}catch{return null}}
async function svS(k,v){try{await saveData(k,JSON.stringify(v))}catch(e){console.error(e)}}

function Logo({sz=40}){return<div style={{width:sz,height:sz,borderRadius:sz*.18,background:"linear-gradient(135deg,#2980B9,#1a3a5f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.38,fontWeight:900,color:"#ffffff",flexShrink:0}}>ND</div>}

// ─── APP ────────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);const[ready,setReady]=useState(false);
  useEffect(()=>{ld("ndv45-sess").then(s=>{if(s?.email)setUser(s);setReady(true)})},[]);
  const login=async email=>{const e=email.trim().toLowerCase();if(!e)return"e";const isA=ADMINS.includes(e);const us=await ldS("ndv45-users")||[];const f=us.find(u=>u.email===e);if(!isA&&!f)return"d";const s={email:e,role:isA?"admin":"user",name:f?.name||(isA?"Yönetici":""),at:Date.now()};setUser(s);await sv("ndv45-sess",s);return"ok"};
  const logout=async()=>{setUser(null);await sv("ndv45-sess",null)};
  if(!ready)return<div style={{minHeight:"100vh",background:"#f4f6f9",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><Logo sz={56}/><div style={{fontSize:22,fontWeight:200,color:"#2980B9",letterSpacing:8,marginTop:14}}>NOKTA DİZAYN</div><div style={{color:"#9aa0a8",fontSize:15,marginTop:8}}>v4.5 Yükleniyor...</div></div>;
  if(!user)return<LoginPage onLogin={login}/>;
  return<Portal user={user} onLogout={logout}/>;
}

function LoginPage({onLogin}){
  const[email,setEmail]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);
  const go=async()=>{if(!email.trim())return;setBusy(true);setErr("");const r=await onLogin(email);setBusy(false);if(r==="d")setErr("Bu e-posta kayıtlı değil. Yöneticinizden davet isteyin.")};
  return<div style={{minHeight:"100vh",background:"#f4f6f9",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
      <Logo sz={56}/><h1 style={{fontSize:22,fontWeight:200,color:"#2980B9",letterSpacing:8,margin:"12px 0 2px"}}>NOKTA DİZAYN</h1>
      <p style={{fontSize:14,color:"#7a8390",letterSpacing:2,margin:"0 0 24px"}}>MİMARİ PROJE PORTALI v4.5</p>
      <div style={{background:"#ffffff",borderRadius:12,padding:24,border:"1px solid #dce0e5",textAlign:"left"}}>
        <label style={{fontSize:14,color:"#5a6878",letterSpacing:1,display:"block",marginBottom:5}}>E-POSTA</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@email.com" onKeyDown={e=>e.key==="Enter"&&go()} style={{width:"100%",padding:"11px 13px",background:"#f8f9fb",border:"1px solid #d0d5db",borderRadius:7,color:"#1a2a3a",fontSize:18,outline:"none",boxSizing:"border-box",marginBottom:4}}/>
        {err&&<div style={{fontSize:14,color:"#e74c3c",padding:"4px 0"}}>{err}</div>}
        <button onClick={go} disabled={busy} style={{width:"100%",padding:"11px",marginTop:8,background:email.trim()?"linear-gradient(135deg,#2980B9,#1a3a5f)":"#dce0e5",border:"none",borderRadius:7,color:email.trim()?"#ffffff":"#333",fontSize:17,fontWeight:700,cursor:email.trim()?"pointer":"default"}}>{busy?"Giriş...":"GİRİŞ YAP"}</button>
      </div>
    </div>
  </div>;
}

// ─── PORTAL ─────────────────────────────────────────────────────
function Portal({user,onLogout}){
  const[page,setPage]=useState("dash");const[projects,setProjects]=useState([]);const[users,setUsers]=useState([]);const[active,setActive]=useState(null);const[viewMode,setViewMode]=useState("editor");const[ready,setReady]=useState(false);
  const isA=user.role==="admin";
  useEffect(()=>{(async()=>{setProjects(await ldS("ndv45-proj")||[]);setUsers(await ldS("ndv45-users")||[]);setReady(true)})()},[]);
  const saveP=async ps=>{setProjects(ps);await svS("ndv45-proj",ps)};
  const saveU=async us=>{setUsers(us);await svS("ndv45-users",us)};
  const myP=isA?projects:projects.filter(p=>p.owner===user.email);
  const goHome=()=>{setPage("dash");setActive(null);setViewMode("editor")};

  if(!ready)return<div style={{minHeight:"100vh",background:"#f4f6f9"}}></div>;

  return<div style={{minHeight:"100vh",background:"#f4f6f9",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#1a2a3a"}}>
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px",borderBottom:"1px solid #e8eaee",background:"#f8f9fb",flexWrap:"wrap",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={goHome}>
        <Logo sz={26}/><div><div style={{fontSize:15,fontWeight:600,color:"#1a2a3a",letterSpacing:3}}>NOKTA DİZAYN</div><div style={{fontSize:10,color:"#7a8390",letterSpacing:2}}>v4.5 PRO — SUNUM + MİMARİ</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
        {isA&&page==="dash"&&<NBtn onClick={()=>setPage("users")} t="👥 Kullanıcılar"/>}
        {page==="edit"&&<>
          <NBtn onClick={()=>setViewMode("editor")} t="📐 Editör" a={viewMode==="editor"}/>
          <NBtn onClick={()=>setViewMode("sunum")} t="🎨 Sunum" a={viewMode==="sunum"}/>
          <NBtn onClick={()=>setViewMode("3d")} t="🏗️ 3D" a={viewMode==="3d"}/>
          <NBtn onClick={()=>setViewMode("field")} t="🔧 Saha" a={viewMode==="field"}/>
        </>}
        {page!=="dash"&&<NBtn onClick={goHome} t="← Ana Sayfa"/>}
        <span style={{fontSize:13,color:"#5a6370"}}>{user.email.split("@")[0]}</span>
        <span style={{fontSize:11,padding:"1px 5px",background:isA?"#2980B918":"#27ae6018",borderRadius:3,color:isA?"#2980B9":"#27ae60"}}>{isA?"Admin":"User"}</span>
        <NBtn onClick={onLogout} t="Çıkış"/>
      </div>
    </nav>

    {page==="dash"&&<Dash projects={myP} all={projects} isA={isA} user={user} onOpen={p=>{setActive(p);setPage("edit")}} onNew={()=>setPage("new")} onTpl={()=>setPage("tpl")} onDel={async id=>{await saveP(projects.filter(p=>p.id!==id))}}/>}
    {page==="new"&&<NewProj user={user} isA={isA} users={users} onCancel={goHome} onCreate={async p=>{await saveP([...projects,p]);setActive(p);setPage("edit")}}/>}
    {page==="tpl"&&<TplPick user={user} onCancel={goHome} onCreate={async p=>{await saveP([...projects,p]);setActive(p);setPage("edit")}}/>}
    {page==="edit"&&active&&(
      viewMode==="sunum"?<PresentationMode project={active} onSave={async up=>{const ps=projects.map(p=>p.id===up.id?up:p);setActive(up);await saveP(ps)}}/>:
      viewMode==="3d"?<View3D project={active}/>:
      viewMode==="field"?<FieldView project={active}/>:
      <Editor project={active} user={user} onSave={async up=>{const ps=projects.map(p=>p.id===up.id?up:p);setActive(up);await saveP(ps)}}/>
    )}
    {page==="users"&&isA&&<UserMgmt users={users} projects={projects} onSave={saveU}/>}
  </div>;
}

function NBtn({onClick,t,a}){return<button onClick={onClick} style={{padding:"8px 14px",background:a?"#2980B922":"#dce0e5",border:a?"1px solid #2980B955":"1px solid #ccd2d9",borderRadius:4,color:a?"#2980B9":"#777",fontSize:13,cursor:"pointer"}}>{t}</button>}
function MBtn({t,a,onClick}){return<button onClick={onClick} style={{padding:"6px 12px",background:a?"#2980B918":"#f4f6f9",border:a?"1px solid #2980B944":"1px solid #dce0e5",borderRadius:3,color:a?"#2980B9":"#555",fontSize:12,cursor:"pointer"}}>{t}</button>}

// ═══════════════════════════════════════════════════════════════
// MÜŞTERİ SUNUM MODU — Fiyat bilgisi YOK, sadece görsel/konsept
// ═══════════════════════════════════════════════════════════════
// ─── GÖRSEL İYİLEŞTİR ────────────────────────────────────────────
function generateDesignTips(project){
  const zones=project.zones||[];const W=project.width,H=project.height;
  const totalArea=(W*H)/10000;const tips=[];
  // Genel oran önerileri
  const zoneArea=zones.reduce((s,z)=>s+(z.w*z.h)/10000,0);
  const coverage=zoneArea/totalArea;
  if(coverage<0.5)tips.push({cat:"Alan Kullanımı",icon:"📐",color:"#E67E22",tip:`Mevcut bölgeler alanın %${Math.round(coverage*100)}'ini kaplıyor. Ek ürün bölgeleri veya gondol rafları ekleyerek kullanımı artırabilirsiniz.`});
  if(coverage>0.85)tips.push({cat:"Sirkülasyon",icon:"🚶",color:"#E74C3C",tip:"Bölgeler alanın büyük kısmını kaplıyor. Müşteri sirkülasyonu için koridorları gözden geçirin (min 120cm önerilir)."});
  // Bölge önerileri
  const hasKasa=zones.some(z=>z.tid==="kasa");const hasSoguk=zones.some(z=>z.tid==="soguk"||z.tid==="sutluk");
  const hasUnlu=zones.some(z=>z.tid==="unlu");const hasKahve=zones.some(z=>z.tid==="kahve");
  if(!hasKasa)tips.push({cat:"Kasa Noktası",icon:"🖥️",color:"#E67E22",tip:"Kasa bölgesi tanımlanmamış. Girişe yakın, müşteri akışını yönlendiren bir kasa noktası önerilir."});
  if(!hasSoguk)tips.push({cat:"Soğuk Bölge",icon:"❄️",color:"#2980B9",tip:"Soğuk içecek veya sütlük bölgesi yok. Bu bölgeler yüksek impulse satış potansiyeli taşır."});
  if(hasUnlu&&!hasKahve)tips.push({cat:"Çapraz Satış",icon:"☕",color:"#8B4513",tip:"Unlu mamül bölgesi var ama kahve köşesi yok. Ekmek+kahve kombinasyonu sepet ortalamasını artırır."});
  // Aydınlatma ve renk
  tips.push({cat:"Aydınlatma",icon:"💡",color:"#F39C12",tip:"Ürün raflarında LED strip aydınlatma, vitrinlerde spotlight kullanımı ürün görünürlüğünü %30 artırabilir."});
  // Soğutma yerleşimi
  const coldZones=zones.filter(z=>["soguk","sutluk","grab","sarku","dondurma","et"].includes(z.tid));
  if(coldZones.length>0&&coldZones.some(z=>z.y<H*0.1))tips.push({cat:"Soğutma Verimliliği",icon:"🌡️",color:"#3498DB",tip:"Soğutmalı bölgeler girişe yakın konumlanmış. Dış duvar veya arka duvara alınması enerji tasarrufu sağlar."});
  // Premium sunum
  if(zones.some(z=>z.tid==="sarku"))tips.push({cat:"Premium Sunum",icon:"✨",color:"#9B59B6",tip:"Şarküteri bölgesinde mermer/granit tezgah üstü, asma aydınlatma ve ürün etiket çerçeveleri premium algısını güçlendirir."});
  if(tips.length===0)tips.push({cat:"Genel",icon:"👍",color:"#27AE60",tip:"Proje iyi yapılandırılmış görünüyor. Müşteri akışı, aydınlatma ve malzeme seçimlerine son kontrolü yapın."});
  return tips;
}

function DesignTipsModal({project,onClose}){
  const tips=generateDesignTips(project);
  return<div style={{position:"fixed",inset:0,background:"rgba(26,58,95,0.55)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
    <div style={{background:"#ffffff",borderRadius:16,padding:24,maxWidth:560,width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:700,color:"#1a3a5f",letterSpacing:1}}>✨ Görsel İyileştirme Önerileri</div><div style={{fontSize:13,color:"#7a8390",marginTop:2}}>{project.name}</div></div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9aa0a8"}}>✕</button>
      </div>
      {tips.map((t,i)=><div key={i} style={{background:t.color+"0d",border:`1px solid ${t.color}33`,borderRadius:10,padding:"12px 14px",marginBottom:8,borderLeft:`4px solid ${t.color}`}}>
        <div style={{fontSize:14,fontWeight:700,color:t.color,marginBottom:4}}>{t.icon} {t.cat}</div>
        <div style={{fontSize:14,color:"#3a4a5a",lineHeight:1.7}}>{t.tip}</div>
      </div>)}
      <button onClick={onClose} style={{width:"100%",marginTop:8,padding:"10px",background:"linear-gradient(135deg,#2980B9,#1a3a5f)",border:"none",borderRadius:8,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Kapat</button>
    </div>
  </div>;
}

function PresentationMode({project,onSave}){
  const[slide,setSlide]=useState("cover");
  const[walkIdx,setWalkIdx]=useState(0);
  const[showTips,setShowTips]=useState(false);
  const zones=project.zones||[];
  const walls=project.walls||[];
  const W=project.width,H=project.height;
  const totalArea=(W*H)/10000;

  const slides=[
    {id:"cover",label:"Kapak"},
    {id:"plan",label:"Yerleşim Planı"},
    {id:"3d",label:"3D Görünüm"},
    {id:"mood",label:"Konsept Board"},
    {id:"walk",label:"Walkthrough"},
    {id:"approve",label:"Onay"},
  ];

  const box={background:"#ffffff",borderRadius:12,padding:20,border:"1px solid #dce0e5",marginBottom:12};

  return<div style={{flex:1,overflow:"auto",background:"#f4f6f9"}}>
    {showTips&&<DesignTipsModal project={project} onClose={()=>setShowTips(false)}/>}
    {/* Slide navigation */}
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:4,padding:"12px 8px",borderBottom:"1px solid #e8eaee",flexWrap:"wrap"}}>
      {slides.map((s,i)=><button key={s.id} onClick={()=>setSlide(s.id)} style={{
        padding:"6px 16px",background:slide===s.id?"#2980B922":"transparent",
        border:slide===s.id?"1px solid #2980B955":"1px solid #ccd2d9",
        borderRadius:20,color:slide===s.id?"#2980B9":"#555",fontSize:14,cursor:"pointer",
        fontWeight:slide===s.id?600:400,
      }}>{i+1}. {s.label}</button>)}
      <button onClick={()=>setShowTips(true)} style={{padding:"6px 16px",background:"linear-gradient(135deg,#9B59B6,#6C3483)",border:"none",borderRadius:20,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginLeft:8}}>✨ Görsel İyileştir</button>
    </div>

    <div style={{maxWidth:700,margin:"0 auto",padding:"20px 16px"}}>
      {/* ─── COVER ─── */}
      {slide==="cover"&&<div style={{textAlign:"center",padding:"40px 20px"}}>
        <Logo sz={70}/>
        <h1 style={{fontSize:28,fontWeight:200,color:"#2980B9",letterSpacing:10,margin:"16px 0 6px"}}>NOKTA DİZAYN</h1>
        <div style={{fontSize:15,color:"#5a5550",letterSpacing:4,marginBottom:30}}>MİMARİ İÇ TASARIM KONSEPT SUNUMU</div>
        <div style={{width:60,height:1,background:"#2980B933",margin:"0 auto 30px"}}/>
        <div style={{fontSize:22,fontWeight:300,color:"#1a2a3a",letterSpacing:2}}>{project.name}</div>
        {project.customer&&<div style={{fontSize:18,color:"#2980B9",marginTop:8}}>Hazırlayan: Nokta Dizayn</div>}
        {project.customer&&<div style={{fontSize:18,color:"#8a8578",marginTop:4}}>Müşteri: {project.customer}</div>}
        <div style={{fontSize:15,color:"#9aa0a8",marginTop:20}}>{new Date().toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"})}</div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:30}}>
          {[{l:"Alan",v:`${totalArea.toFixed(0)} m²`},{l:"Bölge",v:`${zones.length}`},{l:"Tip",v:PROJ_TYPES.find(t=>t.id===project.type)?.l}].map((s,i)=>
            <div key={i}><div style={{fontSize:20,fontWeight:600,color:"#2980B9"}}>{s.v}</div><div style={{fontSize:13,color:"#5a6370"}}>{s.l}</div></div>)}
        </div>
        <button onClick={()=>setSlide("plan")} style={{marginTop:36,padding:"12px 36px",background:"linear-gradient(135deg,#2980B9,#1a3a5f)",border:"none",borderRadius:10,color:"#ffffff",fontSize:18,fontWeight:700,cursor:"pointer",letterSpacing:2}}>SUNUMA BAŞLA →</button>
      </div>}

      {/* ─── PLAN ─── */}
      {slide==="plan"&&<div>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:14,color:"#2980B9",letterSpacing:3}}>YERLEŞİM PLANI</div>
          <div style={{fontSize:18,fontWeight:300,color:"#1a2a3a",marginTop:4}}>{project.name}</div>
        </div>
        <div style={{...box,padding:12}}>
          <PlanSVG project={project} zones={zones} walls={walls} showLabels showDims/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6}}>
          {zones.map(z=><div key={z.id} style={{padding:"8px 10px",background:z.color+"0a",border:`1px solid ${z.color}33`,borderRadius:8}}>
            <div style={{fontSize:14,fontWeight:600,color:z.color}}>{z.icon} {z.label}</div>
            <div style={{fontSize:12,color:"#5a6370",marginTop:2}}>{((z.w*z.h)/10000).toFixed(1)} m² • {z.w/100}×{z.h/100}m</div>
          </div>)}
        </div>
      </div>}

      {/* ─── 3D ─── */}
      {slide==="3d"&&<div>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:14,color:"#2980B9",letterSpacing:3}}>3D KUŞ BAKIŞI</div>
          <div style={{fontSize:18,fontWeight:300,color:"#1a2a3a",marginTop:4}}>{project.name}</div>
        </div>
        <div style={box}><Iso3D project={project}/></div>
      </div>}

      {/* ─── MOOD BOARD / KONSEPT ─── */}
      {slide==="mood"&&<div>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:14,color:"#2980B9",letterSpacing:3}}>KONSEPT BOARD</div>
          <div style={{fontSize:18,fontWeight:300,color:"#1a2a3a",marginTop:4}}>Bölge Açıklamaları & Malzeme Notları</div>
        </div>
        {zones.map((z,i)=>{
          const preset=ZONE_PRESETS.find(p=>p.id===z.tid);
          const mat=z.material||preset?.material||"Belirlenecek";
          const mood=z.mood||preset?.mood||"—";
          return<div key={z.id} style={{...box,borderColor:z.color+"33",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:z.color}}/>
            <div style={{paddingLeft:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:18,fontWeight:600,color:z.color}}>{z.icon} {z.label}</div>
                  <div style={{fontSize:13,color:"#5a6370",marginTop:2}}>{z.w/100}m × {z.h/100}m — {((z.w*z.h)/10000).toFixed(1)} m²</div>
                </div>
                <div style={{fontSize:24,opacity:0.15}}>{z.icon}</div>
              </div>
              <div style={{marginTop:10}}>
                <div style={{fontSize:13,color:"#2980B9",letterSpacing:1,marginBottom:3}}>KONSEPT</div>
                <div style={{fontSize:15,color:"#a09a88",lineHeight:1.6}}>{mood}</div>
              </div>
              <div style={{marginTop:10}}>
                <div style={{fontSize:13,color:"#8B4513",letterSpacing:1,marginBottom:3}}>MALZEME & DETAY</div>
                <div style={{fontSize:15,color:"#8a8578",lineHeight:1.6}}>{mat}</div>
              </div>
              {z.notes&&<div style={{marginTop:10}}>
                <div style={{fontSize:13,color:"#7F8C8D",letterSpacing:1,marginBottom:3}}>NOT</div>
                <div style={{fontSize:15,color:"#6b6560",lineHeight:1.6}}>{z.notes}</div>
              </div>}
            </div>
          </div>
        })}
      </div>}

      {/* ─── WALKTHROUGH ─── */}
      {slide==="walk"&&<div>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:14,color:"#2980B9",letterSpacing:3}}>MEKAN TURU</div>
          <div style={{fontSize:18,fontWeight:300,color:"#1a2a3a",marginTop:4}}>Adım Adım Bölge Gezisi</div>
        </div>
        {zones.length>0&&<>
          {/* Progress bar */}
          <div style={{display:"flex",gap:3,marginBottom:16}}>
            {zones.map((z,i)=><div key={z.id} style={{flex:1,height:4,borderRadius:2,background:i<=walkIdx?z.color:"#dce0e5",transition:"all 0.3s"}}/>)}
          </div>
          {(()=>{
            const z=zones[walkIdx];if(!z)return null;
            const preset=ZONE_PRESETS.find(p=>p.id===z.tid);
            return<div style={{...box,borderColor:z.color+"44",textAlign:"center",padding:30}}>
              <div style={{fontSize:48,marginBottom:10}}>{z.icon}</div>
              <div style={{fontSize:14,color:"#5a6370",letterSpacing:3}}>DURAK {walkIdx+1} / {zones.length}</div>
              <div style={{fontSize:22,fontWeight:300,color:z.color,marginTop:6,letterSpacing:2}}>{z.label}</div>
              <div style={{width:40,height:1,background:z.color+"44",margin:"14px auto"}}/>
              <div style={{fontSize:16,color:"#a09a88",lineHeight:1.8,maxWidth:480,margin:"0 auto"}}>
                {z.mood||preset?.mood||"Bu bölge projenin önemli bir parçası."}
              </div>
              <div style={{marginTop:14,fontSize:15,color:"#5a6878",lineHeight:1.6}}>
                <span style={{color:"#8B4513"}}>Malzeme:</span> {z.material||preset?.material||"Belirlenecek"}
              </div>
              <div style={{marginTop:8,display:"flex",justifyContent:"center",gap:16,fontSize:14,color:"#7a8390"}}>
                <span>📐 {z.w/100}m × {z.h/100}m</span>
                <span>📏 {((z.w*z.h)/10000).toFixed(1)} m²</span>
              </div>
              {z.notes&&<div style={{marginTop:10,fontSize:14,color:"#6b6560",fontStyle:"italic"}}>📝 {z.notes}</div>}

              {/* Mini plan showing highlighted zone */}
              <div style={{marginTop:16}}><PlanSVG project={project} zones={zones} walls={walls} highlightId={z.id} small/></div>
            </div>
          })()}
          <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:12}}>
            <button onClick={()=>setWalkIdx(Math.max(0,walkIdx-1))} disabled={walkIdx===0} style={{padding:"10px 24px",background:walkIdx>0?"#dce0e5":"#f4f6f9",border:"1px solid #ccd2d9",borderRadius:8,color:walkIdx>0?"#2980B9":"#333",fontSize:16,cursor:walkIdx>0?"pointer":"default"}}>← Önceki</button>
            <button onClick={()=>setWalkIdx(Math.min(zones.length-1,walkIdx+1))} disabled={walkIdx>=zones.length-1} style={{padding:"10px 24px",background:walkIdx<zones.length-1?"linear-gradient(135deg,#2980B9,#1a3a5f)":"#eef1f5",border:"none",borderRadius:8,color:walkIdx<zones.length-1?"#ffffff":"#333",fontSize:16,fontWeight:700,cursor:walkIdx<zones.length-1?"pointer":"default"}}>Sonraki →</button>
          </div>
        </>}
      </div>}

      {/* ─── APPROVAL ─── */}
      {slide==="approve"&&<div style={{textAlign:"center",padding:"30px 20px"}}>
        <div style={{fontSize:14,color:"#2980B9",letterSpacing:3,marginBottom:16}}>KONSEPT ONAY</div>
        <div style={{...box,maxWidth:480,margin:"0 auto"}}>
          <div style={{fontSize:16,fontWeight:300,color:"#1a2a3a",marginBottom:8}}>{project.name}</div>
          {project.customer&&<div style={{fontSize:16,color:"#8a8578",marginBottom:16}}>Müşteri: {project.customer}</div>}
          <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:20}}>
            <div><div style={{fontSize:18,fontWeight:600,color:"#2980B9"}}>{totalArea.toFixed(0)}m²</div><div style={{fontSize:12,color:"#5a6370"}}>Alan</div></div>
            <div><div style={{fontSize:18,fontWeight:600,color:"#2980B9"}}>{zones.length}</div><div style={{fontSize:12,color:"#5a6370"}}>Bölge</div></div>
          </div>
          <div style={{width:"100%",height:1,background:"#ccd2d9",marginBottom:20}}/>

          {project.approvedAt?<div>
            <div style={{fontSize:40,marginBottom:8}}>✅</div>
            <div style={{fontSize:18,fontWeight:600,color:"#27AE60"}}>KONSEPT ONAYLANDI</div>
            <div style={{fontSize:14,color:"#5a6878",marginTop:6}}>{new Date(project.approvedAt).toLocaleString("tr-TR")}</div>
            {project.approvedBy&&<div style={{fontSize:14,color:"#5a6878",marginTop:2}}>Onaylayan: {project.approvedBy}</div>}
          </div>:<div>
            <div style={{fontSize:16,color:"#8a8578",lineHeight:1.8,marginBottom:20}}>
              Yukarıdaki yerleşim planı, 3D görünüm ve konsept board'u inceledikten sonra, bu konsepti onaylayarak detay çalışma sürecini başlatabilirsiniz.
            </div>
            <div style={{marginBottom:12}}>
              <input id="approverName" placeholder="Onaylayan adı (opsiyonel)" style={{width:"100%",maxWidth:300,padding:"8px 12px",background:"#f8f9fb",border:"1px solid #d0d5db",borderRadius:6,color:"#1a2a3a",fontSize:16,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
            </div>
            <button onClick={()=>{
              const name=document.getElementById("approverName")?.value||"";
              onSave({...project,approvedAt:Date.now(),approvedBy:name.trim()||project.customer||"Müşteri",status:"konsept-onay",updatedAt:Date.now()});
            }} style={{padding:"14px 40px",background:"linear-gradient(135deg,#27AE60,#1E8449)",border:"none",borderRadius:10,color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
              ✅ KONSEPTİ ONAYLIYORUM
            </button>
            <div style={{fontSize:12,color:"#9aa0a8",marginTop:10}}>Bu işlem tarih damgası ile kaydedilecektir</div>
          </div>}
        </div>
        {project.approvedAt&&<div style={{marginTop:20}}>
          <div style={{fontSize:14,color:"#5a6878",marginBottom:8}}>Onay sonrası süreç:</div>
          <div style={{display:"flex",justifyContent:"center",gap:6}}>
            {STATUS_FLOW.filter(s=>s.phase!=="sunum").map(s=><div key={s.id} style={{padding:"6px 12px",background:s.color+"15",border:`1px solid ${s.color}33`,borderRadius:6,fontSize:13,color:s.color}}>{s.icon} {s.label}</div>)}
          </div>
        </div>}
      </div>}
    </div>
  </div>;
}

// ─── PLAN SVG (shared) ──────────────────────────────────────────
function PlanSVG({project,zones,walls,highlightId,showLabels=true,showDims,small}){
  const W=project.width,H=project.height,PAD=small?25:40;
  const svgW=cm(W)+PAD*2,svgH=cm(H)+PAD*2;
  const uid=`pg-${W}-${H}`;
  return<svg viewBox={`0 0 ${svgW} ${svgH}`} style={{width:"100%",maxWidth:small?300:600,display:"block",margin:"0 auto",background:"#ffffff",borderRadius:4}}>
    <defs><pattern id={uid} width={cm(100)} height={cm(100)} patternUnits="userSpaceOnUse"><path d={`M ${cm(100)} 0 L 0 0 0 ${cm(100)}`} fill="none" stroke="#d5d9de" strokeWidth="0.3"/></pattern></defs>
    <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff"/>
    <rect x={PAD} y={PAD} width={cm(W)} height={cm(H)} fill={`url(#${uid})`}/>
    <rect x={PAD} y={PAD} width={cm(W)} height={cm(H)} fill="none" stroke={small?"#ccd2d9":"#2a3545"} strokeWidth={small?2:3} rx={1}/>
    {/* Entrance */}
    {(()=>{const e=project.entrance||{side:"bottom",position:50,widthCm:200};const eW=cm(e.widthCm);let ex,ey,ew,eh;if(e.side==="bottom"){ex=PAD+cm(W)*(e.position/100)-eW/2;ey=PAD+cm(H)-2;ew=eW;eh=4}else if(e.side==="top"){ex=PAD+cm(W)*(e.position/100)-eW/2;ey=PAD-2;ew=eW;eh=4}else if(e.side==="left"){ex=PAD-2;ey=PAD+cm(H)*(e.position/100)-eW/2;ew=4;eh=eW}else{ex=PAD+cm(W)-2;ey=PAD+cm(H)*(e.position/100)-eW/2;ew=4;eh=eW}return<><rect x={ex} y={ey} width={ew} height={eh} fill="#edf0f5"/>{!small&&<text x={e.side==="bottom"?ex+ew/2:ex+10} y={e.side==="bottom"?ey+12:ey+eh/2} textAnchor="middle" fill="#2980B9" fontSize={small?4:6}>GİRİŞ</text>}</>})()}
    {showDims&&<><text x={PAD+cm(W)/2} y={PAD-8} textAnchor="middle" fill="#5a7090" fontSize={6}>{W}cm ({(W/100).toFixed(1)}m)</text><text x={PAD-10} y={PAD+cm(H)/2} textAnchor="middle" fill="#5a7090" fontSize={6} transform={`rotate(-90,${PAD-10},${PAD+cm(H)/2})`}>{H}cm</text></>}
    {walls.map(w=>{const wt=WALL_TYPES.find(t=>t.id===w.type)||WALL_TYPES[0];return<line key={w.id} x1={PAD+cm(w.x1)} y1={PAD+cm(w.y1)} x2={PAD+cm(w.x2)} y2={PAD+cm(w.y2)} stroke={wt.color} strokeWidth={cm(wt.th)*(small?0.5:1)} strokeLinecap="round" strokeDasharray={w.type==="glass"?"4,3":"none"} opacity={0.6}/>})}
    {zones.map(z=>{const isHL=highlightId===z.id;const rx=PAD+cm(z.x),ry=PAD+cm(z.y),rw=cm(z.w),rh=cm(z.h);return<g key={z.id}>
      <rect x={rx} y={ry} width={rw} height={rh} fill={z.color+(isHL?"50":"25")} stroke={z.color+(isHL?"ff":"99")} strokeWidth={isHL?2.5:0.7} rx={2}/>
      {showLabels&&<><text x={rx+rw/2} y={ry+rh/2-1} textAnchor="middle" fill={z.color} fontSize={Math.min(small?5:6.5,rw/(small?6:8))} fontWeight="bold" style={{pointerEvents:"none"}}>{z.icon} {z.label}</text>{!small&&<text x={rx+rw/2} y={ry+rh/2+6} textAnchor="middle" fill={z.color+"66"} fontSize={Math.min(9,rw/8)} style={{pointerEvents:"none"}}>{((z.w*z.h)/10000).toFixed(1)}m²</text>}</>}
    </g>})}
  </svg>;
}

// ─── ISO 3D (shared) ────────────────────────────────────────────
function Iso3D({project}){
  const zones=project.zones||[];const walls=project.walls||[];
  const W=project.width,H=project.height;
  const iX=(x,y)=>((x-y)*0.7)+300;const iY=(x,y,z=0)=>((x+y)*0.35)-z+250;
  return<svg width="100%" viewBox="0 0 600 400" style={{display:"block",maxWidth:600,margin:"0 auto",background:"#f8f9fb",borderRadius:8}}>
    <rect x={0} y={0} width={600} height={400} fill="#f8f9fb"/>
    <polygon points={`${iX(0,0)},${iY(0,0)} ${iX(W/20,0)},${iY(W/20,0)} ${iX(W/20,H/20)},${iY(W/20,H/20)} ${iX(0,H/20)},${iY(0,H/20)}`} fill="#e8edf5" stroke="#5a7090" strokeWidth={1}/>
    {Array.from({length:Math.floor(W/200)+1}).map((_,i)=><line key={`gv${i}`} x1={iX(i*10,0)} y1={iY(i*10,0)} x2={iX(i*10,H/20)} y2={iY(i*10,H/20)} stroke="#c8cdd2" strokeWidth={0.3}/>)}
    {Array.from({length:Math.floor(H/200)+1}).map((_,i)=><line key={`gh${i}`} x1={iX(0,i*10)} y1={iY(0,i*10)} x2={iX(W/20,i*10)} y2={iY(W/20,i*10)} stroke="#c8cdd2" strokeWidth={0.3}/>)}
    {walls.map((w,i)=>{const x1=w.x1/20,y1=w.y1/20,x2=w.x2/20,y2=w.y2/20;const wt=WALL_TYPES.find(t=>t.id===w.type)||WALL_TYPES[0];return<polygon key={i} points={`${iX(x1,y1)},${iY(x1,y1)} ${iX(x2,y2)},${iY(x2,y2)} ${iX(x2,y2)},${iY(x2,y2,15)} ${iX(x1,y1)},${iY(x1,y1,15)}`} fill={wt.color+"44"} stroke={wt.color} strokeWidth={0.5}/>})}
    {zones.map(z=>{const x=z.x/20,y=z.y/20,w=z.w/20,h=z.h/20,zh=6;return<g key={z.id}>
      <polygon points={`${iX(x,y)},${iY(x,y,zh)} ${iX(x+w,y)},${iY(x+w,y,zh)} ${iX(x+w,y+h)},${iY(x+w,y+h,zh)} ${iX(x,y+h)},${iY(x,y+h,zh)}`} fill={z.color+"33"} stroke={z.color+"88"} strokeWidth={0.7}/>
      <polygon points={`${iX(x,y+h)},${iY(x,y+h,zh)} ${iX(x+w,y+h)},${iY(x+w,y+h,zh)} ${iX(x+w,y+h)},${iY(x+w,y+h)} ${iX(x,y+h)},${iY(x,y+h)}`} fill={z.color+"22"} stroke={z.color+"55"} strokeWidth={0.5}/>
      <polygon points={`${iX(x+w,y)},${iY(x+w,y,zh)} ${iX(x+w,y+h)},${iY(x+w,y+h,zh)} ${iX(x+w,y+h)},${iY(x+w,y+h)} ${iX(x+w,y)},${iY(x+w,y)}`} fill={z.color+"18"} stroke={z.color+"44"} strokeWidth={0.5}/>
      <text x={iX(x+w/2,y+h/2)} y={iY(x+w/2,y+h/2,zh+2)} textAnchor="middle" fill={z.color} fontSize={6} fontWeight="bold">{z.icon}{z.label}</text>
    </g>})}
  </svg>;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dash({projects,all,isA,user,onOpen,onNew,onTpl,onDel}){
  const[cfm,setCfm]=useState(null);const[filt,setFilt]=useState("all");const[sFilt,setSFilt]=useState("all");
  const shown=projects.filter(p=>(filt==="all"||p.owner===filt)&&(sFilt==="all"||p.status===sFilt));
  const owners=[...new Set(all.map(p=>p.owner))];
  const phases=[{id:"sunum",l:"Sunum",c:"#9B59B6"},{id:"detay",l:"Detay",c:"#2980B9"},{id:"uygulama",l:"Uygulama",c:"#27AE60"}];

  return<div style={{maxWidth:920,margin:"0 auto",padding:"16px 12px"}}>
    {/* Status bar */}
    <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
      <div onClick={()=>setSFilt("all")} style={{padding:"6px 12px",background:sFilt==="all"?"#2980B915":"#f4f6f9",border:`1px solid ${sFilt==="all"?"#2980B944":"#dce0e5"}`,borderRadius:7,cursor:"pointer",minWidth:60,textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:700,color:"#2980B9"}}>{projects.length}</div><div style={{fontSize:11,color:"#5a6370"}}>Tümü</div>
      </div>
      {STATUS_FLOW.map(s=>{const c=projects.filter(p=>p.status===s.id).length;return<div key={s.id} onClick={()=>setSFilt(sFilt===s.id?"all":s.id)} style={{padding:"6px 10px",background:sFilt===s.id?s.color+"22":"#f4f6f9",border:`1px solid ${sFilt===s.id?s.color+"55":"#dce0e5"}`,borderRadius:7,cursor:"pointer",minWidth:55,textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:18,fontWeight:700,color:s.color}}>{c}</div><div style={{fontSize:11,color:"#5a6370"}}>{s.icon}{s.label}</div>
      </div>})}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
      <h2 style={{margin:0,fontSize:16,fontWeight:300,color:"#1a2a3a",letterSpacing:2}}>{isA?"Tüm Projeler":"Projelerim"}</h2>
      <div style={{display:"flex",gap:4}}>
        <button onClick={onTpl} style={{padding:"7px 14px",background:"#eef1f5",border:"1px solid #ccd2d9",borderRadius:6,color:"#2980B9",fontSize:14,cursor:"pointer"}}>📂 Şablon</button>
        <button onClick={onNew} style={{padding:"7px 16px",background:"linear-gradient(135deg,#2980B9,#1a3a5f)",border:"none",borderRadius:6,color:"#ffffff",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Yeni</button>
      </div>
    </div>

    {isA&&owners.length>1&&<div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>
      <MBtn t="Tümü" a={filt==="all"} onClick={()=>setFilt("all")}/>
      {owners.map(o=><MBtn key={o} t={o.split("@")[0]} a={filt===o} onClick={()=>setFilt(o)}/>)}
    </div>}

    {shown.length===0?<div style={{textAlign:"center",padding:"40px",border:"2px dashed #ccd2d9",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>📐</div><div style={{fontSize:17,color:"#7a8390"}}>Proje bulunamadı</div></div>
    :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
      {shown.map(p=>{const st=STATUS_FLOW.find(s=>s.id===p.status)||STATUS_FLOW[0];return<div key={p.id} style={{background:"#ffffff",border:"1px solid #dce0e5",borderRadius:9,padding:12,cursor:"pointer",position:"relative"}} onClick={()=>onOpen(p)}>
        <div style={{position:"absolute",top:7,right:7,display:"flex",gap:3}}>
          <span style={{fontSize:11,padding:"2px 5px",background:st.color+"18",borderRadius:3,color:st.color}}>{st.icon}{st.label}</span>
          {p.approvedAt&&<span style={{fontSize:11,padding:"2px 5px",background:"#27AE6018",borderRadius:3,color:"#27AE60"}}>✅</span>}
          <button onClick={e=>{e.stopPropagation();setCfm(p.id)}} style={{background:"none",border:"none",color:"#9aa0a8",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {cfm===p.id&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.95)",borderRadius:9,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,zIndex:5}}>
          <div style={{fontSize:13,color:"#e74c3c"}}>Silmek istediğinize emin misiniz?</div>
          <div style={{display:"flex",gap:4}}><button onClick={()=>{onDel(p.id);setCfm(null)}} style={{padding:"4px 12px",background:"#e74c3c",border:"none",borderRadius:4,color:"#fff",fontSize:13,cursor:"pointer"}}>Sil</button><button onClick={()=>setCfm(null)} style={{padding:"4px 12px",background:"#eef1f5",border:"none",borderRadius:4,color:"#5a6878",fontSize:13,cursor:"pointer"}}>İptal</button></div>
        </div>}
        <div style={{fontSize:15,fontWeight:600,color:"#1a2a3a",marginBottom:3,paddingRight:80}}>{p.name}</div>
        {p.customer&&<div style={{fontSize:12,color:"#2980B9",marginBottom:3}}>👤 {p.customer}</div>}
        <div style={{display:"flex",gap:6,fontSize:12,color:"#7a8390",flexWrap:"wrap"}}>
          <span>{PROJ_TYPES.find(t=>t.id===p.type)?.i} {p.width/100}×{p.height/100}m</span>
          <span>{(p.zones||[]).length} bölge</span>
        </div>
      </div>})}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// NEW PROJECT / TEMPLATE / USERS (compact)
// ═══════════════════════════════════════════════════════════════
function TplPick({user,onCancel,onCreate}){
  const[nm,setNm]=useState("");const[cu,setCu]=useState("");
  const use=t=>{onCreate({id:Date.now().toString(),name:nm.trim()||t.name,customer:cu.trim(),type:t.type,width:t.width,height:t.height,entrance:{side:"bottom",position:50,widthCm:200},zones:t.zones.map(z=>({...z,id:Date.now().toString()+Math.random()})),walls:[],elec:[],plumb:[],status:"konsept",owner:user.email,versions:[],discount:0,createdAt:Date.now(),updatedAt:Date.now()})};
  return<div style={{maxWidth:560,margin:"0 auto",padding:"20px 14px"}}>
    <h2 style={{fontSize:16,fontWeight:300,color:"#1a2a3a",letterSpacing:2,marginBottom:12}}>Şablondan Proje</h2>
    <div style={{display:"flex",gap:6,marginBottom:12}}><input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Proje adı" style={inp}/><input value={cu} onChange={e=>setCu(e.target.value)} placeholder="Müşteri" style={inp}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{TEMPLATES.map(t=><div key={t.id} onClick={()=>use(t)} style={{background:"#ffffff",border:"1px solid #dce0e5",borderRadius:10,padding:14,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:24}}>{PROJ_TYPES.find(p=>p.id===t.type)?.i}</div><div style={{fontSize:15,fontWeight:600,color:"#1a2a3a",marginTop:4}}>{t.name}</div><div style={{fontSize:13,color:"#5a6370",marginTop:2}}>{t.zones.length} bölge</div></div>)}</div>
    <button onClick={onCancel} style={{marginTop:12,padding:"7px 18px",background:"none",border:"1px solid #dce0e5",borderRadius:6,color:"#5a6370",fontSize:14,cursor:"pointer"}}>İptal</button>
  </div>;
}

function NewProj({user,isA,users,onCancel,onCreate}){
  const[n,setN]=useState("");const[c,setC]=useState("");const[t,setT]=useState("market");const[w,setW]=useState(1800);const[h,setH]=useState(1100);const[es,setEs]=useState("bottom");const[ow,setOw]=useState(user.email);
  const go=()=>{if(!n.trim())return;onCreate({id:Date.now().toString(),name:n.trim(),customer:c.trim(),type:t,width:w,height:h,entrance:{side:es,position:50,widthCm:200},zones:[],walls:[],elec:[],plumb:[],status:"konsept",owner:ow,versions:[],discount:0,createdAt:Date.now(),updatedAt:Date.now()})};
  return<div style={{maxWidth:480,margin:"0 auto",padding:"18px 14px"}}>
    <h2 style={{fontSize:16,fontWeight:300,color:"#1a2a3a",letterSpacing:2,marginBottom:12}}>Yeni Proje</h2>
    <Fld l="AD"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Proje adı" style={inp}/></Fld>
    <Fld l="MÜŞTERİ"><input value={c} onChange={e=>setC(e.target.value)} placeholder="Müşteri adı" style={inp}/></Fld>
    {isA&&<Fld l="SAHİP"><select value={ow} onChange={e=>setOw(e.target.value)} style={{...inp,appearance:"auto"}}>{ADMINS.map(a=><option key={a} value={a}>{a.split("@")[0]}</option>)}{users.map(u=><option key={u.email} value={u.email}>{u.name}</option>)}</select></Fld>}
    <Fld l="TİP"><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>{PROJ_TYPES.map(tp=><button key={tp.id} onClick={()=>setT(tp.id)} style={{padding:"7px 3px",background:t===tp.id?"#2980B915":"#f4f6f9",border:t===tp.id?"1px solid #2980B944":"1px solid #dce0e5",borderRadius:6,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:15}}>{tp.i}</div><div style={{fontSize:11,color:t===tp.id?"#2980B9":"#444",marginTop:2}}>{tp.l}</div></button>)}</div></Fld>
    <Fld l="ÖLÇÜ"><div style={{display:"flex",gap:6}}><input type="number" value={w} onChange={e=>setW(+e.target.value)} style={{...inp,flex:1}}/><input type="number" value={h} onChange={e=>setH(+e.target.value)} style={{...inp,flex:1}}/><div style={{padding:"7px 10px",background:"#eef0f3",borderRadius:5,fontSize:15,color:"#2980B9",fontWeight:600,alignSelf:"center"}}>{((w*h)/10000).toFixed(0)}m²</div></div></Fld>
    <Fld l="GİRİŞ"><div style={{display:"flex",gap:4}}>{[{id:"bottom",l:"Alt"},{id:"top",l:"Üst"},{id:"left",l:"Sol"},{id:"right",l:"Sağ"}].map(s=><button key={s.id} onClick={()=>setEs(s.id)} style={{flex:1,padding:"6px",background:es===s.id?"#2980B915":"#f4f6f9",border:es===s.id?"1px solid #2980B944":"1px solid #dce0e5",borderRadius:4,cursor:"pointer",fontSize:13,color:es===s.id?"#2980B9":"#444"}}>{s.l}</button>)}</div></Fld>
    <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:4}}>
      <button onClick={onCancel} style={{padding:"8px 18px",background:"none",border:"1px solid #dce0e5",borderRadius:6,color:"#5a6370",fontSize:14,cursor:"pointer"}}>İptal</button>
      <button onClick={go} disabled={!n.trim()} style={{padding:"8px 24px",background:n.trim()?"linear-gradient(135deg,#2980B9,#1a3a5f)":"#dce0e5",border:"none",borderRadius:6,color:n.trim()?"#ffffff":"#333",fontSize:15,fontWeight:700,cursor:n.trim()?"pointer":"default"}}>OLUŞTUR</button>
    </div>
  </div>;
}

function Fld({l,children}){return<div style={{marginBottom:10}}><label style={{fontSize:13,color:"#5a6878",letterSpacing:1,display:"block",marginBottom:3}}>{l}</label>{children}</div>}
const inp={width:"100%",padding:"8px 10px",background:"#ffffff",border:"1px solid #dce0e5",borderRadius:6,color:"#1a2a3a",fontSize:16,outline:"none",boxSizing:"border-box"};

function UserMgmt({users,projects,onSave}){
  const[em,setEm]=useState("");const[nm,setNm]=useState("");
  const inv=async()=>{const e=em.trim().toLowerCase();if(!e||!e.includes("@")||ADMINS.includes(e)||users.find(u=>u.email===e))return;await onSave([...users,{email:e,name:nm.trim()||e.split("@")[0],role:"user",at:Date.now()}]);setEm("");setNm("")};
  return<div style={{maxWidth:600,margin:"0 auto",padding:"18px 14px"}}>
    <h2 style={{fontSize:16,fontWeight:300,color:"#1a2a3a",letterSpacing:2,marginBottom:14}}>Kullanıcı Yönetimi</h2>
    <div style={{background:"#ffffff",borderRadius:9,padding:12,border:"1px solid #dce0e5",marginBottom:10}}>
      <div style={{fontSize:13,color:"#2980B9",letterSpacing:2,marginBottom:6}}>YÖNETİCİLER</div>
      {ADMINS.map(a=><div key={a} style={{padding:"4px 0",fontSize:14,color:"#1a2a3a",borderBottom:"1px solid #eef0f3"}}>🔑 {a}</div>)}
    </div>
    <div style={{background:"#ffffff",borderRadius:9,padding:12,border:"1px solid #dce0e5",marginBottom:10}}>
      <div style={{fontSize:13,color:"#27ae60",letterSpacing:2,marginBottom:6}}>DAVET ET</div>
      <div style={{display:"flex",gap:4}}><input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Ad" style={{...inp,flex:1}}/><input value={em} onChange={e=>setEm(e.target.value)} placeholder="E-posta" onKeyDown={e=>e.key==="Enter"&&inv()} style={{...inp,flex:2}}/><button onClick={inv} style={{padding:"7px 14px",background:"#27ae60",border:"none",borderRadius:5,color:"#fff",fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>+Davet</button></div>
    </div>
    <div style={{background:"#ffffff",borderRadius:9,padding:12,border:"1px solid #dce0e5"}}>
      <div style={{fontSize:13,color:"#5DADE2",letterSpacing:2,marginBottom:6}}>KULLANICILAR ({users.length})</div>
      {users.map(u=><div key={u.email} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #eef0f3"}}>
        <div><div style={{fontSize:14,color:"#1a2a3a"}}>{u.name}</div><div style={{fontSize:12,color:"#7a8390"}}>{u.email}</div></div>
        <button onClick={()=>onSave(users.filter(x=>x.email!==u.email))} style={{background:"none",border:"none",color:"#e74c3c44",cursor:"pointer",fontSize:14}}>✕</button>
      </div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// EDITOR (full featured)
// ═══════════════════════════════════════════════════════════════
function Editor({project,user,onSave}){
  const[zones,setZones]=useState(project.zones||[]);const[walls,setWalls]=useState(project.walls||[]);const[elec,setElec]=useState(project.elec||[]);const[plumb,setPlumb]=useState(project.plumb||[]);
  const[selId,setSelId]=useState(null);const[tab,setTab]=useState("zones");const[eqCat,setEqCat]=useState("sogutma");
  const[drag,setDrag]=useState(null);const[drawMode,setDrawMode]=useState(null);const[drawType,setDrawType]=useState("solid");const[drawStart,setDrawStart]=useState(null);const[measures,setMeasures]=useState([]);
  const[layers,setLayers]=useState({zones:true,walls:true,equip:true,elec:true,plumb:true,measure:true});
  const[panel,setPanel]=useState(null);
  const svgRef=useRef(null);
  const W=project.width,H=project.height,PAD=45;
  const svgW=cm(W)+PAD*2,svgH=cm(H)+PAD*2;
  const sel=zones.find(z=>z.id===selId);

  const save=(nz,nw,ne,np)=>{const z2=nz||zones,w2=nw||walls,e2=ne||elec,p2=np||plumb;setZones(z2);setWalls(w2);setElec(e2);setPlumb(p2);onSave({...project,zones:z2,walls:w2,elec:e2,plumb:p2,updatedAt:Date.now()})};
  const addZone=t=>{const pr=ZONE_PRESETS.find(p=>p.id===t.id);const nz={id:Date.now().toString(),tid:t.id,label:t.label,color:t.color,icon:t.icon,x:Math.round((W-t.dW)/2),y:Math.round((H-t.dH)/2),w:t.dW,h:t.dH,equip:[],notes:"",material:pr?.material||"",mood:pr?.mood||""};save([...zones,nz]);setSelId(nz.id);setTab("zones")};
  const delZone=id=>{save(zones.filter(z=>z.id!==id));if(selId===id)setSelId(null)};
  const updZone=(id,u)=>{save(zones.map(z=>z.id===id?{...z,...u}:z))};

  const getSvgPt=e=>{const svg=svgRef.current;if(!svg)return null;const r=svg.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX;const cy=e.touches?e.touches[0].clientY:e.clientY;const vb=svg.viewBox.baseVal;return{x:((cx-r.left)/r.width)*vb.width,y:((cy-r.top)/r.height)*vb.height}};
  const snap=(v,g=25)=>Math.round(v/g)*g;
  const onPD=(e,zid,mode="move")=>{if(drawMode)return;e.stopPropagation();const pt=getSvgPt(e);if(!pt)return;const z=zones.find(z=>z.id===zid);if(!z)return;setSelId(zid);setDrag({zid,mode,sx:pt.x,sy:pt.y,ox:z.x,oy:z.y,ow:z.w,oh:z.h})};
  const onMv=useCallback(e=>{if(!drag)return;const pt=getSvgPt(e);if(!pt)return;const dx=(pt.x-drag.sx)/SC,dy=(pt.y-drag.sy)/SC;if(drag.mode==="move"){const z=zones.find(z=>z.id===drag.zid);updZone(drag.zid,{x:snap(Math.max(0,Math.min(W-(z?.w||0),drag.ox+dx))),y:snap(Math.max(0,Math.min(H-(z?.h||0),drag.oy+dy)))})}else{updZone(drag.zid,{w:snap(Math.max(50,drag.ow+dx)),h:snap(Math.max(50,drag.oh+dy))})}},[drag,zones]);
  const onUp=useCallback(()=>{if(drag){setDrag(null);onSave({...project,zones,walls,elec,plumb,updatedAt:Date.now()})}},[drag,zones,walls]);
  useEffect(()=>{window.addEventListener("mousemove",onMv);window.addEventListener("mouseup",onUp);window.addEventListener("touchmove",onMv,{passive:false});window.addEventListener("touchend",onUp);return()=>{window.removeEventListener("mousemove",onMv);window.removeEventListener("mouseup",onUp);window.removeEventListener("touchmove",onMv);window.removeEventListener("touchend",onUp)}},[onMv,onUp]);

  const canvasClick=e=>{if(!drawMode){setSelId(null);return}const pt=getSvgPt(e);if(!pt)return;const cx=snap((pt.x-PAD)/SC),cy=snap((pt.y-PAD)/SC);
    if(drawMode==="wall"){if(!drawStart)setDrawStart({x:cx,y:cy});else{save(zones,[...walls,{id:Date.now().toString(),type:drawType,x1:drawStart.x,y1:drawStart.y,x2:cx,y2:cy}]);setDrawStart(null)}}
    else if(drawMode==="elec"){save(zones,walls,[...elec,{id:Date.now().toString(),type:drawType,x:cx,y:cy}])}
    else if(drawMode==="plumb"){save(zones,walls,elec,[...plumb,{id:Date.now().toString(),type:drawType,x:cx,y:cy}])}
    else if(drawMode==="measure"){if(!drawStart)setDrawStart({x:cx,y:cy});else{setMeasures(m=>[...m,{x1:drawStart.x,y1:drawStart.y,x2:cx,y2:cy}]);setDrawStart(null)}}};

  const allEq=zones.flatMap(z=>(z.equip||[]));const totalCost=allEq.reduce((s,e)=>s+(e.price||0),0);const totalPower=allEq.reduce((s,e)=>s+(e.power||0),0);
  const totalArea=(W*H)/10000;const zoneArea=zones.reduce((s,z)=>s+(z.w*z.h)/10000,0);
  const disc=project.discount||0;const netCost=totalCost*(1-disc/100);const kdvAmt=netCost*KDV;const monthlyE=(totalPower/1000)*12*30*ELEC_KWH;

  const setStatus=st=>onSave({...project,status:st,updatedAt:Date.now()});
  const saveVer=()=>onSave({...project,versions:[...(project.versions||[]),{id:Date.now(),date:Date.now(),zones:JSON.parse(JSON.stringify(zones)),walls:JSON.parse(JSON.stringify(walls))}],updatedAt:Date.now()});

  return<div style={{display:"flex",height:"calc(100vh - 49px)",overflow:"hidden"}}>
    <div style={{width:340,minWidth:280,background:"#f5f7fa",borderRight:"1px solid #dce0e5",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",borderBottom:"1px solid #e8eaee",flexShrink:0,flexWrap:"wrap"}}>
        {[{id:"zones",l:"Bölge"},{id:"add",l:"+Ekle"},{id:"draw",l:"Çizim"},{id:"equip",l:"Ekipman"},{id:"layers",l:"Katman"}].map(t2=>
          <button key={t2.id} onClick={()=>setTab(t2.id)} style={{flex:1,padding:"10px 4px",background:"none",border:"none",borderBottom:tab===t2.id?"2px solid #2980B9":"2px solid transparent",color:tab===t2.id?"#2980B9":"#555",fontSize:12,cursor:"pointer",minWidth:36}}>{t2.l}</button>)}
      </div>
      <div style={{flex:1,padding:6,overflowY:"auto",fontSize:14}}>
        {tab==="zones"&&<>{zones.map(z=><div key={z.id} onClick={()=>setSelId(selId===z.id?null:z.id)} style={{padding:"4px 6px",borderRadius:5,marginBottom:2,background:selId===z.id?z.color+"15":"transparent",border:selId===z.id?`1px solid ${z.color}33`:"1px solid transparent",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:"#1a2a3a"}}><span style={{color:z.color}}>■</span>{z.icon}{z.label}</span><button onClick={e=>{e.stopPropagation();delZone(z.id)}} style={{background:"none",border:"none",color:"#9aa0a8",cursor:"pointer",fontSize:12}}>✕</button></div>
          <div style={{fontSize:11,color:"#7a8390"}}>{z.w}×{z.h} • {(z.equip||[]).length}eq</div>
        </div>)}
        {sel&&<div style={{borderTop:"1px solid #dce0e5",paddingTop:5,marginTop:4}}>
          <div style={{fontSize:13,color:sel.color,fontWeight:600,marginBottom:3}}>{sel.icon}{sel.label}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:2,marginBottom:4}}>{ZONE_COLORS.map(c=><div key={c} onClick={()=>updZone(sel.id,{color:c})} style={{width:13,height:13,borderRadius:2,background:c,cursor:"pointer",border:sel.color===c?"2px solid #fff":"2px solid transparent",boxSizing:"border-box"}}/>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:3}}>
            {[{l:"X",k:"x"},{l:"Y",k:"y"},{l:"W",k:"w"},{l:"H",k:"h"}].map(f=><div key={f.k}><div style={{fontSize:10,color:"#9aa0a8"}}>{f.l}</div><input type="number" value={sel[f.k]} onChange={e=>updZone(sel.id,{[f.k]:+e.target.value})} style={{width:"100%",padding:"2px 3px",background:"#ffffff",border:"1px solid #dce0e5",borderRadius:2,color:"#1a2a3a",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>)}
          </div>
          <div style={{fontSize:11,color:"#7a8390",marginBottom:1}}>Konsept notu</div>
          <textarea value={sel.mood||""} onChange={e=>updZone(sel.id,{mood:e.target.value})} placeholder="Konsept açıklama..." style={{width:"100%",padding:"3px",background:"#ffffff",border:"1px solid #dce0e5",borderRadius:2,color:"#1a2a3a",fontSize:12,outline:"none",minHeight:24,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
          <div style={{fontSize:11,color:"#7a8390",marginTop:3,marginBottom:1}}>Malzeme</div>
          <textarea value={sel.material||""} onChange={e=>updZone(sel.id,{material:e.target.value})} placeholder="Malzeme detayları..." style={{width:"100%",padding:"3px",background:"#ffffff",border:"1px solid #dce0e5",borderRadius:2,color:"#1a2a3a",fontSize:12,outline:"none",minHeight:24,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
          <div style={{fontSize:11,color:"#2980B9",marginTop:3}}>Ekipman: {(sel.equip||[]).length}</div>
          {(sel.equip||[]).map(eq=><div key={eq.uid} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12,borderBottom:"1px solid #eef0f3"}}>
            <span style={{color:"#5a6878"}}>{eq.brand} {eq.name}</span>
            <button onClick={()=>updZone(sel.id,{equip:(sel.equip||[]).filter(e=>e.uid!==eq.uid)})} style={{background:"none",border:"none",color:"#9aa0a8",cursor:"pointer",fontSize:11}}>✕</button>
          </div>)}
        </div>}
        </>}
        {tab==="add"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>{ZONE_PRESETS.map(t2=><button key={t2.id+Math.random()} onClick={()=>addZone(t2)} style={{padding:"6px 2px",background:"#ffffff",border:"1px solid #dce0e5",borderRadius:5,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:18}}>{t2.icon}</div><div style={{fontSize:11,color:"#5a6878",marginTop:1}}>{t2.label}</div></button>)}</div>}
        {tab==="draw"&&<div>
          {[{id:"wall",l:"🧱 Duvar",c:"#4a5568"},{id:"elec",l:"⚡ Elektrik",c:"#F1C40F"},{id:"plumb",l:"💧 Tesisat",c:"#3498DB"},{id:"measure",l:"📏 Ölçü",c:"#E67E22"}].map(d=>
            <button key={d.id} onClick={()=>{setDrawMode(drawMode===d.id?null:d.id);setDrawStart(null)}} style={{display:"block",width:"100%",padding:"5px 7px",marginBottom:2,background:drawMode===d.id?d.c+"22":"#f4f6f9",border:drawMode===d.id?`1px solid ${d.c}55`:"1px solid #dce0e5",borderRadius:4,color:drawMode===d.id?d.c:"#666",fontSize:13,cursor:"pointer",textAlign:"left"}}>{d.l}{drawMode===d.id?" ✓":""}</button>)}
          {drawMode==="wall"&&<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:4}}>{WALL_TYPES.map(wt=><MBtn key={wt.id} t={wt.label} a={drawType===wt.id} onClick={()=>setDrawType(wt.id)}/>)}</div>}
          {drawMode==="elec"&&<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:4}}>{ELEC_TYPES.map(et=><MBtn key={et.id} t={et.icon+et.label} a={drawType===et.id} onClick={()=>setDrawType(et.id)}/>)}</div>}
          {drawMode==="plumb"&&<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:4}}>{PLUMB_TYPES.map(pt=><MBtn key={pt.id} t={pt.icon+pt.label} a={drawType===pt.id} onClick={()=>setDrawType(pt.id)}/>)}</div>}
          {drawStart&&<div style={{marginTop:4,fontSize:12,color:"#2980B9",padding:3,background:"#2980B911",borderRadius:3}}>Nokta 1: ({drawStart.x},{drawStart.y})</div>}
        </div>}
        {tab==="equip"&&<div>
          {!sel&&<div style={{padding:5,background:"#2980B911",borderRadius:4,fontSize:12,color:"#2980B9",marginBottom:4}}>Önce bölge seçin</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:2,marginBottom:4}}>{Object.entries(EQUIPMENT).filter(([k,v])=>v.items).map(([k,v])=><MBtn key={k} t={v.icon+v.label} a={eqCat===k} onClick={()=>setEqCat(k)}/>)}</div>
          {EQUIPMENT[eqCat]?.items.map(eq=>{const sym=eq.curr==="EUR"?"€":"₺";return<div key={eq.id} style={{padding:"4px 5px",marginBottom:2,background:"#ffffff",borderRadius:4,border:"1px solid #dce0e5"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1a2a3a"}}>{eq.name}</div>
            <div style={{fontSize:11,color:"#5a6370"}}><span style={{color:eq.color}}>{eq.brand}</span> • {eq.model}</div>
            {eq.sicaklik&&<div style={{fontSize:10,color:"#3498DB",marginTop:1}}>🌡️ {eq.sicaklik}</div>}
            <div style={{fontSize:11,color:"#7a8390",display:"flex",justifyContent:"space-between",marginTop:1}}>
              <span>{eq.power>0?eq.power+"W":"—"} • <span style={{color:eq.curr==="EUR"?"#27AE60":"#2980B9",fontWeight:600}}>{sym}{fmt(eq.price)}</span></span>
              {sel&&<button onClick={()=>updZone(sel.id,{equip:[...(sel.equip||[]),{...eq,uid:Date.now().toString()}]})} style={{padding:"1px 6px",background:"#2980B922",border:"1px solid #2980B944",borderRadius:2,color:"#2980B9",fontSize:11,cursor:"pointer"}}>+Ekle</button>}
            </div>
          </div>})}

        </div>}
        {tab==="layers"&&<div>
          {[{k:"zones",l:"Bölgeler",c:"#2980B9"},{k:"walls",l:"Duvarlar",c:"#4a5568"},{k:"equip",l:"Ekipmanlar",c:"#27ae60"},{k:"elec",l:"Elektrik",c:"#F1C40F"},{k:"plumb",l:"Tesisat",c:"#3498DB"},{k:"measure",l:"Ölçüler",c:"#E67E22"}].map(ly=>
            <label key={ly.k} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 3px",cursor:"pointer",fontSize:14,color:layers[ly.k]?ly.c:"#333"}}>
              <input type="checkbox" checked={layers[ly.k]} onChange={()=>setLayers(l=>({...l,[ly.k]:!l[ly.k]}))} style={{accentColor:ly.c}}/>{ly.l}
            </label>)}
        </div>}
      </div>
      <div style={{padding:5,borderTop:"1px solid #dce0e5",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#7a8390",marginBottom:3}}>
          <span>{zoneArea.toFixed(1)}/{totalArea.toFixed(0)}m²</span><span style={{color:"#2980B9"}}>₺{fmt(totalCost)}</span><span style={{color:"#F1C40F"}}>{(totalPower/1000).toFixed(1)}kW</span>
        </div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {[{id:"report",t:"📋Rapor"},{id:"pricing",t:"💰Teklif"},{id:"energy",t:"⚡Enerji"},{id:"status",t:"📊Durum"}].map(b=><button key={b.id} onClick={()=>setPanel(panel===b.id?null:b.id)} style={{padding:"3px 6px",background:"#eef1f5",border:"1px solid #ccd2d9",borderRadius:3,color:"#5a6878",fontSize:11,cursor:"pointer"}}>{b.t}</button>)}
          <button onClick={saveVer} style={{padding:"3px 6px",background:"#eef1f5",border:"1px solid #ccd2d9",borderRadius:3,color:"#5a6878",fontSize:11,cursor:"pointer"}}>💾Rev</button>
        </div>
      </div>
    </div>

    <div style={{flex:1,overflow:"auto",background:"#eef1f5",position:"relative"}}>
      {panel&&<OverlayPanel type={panel} project={project} zones={zones} walls={walls} totalCost={totalCost} netCost={netCost} kdvAmt={kdvAmt} totalPower={totalPower} monthlyE={monthlyE} onClose={()=>setPanel(null)} onStatus={setStatus} onDiscount={d=>onSave({...project,discount:d})}/>}
      <div style={{padding:8,display:"flex",justifyContent:"center"}}>
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} style={{width:"100%",maxWidth:700,display:"block",touchAction:"none",cursor:drawMode?"crosshair":"default"}} onClick={canvasClick}>
          <defs><pattern id="g1" width={cm(100)} height={cm(100)} patternUnits="userSpaceOnUse"><path d={`M ${cm(100)} 0 L 0 0 0 ${cm(100)}`} fill="none" stroke="#d5d9de" strokeWidth="0.3"/></pattern><filter id="gl"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <rect x={PAD} y={PAD} width={cm(W)} height={cm(H)} fill="#edf0f5"/><rect x={PAD} y={PAD} width={cm(W)} height={cm(H)} fill="none" stroke="#5a7090" strokeWidth={3} rx={1}/>
          {(()=>{const e=project.entrance||{side:"bottom",position:50,widthCm:200};const eW=cm(e.widthCm);let ex,ey,ew,eh;if(e.side==="bottom"){ex=PAD+cm(W)*(e.position/100)-eW/2;ey=PAD+cm(H)-2;ew=eW;eh=5}else if(e.side==="top"){ex=PAD+cm(W)*(e.position/100)-eW/2;ey=PAD-2;ew=eW;eh=5}else if(e.side==="left"){ex=PAD-2;ey=PAD+cm(H)*(e.position/100)-eW/2;ew=5;eh=eW}else{ex=PAD+cm(W)-2;ey=PAD+cm(H)*(e.position/100)-eW/2;ew=5;eh=eW}return<><rect x={ex} y={ey} width={ew} height={eh} fill="#edf0f5"/><text x={e.side==="bottom"?ex+ew/2:ex+10} y={e.side==="bottom"?ey+14:ey+eh/2} textAnchor="middle" fill="#2980B9" fontSize={6}>GİRİŞ</text></>})()}
          <text x={PAD+cm(W)/2} y={PAD-10} textAnchor="middle" fill="#5a7090" fontSize={6}>{W}cm</text>
          <text x={PAD-12} y={PAD+cm(H)/2} textAnchor="middle" fill="#5a7090" fontSize={6} transform={`rotate(-90,${PAD-12},${PAD+cm(H)/2})`}>{H}cm</text>
          {layers.walls&&walls.map(w=>{const wt=WALL_TYPES.find(t=>t.id===w.type)||WALL_TYPES[0];return<line key={w.id} x1={PAD+cm(w.x1)} y1={PAD+cm(w.y1)} x2={PAD+cm(w.x2)} y2={PAD+cm(w.y2)} stroke={wt.color} strokeWidth={cm(wt.th)} strokeLinecap="round" strokeDasharray={w.type==="glass"?"4,3":"none"} opacity={0.6}/>})}
          {drawStart&&(drawMode==="wall"||drawMode==="measure")&&<circle cx={PAD+cm(drawStart.x)} cy={PAD+cm(drawStart.y)} r={3} fill="#2980B9"/>}
          {layers.zones&&zones.map(z=>{const isSel=selId===z.id;const rx=PAD+cm(z.x),ry=PAD+cm(z.y),rw=cm(z.w),rh=cm(z.h);return<g key={z.id}>
            <rect x={rx} y={ry} width={rw} height={rh} fill={z.color+(isSel?"45":"25")} stroke={z.color+(isSel?"ee":"99")} strokeWidth={isSel?2:0.7} rx={2} filter={isSel?"url(#gl)":"none"} onMouseDown={e=>onPD(e,z.id)} onTouchStart={e=>onPD(e,z.id)} style={{cursor:drawMode?"crosshair":"grab"}}/>
            {layers.equip&&(z.equip||[]).map((eq,i)=>{const eW=cm(Math.min(eq.w||50,z.w/2)),eH=cm(Math.min(eq.h||30,z.h/2));return<rect key={eq.uid} x={rx+2+(i%3)*Math.min(eW+1,rw/3)} y={ry+rh-eH-2-Math.floor(i/3)*(eH+1)} width={Math.min(eW,rw/3-2)} height={eH} fill={eq.color+"33"} stroke={eq.color+"55"} strokeWidth={0.4} rx={1} style={{pointerEvents:"none"}}/>})}
            <rect x={rx+rw-6} y={ry+rh-6} width={6} height={6} fill={z.color+"55"} rx={1} onMouseDown={e=>onPD(e,z.id,"resize")} onTouchStart={e=>onPD(e,z.id,"resize")} style={{cursor:"nwse-resize"}}/>
            <text x={rx+rw/2} y={ry+rh/2-1} textAnchor="middle" fill={z.color} fontSize={Math.min(11,rw/6)} fontWeight="bold" style={{pointerEvents:"none"}}>{z.icon}{z.label}</text>
            <text x={rx+rw/2} y={ry+rh/2+6} textAnchor="middle" fill={z.color+"77"} fontSize={Math.min(9,rw/8)} style={{pointerEvents:"none"}}>{z.w}×{z.h}</text>
          </g>})}
          {layers.elec&&elec.map(p=>{const et=ELEC_TYPES.find(t=>t.id===p.type)||ELEC_TYPES[0];return<g key={p.id}><circle cx={PAD+cm(p.x)} cy={PAD+cm(p.y)} r={5} fill={et.color+"44"} stroke={et.color} strokeWidth={1}/><text x={PAD+cm(p.x)} y={PAD+cm(p.y)+3} textAnchor="middle" fontSize={6} style={{pointerEvents:"none"}}>{et.icon}</text></g>})}
          {layers.plumb&&plumb.map(p=>{const pt=PLUMB_TYPES.find(t=>t.id===p.type)||PLUMB_TYPES[0];return<g key={p.id}><rect x={PAD+cm(p.x)-5} y={PAD+cm(p.y)-5} width={10} height={10} fill={pt.color+"44"} stroke={pt.color} strokeWidth={1} rx={2}/><text x={PAD+cm(p.x)} y={PAD+cm(p.y)+3} textAnchor="middle" fontSize={6} style={{pointerEvents:"none"}}>{pt.icon}</text></g>})}
          {layers.measure&&measures.map((m,i)=>{const len=Math.round(Math.sqrt((m.x2-m.x1)**2+(m.y2-m.y1)**2));return<g key={i}><line x1={PAD+cm(m.x1)} y1={PAD+cm(m.y1)} x2={PAD+cm(m.x2)} y2={PAD+cm(m.y2)} stroke="#E67E22" strokeWidth={1} strokeDasharray="3,2"/><circle cx={PAD+cm(m.x1)} cy={PAD+cm(m.y1)} r={2} fill="#E67E22"/><circle cx={PAD+cm(m.x2)} cy={PAD+cm(m.y2)} r={2} fill="#E67E22"/><text x={PAD+cm((m.x1+m.x2)/2)} y={PAD+cm((m.y1+m.y2)/2)-4} textAnchor="middle" fill="#E67E22" fontSize={6} fontWeight="bold">{len}cm</text></g>})}
        </svg>
      </div>
    </div>
  </div>;
}

// ─── OVERLAY PANELS ─────────────────────────────────────────────
function OverlayPanel({type,project,zones,walls,totalCost,netCost,kdvAmt,totalPower,monthlyE,onClose,onStatus,onDiscount}){
  const w={position:"absolute",inset:0,background:"rgba(240,242,245,0.96)",zIndex:10,overflowY:"auto",padding:14};
  const i={maxWidth:560,margin:"0 auto"};const bx={background:"#ffffff",borderRadius:8,padding:12,border:"1px solid #dce0e5",marginBottom:8};
  const hd=t=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h2 style={{margin:0,fontSize:18,fontWeight:300,color:"#2980B9",letterSpacing:3}}>{t}</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#5a6370",cursor:"pointer",fontSize:16}}>✕</button></div>;
  const allEq=zones.flatMap(z=>(z.equip||[]).map(e=>({...e,zone:z.label})));const totalArea=(project.width*project.height)/10000;

  if(type==="report")return<div style={w}><div style={i}>{hd("PROJE RAPORU")}
    <div style={bx}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:"#7a8390",letterSpacing:2}}>NOKTA DİZAYN</div><div style={{fontSize:16,fontWeight:600,color:"#1a2a3a",marginTop:2}}>{project.name}</div>{project.customer&&<div style={{fontSize:13,color:"#2980B9"}}>Müşteri: {project.customer}</div>}</div><Logo sz={36}/></div></div>
    {totalCost>0&&<div style={{...bx,textAlign:"center",background:"#2980B911",border:"1px solid #2980B922"}}><div style={{fontSize:12,color:"#2980B9",letterSpacing:2}}>TOPLAM (KDV DAHİL)</div><div style={{fontSize:20,fontWeight:700,color:"#2980B9",marginTop:3}}>₺{fmt(Math.round(netCost+kdvAmt))}</div></div>}
    <div style={bx}>{zones.map(z=><div key={z.id} style={{padding:"5px 0",borderBottom:"1px solid #eef0f3"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:600,color:"#1a2a3a"}}><span style={{color:z.color}}>■</span>{z.icon}{z.label}</span><span style={{fontSize:12,color:"#5a6370"}}>{((z.w*z.h)/10000).toFixed(1)}m²</span></div>{(z.equip||[]).map(eq=>{const sym=eq.curr==="EUR"?"€":"₺";return<div key={eq.uid} style={{fontSize:12,color:"#5a6878",paddingLeft:10}}>• {eq.brand} {eq.name} — {sym}{fmt(eq.price)}</div>})}</div>)}</div>
  </div></div>;

  if(type==="pricing")return<div style={w}><div style={i}>{hd("FİYAT TEKLİFİ")}
    <div style={bx}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:"1px solid #ccd2d9"}}><th style={{textAlign:"left",padding:3,color:"#5a6878"}}>Ürün</th><th style={{textAlign:"left",padding:3,color:"#5a6878"}}>Marka</th><th style={{textAlign:"right",padding:3,color:"#5a6878"}}>Fiyat</th></tr></thead>
      <tbody>{allEq.map((eq,i)=>{const sym=eq.curr==="EUR"?"€":"₺";return<tr key={eq.uid||i} style={{borderBottom:"1px solid #eef0f3"}}><td style={{padding:3,color:"#1a2a3a"}}>{eq.name}</td><td style={{padding:3,color:eq.color}}>{eq.brand}</td><td style={{padding:3,textAlign:"right",color:eq.curr==="EUR"?"#27AE60":"#2980B9",fontWeight:600}}>{sym}{fmt(eq.price)}</td></tr>})}</tbody></table></div>
    <div style={bx}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:14,color:"#5a6878"}}>İskonto (%)</span><input type="number" value={project.discount||0} onChange={e=>onDiscount(+e.target.value)} style={{width:60,padding:"2px 5px",background:"#f8f9fb",border:"1px solid #d0d5db",borderRadius:3,color:"#1a2a3a",fontSize:15,textAlign:"right",outline:"none"}}/></div>
      {[{l:"Ara Toplam",v:totalCost},{l:`İskonto (%${project.discount||0})`,v:-(totalCost*(project.discount||0)/100)},{l:"Net",v:netCost},{l:`KDV (%${KDV*100})`,v:kdvAmt},{l:"GENEL TOPLAM",v:netCost+kdvAmt,b:true}].map((r,i)=>
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderTop:r.b?"1px solid #2980B944":"none",fontSize:r.b?12:10,fontWeight:r.b?700:400,color:r.b?"#2980B9":"#888"}}><span>{r.l}</span><span>₺{fmt(Math.round(r.v))}</span></div>)}
    </div>
  </div></div>;

  if(type==="energy")return<div style={w}><div style={i}>{hd("ENERJİ")}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
      <div style={{...bx,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#F1C40F"}}>{(totalPower/1000).toFixed(1)}kW</div><div style={{fontSize:12,color:"#5a6370"}}>Toplam Güç</div></div>
      <div style={{...bx,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#E67E22"}}>₺{fmt(Math.round(monthlyE))}</div><div style={{fontSize:12,color:"#5a6370"}}>Aylık Tahmini</div></div>
    </div>
    <div style={bx}>{allEq.filter(e=>e.power>0).map((eq,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:13,borderBottom:"1px solid #eef0f3"}}><span style={{color:"#1a2a3a"}}>{eq.brand} {eq.name}</span><span style={{color:"#F1C40F"}}>{eq.power}W</span></div>)}</div>
  </div></div>;

  if(type==="status")return<div style={w}><div style={i}>{hd("PROJE DURUMU")}
    <div style={{display:"flex",gap:3,marginBottom:14,flexWrap:"wrap"}}>
      {STATUS_FLOW.map((s,idx)=>{const cur=STATUS_FLOW.findIndex(x=>x.id===project.status);const isActive=project.status===s.id;const isPast=cur>=idx;return<div key={s.id} style={{textAlign:"center",flex:1,minWidth:50}}>
        <div onClick={()=>onStatus(s.id)} style={{width:30,height:30,borderRadius:15,margin:"0 auto",background:isPast?s.color+"33":"#dce0e5",border:`2px solid ${isPast?s.color:"#ccd2d9"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer"}}>{s.icon}</div>
        <div style={{fontSize:11,color:isActive?s.color:"#7a8390",marginTop:3,fontWeight:isActive?700:400}}>{s.label}</div>
      </div>})}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:10}}>{[{l:"Sunum",c:"#9B59B6"},{l:"Detay",c:"#2980B9"},{l:"Uygulama",c:"#27AE60"}].map(p=><div key={p.l} style={{flex:1,padding:6,background:p.c+"11",borderRadius:6,textAlign:"center"}}><div style={{fontSize:12,color:p.c,fontWeight:600}}>{p.l}</div><div style={{fontSize:11,color:"#7a8390",marginTop:2}}>{STATUS_FLOW.filter(s=>s.phase===p.l.toLowerCase()).map(s=>s.label).join(" → ")}</div></div>)}</div>
    {project.approvedAt&&<div style={{...bx,textAlign:"center"}}><div style={{fontSize:16,color:"#27AE60"}}>✅ Konsept Onaylandı</div><div style={{fontSize:13,color:"#5a6878",marginTop:2}}>{new Date(project.approvedAt).toLocaleString("tr-TR")}{project.approvedBy&&` — ${project.approvedBy}`}</div></div>}
    {(project.versions||[]).length>0&&<div style={bx}><div style={{fontSize:12,color:"#2980B9",letterSpacing:2,marginBottom:4}}>VERSİYONLAR</div>{(project.versions||[]).map((v,i)=><div key={v.id} style={{fontSize:13,color:"#5a6878",padding:"2px 0",borderBottom:"1px solid #eef0f3"}}>Rev.{i+1} — {new Date(v.date).toLocaleString("tr-TR")}</div>)}</div>}
  </div></div>;

  return null;
}

// ─── 3D & FIELD VIEWS ───────────────────────────────────────────
function View3D({project}){return<div style={{minHeight:"calc(100vh - 49px)",overflow:"auto",background:"#f4f6f9",padding:16,display:"flex",justifyContent:"center",alignItems:"flex-start"}}><div style={{width:"100%",maxWidth:700,textAlign:"center"}}><div style={{fontSize:16,color:"#2980B9",letterSpacing:2,marginBottom:10}}>3D KUŞ BAKIŞI — {project.name}</div><div style={{background:"#ffffff",borderRadius:10,border:"1px solid #dce0e5",padding:12}}><Iso3D project={project}/></div></div></div>}

function FieldView({project}){
  const zones=project.zones||[];
  return<div style={{flex:1,overflow:"auto",background:"#eef1f5",padding:16}}><div style={{maxWidth:600,margin:"0 auto"}}>
    <div style={{fontSize:16,color:"#2980B9",letterSpacing:2,marginBottom:4}}>🔧 SAHA GÖRÜNÜMÜ</div>
    <div style={{fontSize:13,color:"#5a6370",marginBottom:12}}>{project.name}{project.customer&&` — ${project.customer}`}</div>
    {zones.map(z=><div key={z.id} style={{background:"#ffffff",borderRadius:8,padding:12,border:`1px solid ${z.color}33`,marginBottom:8}}>
      <div style={{fontSize:16,fontWeight:600,color:z.color,marginBottom:4}}>{z.icon}{z.label}</div>
      <div style={{fontSize:13,color:"#5a6370",marginBottom:4}}>({z.x},{z.y}) — {z.w}×{z.h}cm — {((z.w*z.h)/10000).toFixed(1)}m²</div>
      {(z.equip||[]).length>0&&<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:"1px solid #ccd2d9"}}><th style={{textAlign:"left",padding:2,color:"#5a6878"}}>Ekipman</th><th style={{textAlign:"left",padding:2,color:"#5a6878"}}>Model</th><th style={{textAlign:"center",padding:2,color:"#5a6878"}}>✓</th></tr></thead>
        <tbody>{(z.equip||[]).map(eq=><tr key={eq.uid} style={{borderBottom:"1px solid #eef0f3"}}><td style={{padding:2,color:"#1a2a3a"}}>{eq.brand} {eq.name}</td><td style={{padding:2,color:"#5a6878"}}>{eq.model}</td><td style={{padding:2,textAlign:"center"}}>☐</td></tr>)}</tbody></table>}
      {z.notes&&<div style={{fontSize:12,color:"#5a6878",marginTop:3,fontStyle:"italic"}}>📝 {z.notes}</div>}
    </div>)}
  </div></div>;
}

