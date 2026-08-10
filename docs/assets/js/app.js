(() => {
"use strict";
const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);

const ICONOS = {
  pin:"bi-pin-angle-fill", target:"bi-bullseye", pencil:"bi-pencil-square",
  book:"bi-book-fill", toolbox:"bi-tools", file:"bi-file-earmark-pdf-fill",
  ruler:"bi-rulers", play:"bi-play-circle-fill", link:"bi-link-45deg",
  message:"bi-chat-dots-fill", info:"bi-info-circle-fill", check:"bi-check-circle-fill",
  steps:"bi-list-ol", practice:"bi-ui-checks-grid", video:"bi-play-btn-fill",
  geogebra:"bi-bounding-box-circles", download:"bi-download", external:"bi-box-arrow-up-right"
};

function iconHtml(name, extraClass=""){
  const iconClass = ICONOS[name] || ICONOS.link;
  return `<i class="bi ${iconClass} ui-icon ${extraClass}" aria-hidden="true"></i>`;
}

async function getJSON(path){
  const res = await fetch(`${path}?v=0.8.0`, {cache:"no-store"});
  if(!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json();
}
function esc(v=""){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));}
function normalizarRutaModulo(v=""){return /^[a-z0-9-]+$/i.test(v)?v:"";}
function normalizarSemana(v=""){return /^\d{2}$/.test(v)?v:"";}

async function typesetMath(root){
  try{
    if(window.MathJax?.startup?.promise && window.MathJax?.typesetPromise){
      await window.MathJax.startup.promise;
      await window.MathJax.typesetPromise([root]);
    }
  }catch(err){console.warn("MathJax:",err);}
}
function paragraphList(items=[]){return Array.isArray(items)?items.map(p=>`<p>${esc(p)}</p>`).join(""):"";}
function formulaList(items=[]){return Array.isArray(items)?items.map(f=>`<div class="formula-block">${esc(f)}</div>`).join(""):"";}

function renderImagen(imagen){
  if(!imagen?.src) return "";
  return `<figure class="content-figure">
    <img src="${esc(imagen.src)}" alt="${esc(imagen.alt||"")}" loading="lazy" decoding="async">
    ${imagen.pie?`<figcaption>${esc(imagen.pie)}</figcaption>`:""}
  </figure>`;
}

