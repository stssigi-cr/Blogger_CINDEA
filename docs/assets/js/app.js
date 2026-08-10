(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const params = new URLSearchParams(location.search);

  const ICONOS_RECURSO = {
    teoria: "📘",
    exelearning: "✏️",
    geogebra: "📐",
    pdf: "📄",
    video: "▶️",
    enlace: "🔗",
    mensaje: "💬"
  };

  async function getJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
    return res.json();
  }

  function esc(value = "") {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[ch]);
  }

  function normalizarRutaModulo(value = "") {
    return /^[a-z0-9-]+$/i.test(value) ? value : "";
  }

  function normalizarSemana(value = "") {
    return /^\d{2}$/.test(value) ? value : "";
  }

  async function typesetMath(root) {
    try {
      if (window.MathJax?.startup?.promise && window.MathJax?.typesetPromise) {
        await window.MathJax.startup.promise;
        await window.MathJax.typesetPromise([root]);
      }
    } catch (err) {
      console.warn("MathJax no pudo procesar una expresión:", err);
    }
  }

  function paragraphList(items = []) {
    if (!Array.isArray(items)) return "";
    return items.map(p => `<p>${esc(p)}</p>`).join("");
  }

  function renderImagen(imagen) {
    if (!imagen || !imagen.src) return "";
    const pie = imagen.pie ? `<figcaption>${esc(imagen.pie)}</figcaption>` : "";
    return `
      <figure class="content-figure">
        <img src="${esc(imagen.src)}"
             alt="${esc(imagen.alt || "")}"
             loading="lazy"
             decoding="async">
        ${pie}
      </figure>
    `;
  }

  function renderSeccion(seccion = {}) {
    const icono = seccion.icono
      ? `<span class="section-icon" aria-hidden="true">${esc(seccion.icono)}</span>`
      : "";
    const titulo = esc(seccion.titulo || "");

    if (seccion.tipo === "actividad") {
      const preguntas = (seccion.preguntas || [])
        .map(q => `<li>${esc(q)}</li>`)
        .join("");
      return `
        <section class="panel">
          <h2>${icono}${titulo}</h2>
          ${paragraphList(seccion.introduccion)}
          ${preguntas ? `<ol class="question-list">${preguntas}</ol>` : ""}
          ${renderImagen(seccion.imagen)}
        </section>
      `;
    }

    if (seccion.tipo === "nota") {
      return `
        <aside class="panel note-panel">
          <h2>${icono}${titulo}</h2>
          ${paragraphList(seccion.parrafos)}
        </aside>
      `;
    }

    return `
      <section class="panel">
        <h2>${icono}${titulo}</h2>
        ${paragraphList(seccion.parrafos)}
        ${renderImagen(seccion.imagen)}
      </section>
    `;
  }

  function resourceHTML(r = {}) {
    const disponible = r.disponible === true && Boolean(r.url);
    const icono = ICONOS_RECURSO[r.tipo] || "🔗";

    if (!disponible) {
      return `
        <div class="resource disabled" aria-disabled="true">
          <div class="resource-icon" aria-hidden="true">${icono}</div>
          <div class="resource-body">
            <strong>${esc(r.titulo || "Recurso")}</strong>
            <span>${esc(r.descripcion || "")}</span>
            <span class="resource-status">Próximamente</span>
          </div>
        </div>
      `;
    }

    const target = r.abrirEnNuevaPestana
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";

    return `
      <a class="resource" href="${esc(r.url)}"${target}>
        <div class="resource-icon" aria-hidden="true">${icono}</div>
        <div class="resource-body">
          <strong>${esc(r.titulo || "Recurso")}</strong>
          <span>${esc(r.descripcion || "")}</span>
          <span class="resource-action">Abrir recurso →</span>
        </div>
      </a>
    `;
  }

  function ayudaHTML(ayuda = {}) {
    if (!ayuda.mostrar) return "";

    const boton = ayuda.url
      ? `<a class="button-primary" href="${esc(ayuda.url)}">💬 Enviar mensaje</a>`
      : `<span class="button-primary disabled-button" aria-disabled="true">💬 Enviar mensaje</span>`;

    return `
      <section class="help-panel">
        <div>
          <p class="help-kicker">APOYO</p>
          <h2>${esc(ayuda.titulo || "¿Necesita ayuda?")}</h2>
          <p>${esc(ayuda.texto || "")}</p>
        </div>
        ${boton}
      </section>
    `;
  }

  async function renderInicio() {
    const grid = $("#module-grid");
    if (!grid) return;
    grid.innerHTML = '<p class="loading">Cargando módulos…</p>';

    try {
      const data = await getJSON("data/modulos.json");
      grid.innerHTML = data.modulos
        .filter(m => m.activo)
        .map(m => `
          <a class="card" href="modulo.html?id=${encodeURIComponent(m.id)}">
            <span class="code">${esc(m.id.toUpperCase())}</span>
            <h3>${esc(m.nombre)}</h3>
            <p>${esc(m.descripcion || "")}</p>
          </a>
        `).join("");
    } catch (err) {
      grid.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  async function renderModulo() {
    const id = normalizarRutaModulo(params.get("id") || "");
    const grid = $("#week-grid");
    if (!grid) return;

    try {
      const data = await getJSON("data/modulos.json");
      const mod = data.modulos.find(m => m.id === id && m.activo);
      if (!mod) throw new Error("El módulo solicitado no existe.");

      document.title = `${mod.nombre} — CINDEA Aserrí`;
      $("#module-title").textContent = mod.nombre;
      $("#module-description").textContent = mod.descripcion || "";

      const weeks = (mod.semanas || []).filter(w => w.publicada);
      if (!weeks.length) {
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
    } catch (err) {
      grid.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  async function renderSemana() {
    const modulo = normalizarRutaModulo(params.get("modulo") || "");
    const semana = normalizarSemana(params.get("semana") || "");
    const content = $("#week-content");

    if (!content) return;

    if (!modulo || !semana) {
      content.innerHTML = '<div class="error">Faltan datos válidos para abrir la semana.</div>';
      return;
    }

    $("#back-module").href = `modulo.html?id=${encodeURIComponent(modulo)}`;

    try {
      const path = `modulos/${modulo}/semana-${semana}/contenido.json`;
      const data = await getJSON(path);

      document.title = `${data.modulo} · Semana ${data.semana} — CINDEA Aserrí`;
      $("#week-kicker").textContent = `CINDEA ASERRÍ · ${data.modulo}`;
      $("#week-title").textContent = `Semana ${data.semana}`;
      $("#week-topic").textContent = data.titulo || "";

      const indicadores = (data.indicadores || [])
        .map(i => `<li>${esc(i)}</li>`)
        .join("");

      const situacionTexto = Array.isArray(data.situacionProblema?.texto)
        ? paragraphList(data.situacionProblema.texto)
        : `<p>${esc(data.situacionProblema?.texto || "")}</p>`;

      const secciones = (data.secciones || [])
        .map(renderSeccion)
        .join("");

      const recursos = (data.recursos || [])
        .map(resourceHTML)
        .join("");

      content.innerHTML = `
        <section class="panel indicators-panel">
          <div class="panel-heading-row">
            <h2><span class="section-icon" aria-hidden="true">📌</span>Indicadores del trabajo cotidiano</h2>
            ${data.leccionesSugeridas
              ? `<span class="lesson-badge">${esc(data.leccionesSugeridas)} lecciones sugeridas</span>`
              : ""}
          </div>
          <ol class="indicators alpha-list">${indicadores}</ol>
        </section>

        <section class="panel">
          <h2><span class="section-icon" aria-hidden="true">🎯</span>${esc(data.situacionProblema?.titulo || "Situación problema")}</h2>
          <div class="${data.situacionProblema?.imagen?.src ? "problem-grid" : ""}">
            <div>${situacionTexto}</div>
            ${renderImagen(data.situacionProblema?.imagen)}
          </div>
        </section>

        ${secciones}

        <section class="panel">
          <div class="panel-heading-row">
            <h2><span class="section-icon" aria-hidden="true">🧰</span>Recursos de la semana</h2>
          </div>
          <div class="resource-grid">
            ${recursos || '<p>Aún no hay recursos publicados.</p>'}
          </div>
        </section>

        ${ayudaHTML(data.ayuda)}
      `;

      await typesetMath(content);
    } catch (err) {
      content.innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  }

  const page = document.body.dataset.page;
  if (page === "inicio") renderInicio();
  if (page === "modulo") renderModulo();
  if (page === "semana") renderSemana();
})();
