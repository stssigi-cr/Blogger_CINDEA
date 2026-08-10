(() => {
"use strict";

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);

const ICONOS = {
  pin:"bi-pin-angle-fill",
  target:"bi-bullseye",
  pencil:"bi-pencil-square",
  book:"bi-book-fill",
  toolbox:"bi-tools",
  file:"bi-file-earmark-pdf-fill",
  ruler:"bi-rulers",
  play:"bi-play-circle-fill",
  link:"bi-link-45deg",
  message:"bi-chat-dots-fill",
  info:"bi-info-circle-fill",
  check:"bi-check-circle-fill",
  steps:"bi-list-ol",
  practice:"bi-ui-checks-grid",
  video:"bi-play-btn-fill",
  videos:"bi-collection-play-fill",
  geogebra:"bi-bounding-box-circles",
  download:"bi-download",
  external:"bi-box-arrow-up-right",
  star:"bi-star-fill",
  required:"bi-bookmark-check-fill",
  more:"bi-chevron-down"
};

function iconHtml(name, extraClass=""){
  const iconClass = ICONOS[name] || ICONOS.link;
  return `<i class="bi ${iconClass} ui-icon ${extraClass}" aria-hidden="true"></i>`;
}

async function getJSON(path){
  const res = await fetch(`${path}?v=0.9.1`, {cache:"no-store"});
  if(!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json();
}

function esc(v=""){
  return String(v).replace(/[&<>"']/g,ch=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[ch]));
}

function normalizarRutaModulo(v=""){
  return /^[a-z0-9-]+$/i.test(v) ? v : "";
}

function normalizarSemana(v=""){
  return /^\d{2}$/.test(v) ? v : "";
}

async function typesetMath(root){
  try{
    if(window.MathJax?.startup?.promise && window.MathJax?.typesetPromise){
      await window.MathJax.startup.promise;
      await window.MathJax.typesetPromise([root]);
    }
  }catch(err){
    console.warn("MathJax:",err);
  }
}

function paragraphList(items=[]){
  return Array.isArray(items)
    ? items.map(p=>`<p>${esc(p)}</p>`).join("")
    : "";
}

function formulaList(items=[]){
  return Array.isArray(items)
    ? items.map(f=>`<div class="formula-block">${esc(f)}</div>`).join("")
    : "";
}

function renderImagen(imagen){
  if(!imagen?.src) return "";
  return `
    <figure class="content-figure">
      <img
        src="${esc(imagen.src)}"
        alt="${esc(imagen.alt||"")}"
        loading="lazy"
        decoding="async">
      ${imagen.pie ? `<figcaption>${esc(imagen.pie)}</figcaption>` : ""}
    </figure>
  `;
}

function renderTabla(tabla){
  if(!tabla?.encabezados?.length || !tabla?.filas?.length) return "";

  const headers = tabla.encabezados;
  const labels = headers.slice(1);

  const head = headers
    .map(h=>`<th scope="col">${esc(h)}</th>`)
    .join("");

  const rows = tabla.filas.map(f=>`
    <tr>
      ${f.map((c,j)=>
        j===0
          ? `<th scope="row">${esc(c)}</th>`
          : `<td>${esc(c)}</td>`
      ).join("")}
    </tr>
  `).join("");

  const cards = tabla.filas.map(f=>`
    <section class="data-card">
      <h4>${esc(f[0])}</h4>
      <div class="data-card-grid">
        ${f.slice(1).map((v,i)=>`
          <div class="data-cell">
            <span class="data-cell-label">${esc(labels[i]||String(i+1))}</span>
            <strong>${esc(v)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");

  return `
    <div class="data-block">
      <div class="table-desktop">
        <table class="data-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="table-mobile">${cards}</div>
    </div>
  `;
}

function renderActividad(a){
  if(!a) return "";

  const qs = (a.preguntas||[])
    .map(q=>`<li>${esc(q)}</li>`)
    .join("");

  return `
    <div class="problem-activity">
      <h3>
        ${iconHtml("pencil","heading-icon")}
        ${esc(a.titulo||"Trabajo estudiantil independiente")}
      </h3>
      ${paragraphList(a.introduccion)}
      ${qs ? `<ol class="question-list alpha-list">${qs}</ol>` : ""}
    </div>
  `;
}

function renderSituacion(b,index){
  const hasImage = Boolean(b.imagen?.src);

  return `
    <section class="panel problem-panel">
      <div class="problem-number">
        SITUACIÓN ${String(index+1).padStart(2,"0")}
      </div>

      <h2>
        ${iconHtml("target","heading-icon")}
        ${esc(b.titulo||"Situación problema")}
      </h2>

      <div class="${hasImage ? "problem-grid" : ""}">
        <div class="problem-copy">${paragraphList(b.texto)}</div>
        ${renderImagen(b.imagen)}
      </div>

      ${renderTabla(b.tabla)}

      ${b.preguntaClave
        ? `<p class="key-question"><strong>${esc(b.preguntaClave)}</strong></p>`
        : ""}

      ${renderActividad(b.actividad)}
    </section>
  `;
}

function renderEjemplo(b){
  return `
    <section class="example-panel">
      <div class="example-head">
        <span class="example-number">${esc(b.titulo||"Ejemplo")}</span>
        ${b.subtitulo
          ? `<span class="example-subtitle">${esc(b.subtitulo)}</span>`
          : ""}
      </div>

      <div class="example-body">
        ${paragraphList(b.parrafos)}
        ${renderTabla(b.tabla)}

        ${b.pregunta
          ? `<p class="example-question">${esc(b.pregunta)}</p>`
          : ""}

        ${b.solucionTitulo
          ? `<h3 class="example-solution-title">${esc(b.solucionTitulo)}</h3>`
          : ""}

        ${paragraphList(b.solucionParrafos)}
        ${formulaList(b.formulas)}
        ${renderTabla(b.tablaSolucion)}

        ${b.conclusion
          ? `<p class="example-conclusion"><strong>${esc(b.conclusion)}</strong></p>`
          : ""}
      </div>
    </section>
  `;
}

function renderTeoria(b){
  return `
    <section class="theory-panel">
      <div class="theory-head">
        ${iconHtml(b.icono||"book","heading-icon")}
        <h2>${esc(b.titulo||"Teoría")}</h2>
      </div>

      <div class="theory-body">
        ${paragraphList(b.parrafos)}
        ${formulaList(b.formulas)}
        ${renderTabla(b.tabla)}
        ${renderImagen(b.imagen)}
      </div>
    </section>
  `;
}

function renderPasoAPaso(b){
  const pasos = (b.pasos||[]).map((p,i)=>`
    <li class="step-item">
      <div class="step-marker">${i+1}</div>
      <div class="step-content">
        ${p.titulo ? `<h3>${esc(p.titulo)}</h3>` : ""}
        ${p.texto ? `<p>${esc(p.texto)}</p>` : ""}
        ${p.formula ? `<div class="step-formula">${esc(p.formula)}</div>` : ""}
      </div>
    </li>
  `).join("");

  return `
    <section class="steps-panel">
      <div class="steps-head">
        ${iconHtml(b.icono||"steps","heading-icon")}
        <h2>${esc(b.titulo||"Paso a paso")}</h2>
      </div>

      <ol class="steps-list">${pasos}</ol>
    </section>
  `;
}

function renderNota(b){
  return `
    <aside class="important-note">
      ${b.titulo
        ? `<h3>${iconHtml(b.icono||"info","heading-icon")}${esc(b.titulo)}</h3>`
        : ""}
      ${paragraphList(b.parrafos)}
      ${formulaList(b.formulas)}
    </aside>
  `;
}

function renderTrabajoCotidiano(b){
  const items = (b.items||[])
    .map(i=>`<li>${esc(i)}</li>`)
    .join("");

  return `
    <section class="daily-work-panel">
      <div class="daily-work-head">
        ${iconHtml(b.icono||"pencil","heading-icon")}
        <h2>${esc(b.titulo||"Trabajo cotidiano")}</h2>
      </div>

      <div class="daily-work-body">
        ${paragraphList(b.instrucciones)}
        ${items ? `<ol class="daily-work-list">${items}</ol>` : ""}
        ${renderTabla(b.tabla)}
        ${renderImagen(b.imagen)}
      </div>
    </section>
  `;
}

/* ---------------------------------------------------------
   VIDEO INDIVIDUAL — se conserva para semanas con 1 video
   --------------------------------------------------------- */
function renderVideo(b){
  const id = b.videoId||"";
  const embed = id
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
    : "";

  return `
    <section class="media-panel">
      <div class="media-head">
        ${iconHtml("video","heading-icon")}
        <h2>${esc(b.titulo||"Video")}</h2>
      </div>

      <div class="media-body">
        ${b.descripcion ? `<p>${esc(b.descripcion)}</p>` : ""}

        ${embed
          ? `<div class="responsive-frame video-frame">
               <iframe
                 src="${embed}"
                 title="${esc(b.titulo||"Video")}"
                 loading="lazy"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                 allowfullscreen>
               </iframe>
             </div>`
          : ""}

        ${b.url
          ? `<a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">
               ${iconHtml("external")}Abrir video en una pestaña nueva
             </a>`
          : ""}
      </div>
    </section>
  `;
}

/* ---------------------------------------------------------
   VIDEOTECA v0.9
   - un único reproductor
   - categorías
   - miniaturas
   - carga de YouTube solo al pulsar reproducir
   --------------------------------------------------------- */
function youtubeThumb(videoId){
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

function videoBadge(v){
  if(v.obligatorio){
    return `<span class="video-badge required">${iconHtml("required")}Requerido</span>`;
  }
  if(v.destacado){
    return `<span class="video-badge featured">${iconHtml("star")}Recomendado</span>`;
  }
  return `<span class="video-badge complementary">Complementario</span>`;
}

function renderVideoListItem(v,index){
  return `
    <button
      class="video-list-item${index===0 ? " is-active" : ""}"
      type="button"
      data-video-id="${esc(v.videoId)}"
      data-id="${esc(v.id||String(index+1))}"
      data-group="${esc(v.grupo||"todos")}"
      data-title="${esc(v.titulo||"Video")}"
      data-description="${esc(v.descripcion||"")}"
      data-required="${v.obligatorio ? "true" : "false"}"
      data-featured="${v.destacado ? "true" : "false"}"
      aria-pressed="${index===0 ? "true" : "false"}">

      <span class="video-list-thumb">
        <img
          src="${youtubeThumb(v.videoId)}"
          alt=""
          loading="lazy"
          decoding="async">
        <span class="video-list-play">${iconHtml("play")}</span>
      </span>

      <span class="video-list-copy">
        <span class="video-list-number">${String(index+1).padStart(2,"0")}</span>
        <strong>${esc(v.titulo||"Video")}</strong>
        ${v.obligatorio
          ? `<span class="tiny-status required">Requerido</span>`
          : v.destacado
            ? `<span class="tiny-status featured">Recomendado</span>`
            : ""}
      </span>
    </button>
  `;
}

function renderVideoteca(b){
  const videos = Array.isArray(b.videos) ? b.videos.filter(v=>v.videoId) : [];
  if(!videos.length) return "";

  const first = videos[0];
  const groups = Array.isArray(b.grupos) ? b.grupos : [];

  const tabs = groups.length
    ? `
      <div class="video-tabs" role="tablist" aria-label="Categorías de videos">
        <button class="video-tab is-active" type="button" data-group="todos" role="tab" aria-selected="true">
          Todos
        </button>
        ${groups.map(g=>`
          <button
            class="video-tab"
            type="button"
            data-group="${esc(g.id)}"
            role="tab"
            aria-selected="false">
            ${esc(g.titulo)}
          </button>
        `).join("")}
      </div>
    `
    : "";

  return `
    <section
      class="video-library"
      data-mobile-count="${Number(b.cantidadInicialMovil)||4}">

      <div class="video-library-head">
        <div>
          <p class="video-library-kicker">VIDEOTECA</p>
          <h2>
            ${iconHtml("videos","heading-icon")}
            ${esc(b.titulo||"Videos de apoyo")}
          </h2>
          ${b.descripcion ? `<p>${esc(b.descripcion)}</p>` : ""}
        </div>
      </div>

      ${tabs}

      <div class="video-library-layout">

        <div class="video-stage">

          <div
            class="video-stage-player"
            data-current-video="${esc(first.videoId)}">

            <button
              type="button"
              class="video-poster-button"
              aria-label="Reproducir ${esc(first.titulo||"video")}">

              <img
                class="video-poster-image"
                src="${youtubeThumb(first.videoId)}"
                alt=""
                decoding="async">

              <span class="video-poster-overlay">
                <span class="video-main-play">${iconHtml("play")}</span>
              </span>
            </button>
          </div>

          <div class="video-stage-info">
            <div class="video-stage-status">
              ${videoBadge(first)}
              <span class="video-counter">Video 1 de ${videos.length}</span>
            </div>

            <h3 class="video-current-title">${esc(first.titulo||"Video")}</h3>
            <p class="video-current-description">${esc(first.descripcion||"")}</p>

            <a
              class="video-youtube-link"
              href="https://www.youtube.com/watch?v=${encodeURIComponent(first.videoId)}"
              target="_blank"
              rel="noopener noreferrer">
              ${iconHtml("external")}Abrir en YouTube
            </a>
          </div>

        </div>

        <aside class="video-library-list" aria-label="Lista de videos">
          <div class="video-list-inner">
            ${videos.map(renderVideoListItem).join("")}
          </div>

          <button class="video-show-more" type="button" hidden>
            ${iconHtml("more")}
            <span>Mostrar más videos</span>
          </button>
        </aside>

      </div>
    </section>
  `;
}

function activateVideotecas(root=document){
  root.querySelectorAll(".video-library").forEach(library=>{
    const items = [...library.querySelectorAll(".video-list-item")];
    const tabs = [...library.querySelectorAll(".video-tab")];
    const stage = library.querySelector(".video-stage-player");
    const posterBtn = library.querySelector(".video-poster-button");
    const posterImg = library.querySelector(".video-poster-image");
    const title = library.querySelector(".video-current-title");
    const description = library.querySelector(".video-current-description");
    const status = library.querySelector(".video-stage-status");
    const youtubeLink = library.querySelector(".video-youtube-link");
    const showMore = library.querySelector(".video-show-more");
    const mobileCount = Number(library.dataset.mobileCount)||4;

    let currentGroup = "todos";
    let expanded = false;
    let currentItem = items[0];

    function visibleItems(){
      return items.filter(item=>
        currentGroup==="todos" || item.dataset.group===currentGroup
      );
    }

    function updateMobileVisibility(){
      const isMobile = window.matchMedia("(max-width: 760px)").matches;
      const visible = visibleItems();

      items.forEach(item=>{
        const matches = currentGroup==="todos" || item.dataset.group===currentGroup;
        item.hidden = !matches;
        item.classList.remove("mobile-hidden");
      });

      if(isMobile && !expanded && visible.length>mobileCount){
        visible.slice(mobileCount).forEach(item=>item.classList.add("mobile-hidden"));
        showMore.hidden = false;
        showMore.querySelector("span").textContent =
          `Mostrar ${visible.length-mobileCount} videos más`;
      }else{
        showMore.hidden = true;
      }
    }

    function replaceWithPoster(item){
      const videoId = item.dataset.videoId;
      stage.dataset.currentVideo = videoId;

      stage.innerHTML = `
        <button
          type="button"
          class="video-poster-button"
          aria-label="Reproducir ${esc(item.dataset.title)}">

          <img
            class="video-poster-image"
            src="${youtubeThumb(videoId)}"
            alt=""
            decoding="async">

          <span class="video-poster-overlay">
            <span class="video-main-play">${iconHtml("play")}</span>
          </span>
        </button>
      `;

      stage.querySelector(".video-poster-button")
        .addEventListener("click",()=>playCurrentVideo());
    }

    function playCurrentVideo(){
      const videoId = stage.dataset.currentVideo;
      if(!videoId) return;

      stage.innerHTML = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
          title="${esc(currentItem.dataset.title||"Video")}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      `;
    }

    function selectItem(item){
      currentItem = item;

      items.forEach(i=>{
        const active = i===item;
        i.classList.toggle("is-active",active);
        i.setAttribute("aria-pressed",active ? "true" : "false");
      });

      const visible = visibleItems();
      const position = Math.max(0,visible.indexOf(item))+1;

      title.textContent = item.dataset.title||"Video";
      description.textContent = item.dataset.description||"";

      const badge = item.dataset.required==="true"
        ? `<span class="video-badge required">${iconHtml("required")}Requerido</span>`
        : item.dataset.featured==="true"
          ? `<span class="video-badge featured">${iconHtml("star")}Recomendado</span>`
          : `<span class="video-badge complementary">Complementario</span>`;

      status.innerHTML =
        `${badge}<span class="video-counter">Video ${position} de ${visible.length}</span>`;

      youtubeLink.href =
        `https://www.youtube.com/watch?v=${encodeURIComponent(item.dataset.videoId)}`;

      replaceWithPoster(item);
    }

    items.forEach(item=>{
      item.addEventListener("click",()=>selectItem(item));
    });

    tabs.forEach(tab=>{
      tab.addEventListener("click",()=>{
        currentGroup = tab.dataset.group||"todos";
        expanded = false;

        tabs.forEach(t=>{
          const active = t===tab;
          t.classList.toggle("is-active",active);
          t.setAttribute("aria-selected",active ? "true" : "false");
        });

        updateMobileVisibility();

        const firstVisible = visibleItems()[0];
        if(firstVisible) selectItem(firstVisible);
      });
    });

    showMore?.addEventListener("click",()=>{
      expanded = true;
      updateMobileVisibility();
    });

    window.addEventListener("resize",updateMobileVisibility,{passive:true});

    updateMobileVisibility();
    replaceWithPoster(currentItem);
  });
}

function renderGeoGebra(b){
  const mid = b.materialId||"";
  const src = mid
    ? `https://www.geogebra.org/material/iframe/id/${encodeURIComponent(mid)}`
    : "";

  return `
    <section class="media-panel geogebra-panel">
      <div class="media-head">
        ${iconHtml("geogebra","heading-icon")}
        <h2>${esc(b.titulo||"GeoGebra")}</h2>
      </div>

      <div class="media-body">
        ${b.descripcion ? `<p>${esc(b.descripcion)}</p>` : ""}

        ${src
          ? `<div class="responsive-frame geogebra-frame" style="--embed-height:${Number(b.altura)||600}px">
               <iframe
                 src="${src}"
                 title="${esc(b.titulo||"GeoGebra")}"
                 loading="lazy"
                 allowfullscreen>
               </iframe>
             </div>`
          : ""}

        ${b.url
          ? `<a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">
               ${iconHtml("external")}Abrir en GeoGebra
             </a>`
          : ""}
      </div>
    </section>
  `;
}

function absoluteResourceUrl(path){
  if(!path) return "";
  try { return new URL(path, document.baseURI).href; }
  catch(err){ return path; }
}

function iframeFreshUrl(path){
  const absolute = absoluteResourceUrl(path);
  if(!absolute) return "";
  try{
    const u = new URL(absolute);
    u.searchParams.set("_embed", "0.9.1");
    return u.href;
  }catch(err){ return absolute; }
}

function renderExeLearning(b){
  if(b.disponible!==true || !b.url){
    return `<section class="practice-panel">
      <div class="practice-icon">${iconHtml("practice")}</div>
      <div class="practice-copy">
        <p class="practice-kicker">PRÁCTICA</p>
        <h2>${esc(b.titulo||"Práctica")}</h2>
        <p>${esc(b.descripcion||"")}</p>
      </div>
      <span class="practice-button is-disabled">Próximamente</span>
    </section>`;
  }

  const fullUrl = absoluteResourceUrl(b.url);
  const embedUrl = iframeFreshUrl(b.url);

  return `<section class="media-panel exelearning-panel">
    <div class="media-head">
      ${iconHtml("practice","heading-icon")}
      <h2>${esc(b.titulo||"Práctica interactiva")}</h2>
    </div>
    <div class="media-body">
      ${b.descripcion ? `<p>${esc(b.descripcion)}</p>` : ""}
      ${b.modo==="iframe" ? `<div class="responsive-frame exe-frame" style="--embed-height:${Number(b.altura)||720}px">
        <iframe
          src="${esc(embedUrl)}"
          title="${esc(b.titulo||"Práctica interactiva")}"
          loading="eager"
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </div>` : ""}
      <a class="media-link"
         href="${esc(fullUrl)}"
         ${b.abrirEnNuevaPestana!==false ? 'target="_blank" rel="noopener noreferrer"' : ""}>
        ${iconHtml("external")}Abrir práctica en pantalla completa
      </a>
    </div>
  </section>`;
}

function renderPdf(b){
  if(b.disponible!==true || !b.url) return "";

  return `
    <section class="media-panel pdf-panel">
      <div class="media-head">
        ${iconHtml("file","heading-icon")}
        <h2>${esc(b.titulo||"PDF")}</h2>
      </div>

      <div class="media-body">
        ${b.descripcion ? `<p>${esc(b.descripcion)}</p>` : ""}

        ${b.vistaPrevia
          ? `<div class="responsive-frame pdf-frame" style="--embed-height:${Number(b.altura)||650}px">
               <iframe
                 src="${esc(b.url)}"
                 title="${esc(b.titulo||"PDF")}"
                 loading="lazy">
               </iframe>
             </div>`
          : ""}

        <div class="media-actions">
          <a class="media-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">
            ${iconHtml("external")}Abrir PDF
          </a>

          ${b.descargar
            ? `<a class="media-link" href="${esc(b.url)}" download>
                 ${iconHtml("download")}Descargar PDF
               </a>`
            : ""}
        </div>
      </div>
    </section>
  `;
}

function renderBloque(b,index){
  if(b?.mostrar===false) return "";

  switch(b.tipo){
    case "teoria": return renderTeoria(b);
    case "video": return renderVideo(b);
    case "videoteca": return renderVideoteca(b);
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

  return `
    <section class="help-panel">
      <div>
        <p class="help-kicker">APOYO</p>
        <h2>${esc(a.titulo||"¿Necesita ayuda?")}</h2>
        <p>${esc(a.texto||"")}</p>
      </div>

      ${a.url
        ? `<a class="button-primary" href="${esc(a.url)}">
             ${iconHtml("message","button-icon")}
             <span>Enviar mensaje</span>
           </a>`
        : `<span class="button-primary disabled-button">
             ${iconHtml("message","button-icon")}
             <span>Enviar mensaje</span>
           </span>`}
    </section>
  `;
}

async function renderInicio(){
  const grid = $("#module-grid");
  if(!grid) return;

  try{
    const data = await getJSON("data/modulos.json");
    grid.innerHTML = data.modulos
      .filter(m=>m.activo)
      .map(m=>`
        <a class="card" href="modulo.html?id=${encodeURIComponent(m.id)}">
          <span class="code">${esc(m.id.toUpperCase())}</span>
          <h3>${esc(m.nombre)}</h3>
          <p>${esc(m.descripcion||"")}</p>
        </a>
      `).join("");
  }catch(e){
    grid.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}

async function renderModulo(){
  const id = normalizarRutaModulo(params.get("id")||"");
  const grid = $("#week-grid");
  if(!grid) return;

  try{
    const data = await getJSON("data/modulos.json");
    const mod = data.modulos.find(m=>m.id===id&&m.activo);

    if(!mod) throw new Error("El módulo solicitado no existe.");

    $("#module-title").textContent = mod.nombre;
    $("#module-description").textContent = mod.descripcion||"";

    const weeks = (mod.semanas||[]).filter(w=>w.publicada);

    grid.innerHTML = weeks.length
      ? weeks.map(w=>`
          <a class="card" href="semana.html?modulo=${encodeURIComponent(mod.id)}&semana=${encodeURIComponent(w.numero)}">
            <span class="code">SEMANA ${esc(w.numero)}</span>
            <h3>${esc(w.titulo)}</h3>
            <p>${esc(w.tema||"")}</p>
          </a>
        `).join("")
      : '<div class="notice">Todavía no hay semanas publicadas.</div>';

  }catch(e){
    grid.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}

async function renderSemana(){
  const modulo = normalizarRutaModulo(params.get("modulo")||"");
  const semana = normalizarSemana(params.get("semana")||"");
  const content = $("#week-content");

  if(!content) return;

  $("#back-module").href =
    `modulo.html?id=${encodeURIComponent(modulo)}`;

  try{
    const data = await getJSON(
      `modulos/${modulo}/semana-${semana}/contenido.json`
    );

    $("#week-kicker").textContent =
      `CINDEA ASERRÍ · ${data.modulo}`;

    $("#week-title").textContent =
      `Semana ${data.semana}`;

    $("#week-topic").textContent =
      data.titulo||"";

    const indicadores = (data.indicadores||[])
      .map(i=>`<li>${esc(i)}</li>`)
      .join("");

    const cuerpo = (data.bloques||[])
      .map(renderBloque)
      .join("");

    content.innerHTML = `
      <section class="indicator-box">
        <div class="indicator-box-head">
          <div class="indicator-box-title">
            ${iconHtml("pin","heading-icon")}
            <span>Indicadores del trabajo cotidiano</span>
          </div>

          ${data.leccionesSugeridas
            ? `<span class="indicator-lessons">
                 Lecciones sugeridas ${esc(data.leccionesSugeridas)}
               </span>`
            : ""}
        </div>

        <div class="indicator-box-body">
          <ol class="indicators alpha-list">${indicadores}</ol>
        </div>
      </section>

      ${cuerpo}
      ${ayudaHTML(data.ayuda)}
    `;

    activateVideotecas(content);
    await typesetMath(content);

  }catch(e){
    content.innerHTML =
      `<div class="error">${esc(e.message)}</div>`;
  }
}

const page = document.body.dataset.page;

if(page==="inicio") renderInicio();
if(page==="modulo") renderModulo();
if(page==="semana") renderSemana();

})();