function renderTabla(tabla){
  if(!tabla?.encabezados?.length || !tabla?.filas?.length) return "";
  const headers=tabla.encabezados, labels=headers.slice(1);
  const head=headers.map(h=>`<th scope="col">${esc(h)}</th>`).join("");
  const rows=tabla.filas.map(f=>`<tr>${f.map((c,j)=>j===0?`<th scope="row">${esc(c)}</th>`:`<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const cards=tabla.filas.map(f=>`<section class="data-card"><h4>${esc(f[0])}</h4><div class="data-card-grid">${
    f.slice(1).map((v,i)=>`<div class="data-cell"><span class="data-cell-label">${esc(labels[i]||String(i+1))}</span><strong>${esc(v)}</strong></div>`).join("")
  }</div></section>`).join("");
  return `<div class="data-block">
    <div class="table-desktop"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="table-mobile">${cards}</div>
  </div>`;
}

function renderActividad(a){
  if(!a) return "";
  const qs=(a.preguntas||[]).map(q=>`<li>${esc(q)}</li>`).join("");
  return `<div class="problem-activity"><h3>${iconHtml("pencil","heading-icon")}${esc(a.titulo||"Trabajo estudiantil independiente")}</h3>
    ${paragraphList(a.introduccion)}${qs?`<ol class="question-list alpha-list">${qs}</ol>`:""}
  </div>`;
}

function renderSituacion(b,index){
  const hasImage=Boolean(b.imagen?.src);
  return `<section class="panel problem-panel">
    <div class="problem-number">SITUACIÓN ${String(index+1).padStart(2,"0")}</div>
    <h2>${iconHtml("target","heading-icon")}${esc(b.titulo||"Situación problema")}</h2>
    <div class="${hasImage?"problem-grid":""}"><div class="problem-copy">${paragraphList(b.texto)}</div>${renderImagen(b.imagen)}</div>
    ${renderTabla(b.tabla)}
    ${b.preguntaClave?`<p class="key-question"><strong>${esc(b.preguntaClave)}</strong></p>`:""}
    ${renderActividad(b.actividad)}
  </section>`;
}

function renderEjemplo(b){
  return `<section class="example-panel">
    <div class="example-head"><span class="example-number">${esc(b.titulo||"Ejemplo")}</span>${b.subtitulo?`<span class="example-subtitle">${esc(b.subtitulo)}</span>`:""}</div>
    <div class="example-body">
      ${paragraphList(b.parrafos)}${renderTabla(b.tabla)}
      ${b.pregunta?`<p class="example-question">${esc(b.pregunta)}</p>`:""}
      ${b.solucionTitulo?`<h3 class="example-solution-title">${esc(b.solucionTitulo)}</h3>`:""}
      ${paragraphList(b.solucionParrafos)}${formulaList(b.formulas)}${renderTabla(b.tablaSolucion)}
      ${b.conclusion?`<p class="example-conclusion"><strong>${esc(b.conclusion)}</strong></p>`:""}
    </div>
  </section>`;
}

function renderTeoria(b){
  return `<section class="theory-panel"><div class="theory-head">${iconHtml(b.icono||"book","heading-icon")}<h2>${esc(b.titulo||"Teoría")}</h2></div>
    <div class="theory-body">${paragraphList(b.parrafos)}${formulaList(b.formulas)}${renderTabla(b.tabla)}${renderImagen(b.imagen)}</div>
  </section>`;
}

function renderPasoAPaso(b){
  const pasos=(b.pasos||[]).map((p,i)=>`<li class="step-item"><div class="step-marker">${i+1}</div><div class="step-content">
    ${p.titulo?`<h3>${esc(p.titulo)}</h3>`:""}${p.texto?`<p>${esc(p.texto)}</p>`:""}${p.formula?`<div class="step-formula">${esc(p.formula)}</div>`:""}
  </div></li>`).join("");
  return `<section class="steps-panel"><div class="steps-head">${iconHtml(b.icono||"steps","heading-icon")}<h2>${esc(b.titulo||"Paso a paso")}</h2></div><ol class="steps-list">${pasos}</ol></section>`;
}

function renderNota(b){
  return `<aside class="important-note">${b.titulo?`<h3>${iconHtml(b.icono||"info","heading-icon")}${esc(b.titulo)}</h3>`:""}${paragraphList(b.parrafos)}${formulaList(b.formulas)}</aside>`;
}

function renderTrabajoCotidiano(b){
  const items=(b.items||[]).map(i=>`<li>${esc(i)}</li>`).join("");
  return `<section class="daily-work-panel"><div class="daily-work-head">${iconHtml(b.icono||"pencil","heading-icon")}<h2>${esc(b.titulo||"Trabajo cotidiano")}</h2></div>
    <div class="daily-work-body">${paragraphList(b.instrucciones)}${items?`<ol class="daily-work-list">${items}</ol>`:""}${renderTabla(b.tabla)}${renderImagen(b.imagen)}</div>
  </section>`;
}

function renderVideo(b){
  const id=b.videoId||"";
  const embed=id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`:"";
  return `<section class="media-panel">
    <div class="media-head">${iconHtml("video","heading-icon")}<h2>${esc(b.titulo||"Video")}</h2></div>
    <div class="media-body">
      ${b.descripcion?`<p>${esc(b.descripcion)}</p>`:""}
      ${embed?`<div class="responsive-frame video-frame"><iframe src="${embed}" title="${esc(b.titulo||"Video")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`:""}
      ${b.url?`<a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${iconHtml("external")}Abrir video en una pestaña nueva</a>`:""}
    </div>
  </section>`;
}

function renderGeoGebra(b){
  const mid=b.materialId||"";
  const src=mid?`https://www.geogebra.org/material/iframe/id/${encodeURIComponent(mid)}`:"";
  return `<section class="media-panel geogebra-panel">
    <div class="media-head">${iconHtml("geogebra","heading-icon")}<h2>${esc(b.titulo||"GeoGebra")}</h2></div>
    <div class="media-body">
      ${b.descripcion?`<p>${esc(b.descripcion)}</p>`:""}
      ${src?`<div class="responsive-frame geogebra-frame" style="--embed-height:${Number(b.altura)||600}px"><iframe src="${src}" title="${esc(b.titulo||"GeoGebra")}" loading="lazy" allowfullscreen></iframe></div>`:""}
      ${b.url?`<a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${iconHtml("external")}Abrir en GeoGebra</a>`:""}
    </div>
  </section>`;
}

function renderExeLearning(b){
  if(b.disponible!==true || !b.url){
    return `<section class="practice-panel"><div class="practice-icon">${iconHtml("practice")}</div><div class="practice-copy"><p class="practice-kicker">PRÁCTICA</p><h2>${esc(b.titulo||"Práctica")}</h2><p>${esc(b.descripcion||"")}</p></div><span class="practice-button is-disabled">Próximamente</span></section>`;
  }
  return `<section class="media-panel exelearning-panel">
    <div class="media-head">${iconHtml("practice","heading-icon")}<h2>${esc(b.titulo||"Práctica interactiva")}</h2></div>
    <div class="media-body">
      ${b.descripcion?`<p>${esc(b.descripcion)}</p>`:""}
      ${b.modo==="iframe"?`<div class="responsive-frame exe-frame" style="--embed-height:${Number(b.altura)||720}px"><iframe src="${esc(b.url)}" title="${esc(b.titulo||"Práctica interactiva")}" loading="lazy"></iframe></div>`:""}
      <a class="media-link" href="${esc(b.url)}"${b.abrirEnNuevaPestana!==false?' target="_blank" rel="noopener noreferrer"':""}>${iconHtml("external")}Abrir práctica en pantalla completa</a>
    </div>
  </section>`;
}

function renderPdf(b){
  if(b.disponible!==true || !b.url) return "";
  return `<section class="media-panel pdf-panel">
    <div class="media-head">${iconHtml("file","heading-icon")}<h2>${esc(b.titulo||"PDF")}</h2></div>
    <div class="media-body">
      ${b.descripcion?`<p>${esc(b.descripcion)}</p>`:""}
      ${b.vistaPrevia?`<div class="responsive-frame pdf-frame" style="--embed-height:${Number(b.altura)||650}px"><iframe src="${esc(b.url)}" title="${esc(b.titulo||"PDF")}" loading="lazy"></iframe></div>`:""}
      <div class="media-actions">
        <a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${iconHtml("external")}Abrir PDF</a>
        ${b.descargar?`<a class="media-link" href="${esc(b.url)}" download>${iconHtml("download")}Descargar PDF</a>`:""}
      </div>
    </div>
  </section>`;
}

function renderBloque(b,index){
  if(b?.mostrar===false) return "";
  switch(b.tipo){
    case "teoria": return renderTeoria(b);
    case "video": return renderVideo(b);
    case "situacionProblema": return renderSituacion(b,index);
    case "ejemplo": return renderEjemplo(b);
    case "pasoAPaso": return renderPasoAPaso(b);
    case "nota":
    case "definicion": return renderNota(b);
    case "trabajoCotidiano": return renderTrabajoCotidiano(b);
    case "exelearning": return renderExeLearning(b);
    case "geogebra": return renderGeoGebra(b);
    case "pdf": return renderPdf(b);
    default: return "";
  }
}

function ayudaHTML(a={}){
  if(!a.mostrar) return "";
  return `<section class="help-panel"><div><p class="help-kicker">APOYO</p><h2>${esc(a.titulo||"¿Necesita ayuda?")}</h2><p>${esc(a.texto||"")}</p></div>
    ${a.url?`<a class="button-primary" href="${esc(a.url)}">${iconHtml("message","button-icon")}<span>Enviar mensaje</span></a>`:`<span class="button-primary disabled-button">${iconHtml("message","button-icon")}<span>Enviar mensaje</span></span>`}
  </section>`;
}

async function renderInicio(){
  const grid=$("#module-grid"); if(!grid)return;
  try{
    const data=await getJSON("data/modulos.json");
    grid.innerHTML=data.modulos.filter(m=>m.activo).map(m=>`<a class="card" href="modulo.html?id=${encodeURIComponent(m.id)}"><span class="code">${esc(m.id.toUpperCase())}</span><h3>${esc(m.nombre)}</h3><p>${esc(m.descripcion||"")}</p></a>`).join("");
  }catch(e){grid.innerHTML=`<div class="error">${esc(e.message)}</div>`;}
}
async function renderModulo(){
  const id=normalizarRutaModulo(params.get("id")||""), grid=$("#week-grid"); if(!grid)return;
  try{
    const data=await getJSON("data/modulos.json"), mod=data.modulos.find(m=>m.id===id&&m.activo);
    if(!mod)throw new Error("El módulo solicitado no existe.");
    $("#module-title").textContent=mod.nombre; $("#module-description").textContent=mod.descripcion||"";
    const weeks=(mod.semanas||[]).filter(w=>w.publicada);
    grid.innerHTML=weeks.length?weeks.map(w=>`<a class="card" href="semana.html?modulo=${encodeURIComponent(mod.id)}&semana=${encodeURIComponent(w.numero)}"><span class="code">SEMANA ${esc(w.numero)}</span><h3>${esc(w.titulo)}</h3><p>${esc(w.tema||"")}</p></a>`).join(""):'<div class="notice">Todavía no hay semanas publicadas.</div>';
  }catch(e){grid.innerHTML=`<div class="error">${esc(e.message)}</div>`;}
}
async function renderSemana(){
  const modulo=normalizarRutaModulo(params.get("modulo")||""), semana=normalizarSemana(params.get("semana")||""), content=$("#week-content");
  if(!content)return;
  $("#back-module").href=`modulo.html?id=${encodeURIComponent(modulo)}`;
  try{
    const data=await getJSON(`modulos/${modulo}/semana-${semana}/contenido.json`);
    $("#week-kicker").textContent=`CINDEA ASERRÍ · ${data.modulo}`;
    $("#week-title").textContent=`Semana ${data.semana}`;
    $("#week-topic").textContent=data.titulo||"";
    const indicadores=(data.indicadores||[]).map(i=>`<li>${esc(i)}</li>`).join("");
    const cuerpo=(data.bloques||[]).map(renderBloque).join("");
    content.innerHTML=`<section class="indicator-box"><div class="indicator-box-head"><div class="indicator-box-title">${iconHtml("pin","heading-icon")}<span>Indicadores del trabajo cotidiano</span></div>${data.leccionesSugeridas?`<span class="indicator-lessons">Lecciones sugeridas ${esc(data.leccionesSugeridas)}</span>`:""}</div><div class="indicator-box-body"><ol class="indicators alpha-list">${indicadores}</ol></div></section>${cuerpo}${ayudaHTML(data.ayuda)}`;
    await typesetMath(content);
  }catch(e){content.innerHTML=`<div class="error">${esc(e.message)}</div>`;}
}

const page=document.body.dataset.page;
if(page==="inicio")renderInicio();
if(page==="modulo")renderModulo();
if(page==="semana")renderSemana();
})();
