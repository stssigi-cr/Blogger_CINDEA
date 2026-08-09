(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const params = new URLSearchParams(location.search);

  async function getJSON(path){
    const res = await fetch(path, {cache:"no-store"});
    if(!res.ok) throw new Error(`No se pudo cargar ${path}`);
    return res.json();
  }

  function esc(value=""){
    return String(value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[ch]);
  }

  async function renderInicio(){
    const grid = $("#module-grid");
    grid.innerHTML = '<p class="loading">Cargando módulos…</p>';
    try{
      const data = await getJSON("data/modulos.json");
      grid.innerHTML = data.modulos.filter(m => m.activo).map(m => `
        <a class="card" href="modulo.html?id=${encodeURIComponent(m.id)}">
          <span class="code">${esc(m.id.toUpperCase())}</span>
          <h3>${esc(m.nombre)}</h3>
          <p>${esc(m.descripcion || "")}</p>
        </a>
      `).join("");
    }catch(err){
      grid.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  async function renderModulo(){
    const id = params.get("id");
    const grid = $("#week-grid");
    try{
      const data = await getJSON("data/modulos.json");
      const mod = data.modulos.find(m => m.id === id && m.activo);
      if(!mod) throw new Error("El módulo solicitado no existe.");
      document.title = `${mod.nombre} — CINDEA Aserrí`;
      $("#module-title").textContent = mod.nombre;
      $("#module-description").textContent = mod.descripcion || "";
      const weeks = (mod.semanas || []).filter(w => w.publicada);
      if(!weeks.length){
        grid.innerHTML = '<div class="notice">Todavía no hay semanas publicadas para este módulo.</div>';
        return;
      }
      grid.innerHTML = weeks.map(w => `
        <a class="card" href="semana.html?modulo=${encodeURIComponent(mod.id)}&semana=${encodeURIComponent(w.numero)}">
          <span class="code">SEMANA ${esc(w.numero)}</span>
          <h3>${esc(w.titulo)}</h3>
          <p>${esc(w.tema || "")}</p>
        </a>
      `).join("");
    }catch(err){
      grid.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  function resourceHTML(r){
    const cls = r.disponible === false ? "resource disabled" : "resource";
    const href = r.disponible === false ? "#" : esc(r.url || "#");
    return `
      <a class="${cls}" href="${href}" ${r.disponible === false ? 'aria-disabled="true"' : ""}>
        <strong>${esc(r.titulo || "Recurso")}</strong>
        <span>${esc(r.descripcion || "")}</span>
      </a>
    `;
  }

  async function renderSemana(){
    const modulo = params.get("modulo");
    const semana = params.get("semana");
    const content = $("#week-content");
    if(!modulo || !semana){
      content.innerHTML = '<div class="error">Faltan datos para abrir la semana.</div>';
      return;
    }
    $("#back-module").href = `modulo.html?id=${encodeURIComponent(modulo)}`;
    try{
      const path = `modulos/${encodeURIComponent(modulo)}/semana-${encodeURIComponent(semana)}/contenido.json`;
      const data = await getJSON(path);
      document.title = `${data.modulo} · Semana ${data.semana} — CINDEA Aserrí`;
      $("#week-kicker").textContent = `CINDEA ASERRÍ · ${data.modulo}`;
      $("#week-title").textContent = `Semana ${data.semana}`;
      $("#week-topic").textContent = data.titulo || "";

      const indicadores = (data.indicadores || []).map(i => `<li>${esc(i)}</li>`).join("");
      const secciones = (data.secciones || []).map(s => `
        <section class="panel">
          <h2>${esc(s.titulo || "")}</h2>
          <p>${esc(s.contenido || "")}</p>
        </section>
      `).join("");
      const recursos = (data.recursos || []).map(resourceHTML).join("");

      content.innerHTML = `
        <section class="panel">
          <h2>Indicadores del trabajo cotidiano</h2>
          ${data.leccionesSugeridas ? `<p><strong>Lecciones sugeridas:</strong> ${esc(data.leccionesSugeridas)}</p>` : ""}
          <ol class="indicators">${indicadores}</ol>
        </section>

        <section class="panel">
          <h2>${esc(data.situacionProblema?.titulo || "Situación problema")}</h2>
          <p>${esc(data.situacionProblema?.texto || "")}</p>
          ${data.situacionProblema?.imagen ? `<img src="${esc(data.situacionProblema.imagen)}" alt="" style="max-width:100%;height:auto;border-radius:14px">` : ""}
        </section>

        ${secciones}

        <section class="panel">
          <h2>Recursos de la semana</h2>
          <div class="resource-grid">${recursos || '<p>Aún no hay recursos publicados.</p>'}</div>
        </section>
      `;
    }catch(err){
      content.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  const page = document.body.dataset.page;
  if(page === "inicio") renderInicio();
  if(page === "modulo") renderModulo();
  if(page === "semana") renderSemana();
})();
