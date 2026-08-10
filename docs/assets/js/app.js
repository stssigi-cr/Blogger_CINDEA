(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const params = new URLSearchParams(location.search);

  const ICONOS = {
    pin: "bi-pin-angle-fill",
    target: "bi-bullseye",
    pencil: "bi-pencil-square",
    book: "bi-book-fill",
    toolbox: "bi-tools",
    file: "bi-file-earmark-pdf-fill",
    ruler: "bi-rulers",
    play: "bi-play-circle-fill",
    link: "bi-link-45deg",
    message: "bi-chat-dots-fill",
    info: "bi-info-circle-fill",
    check: "bi-check-circle-fill"
  };

  const ICON_ALIASES = {
    "📌": "pin",
    "🎯": "target",
    "✏️": "pencil",
    "📘": "book",
    "🧰": "toolbox",
    "📄": "file",
    "📐": "ruler",
    "▶️": "play",
    "🔗": "link",
    "💬": "message"
  };

  const ICONOS_RECURSO = {
    teoria: "book",
    exelearning: "pencil",
    geogebra: "ruler",
    pdf: "file",
    video: "play",
    enlace: "link",
    mensaje: "message"
  };

  function iconHtml(name, extraClass = "") {
    const resolved = ICON_ALIASES[name] || name || "link";
    const iconClass = ICONOS[resolved] || ICONOS.link;
    return `<i class="bi ${iconClass} ui-icon ${extraClass}" aria-hidden="true"></i>`;
  }

  async function getJSON(path) {
    const res = await fetch(`${path}?v=0.6.0`, { cache: "no-store" });
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
    return `
      <figure class="content-figure">
        <img
          src="${esc(imagen.src)}"
          alt="${esc(imagen.alt || "")}"
          loading="lazy"
          decoding="async">
        ${imagen.pie ? `<figcaption>${esc(imagen.pie)}</figcaption>` : ""}
      </figure>
    `;
  }

  function renderTabla(tabla) {
    if (!tabla?.encabezados?.length || !tabla?.filas?.length) return "";

    const headers = tabla.encabezados;
    const numericHeaders = headers.slice(1);

    const head = headers.map(h => `<th scope="col">${esc(h)}</th>`).join("");
    const rows = tabla.filas.map(fila => `
      <tr>
        ${fila.map((c, j) => j === 0
          ? `<th scope="row">${esc(c)}</th>`
          : `<td>${esc(c)}</td>`
        ).join("")}
      </tr>
    `).join("");

    const cards = tabla.filas.map(fila => {
      const encabezado = fila[0];
      const valores = fila.slice(1);
      return `
        <section class="data-card">
          <h4>${esc(encabezado || "Fila")}</h4>
          <div class="data-card-grid">
            ${valores.map((valor, i) => `
              <div class="data-cell">
                <span class="data-cell-label">${esc(numericHeaders[i] || String(i + 1))}</span>
                <strong>${esc(valor)}</strong>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");

    return `
      <div class="data-block">
        <div class="table-desktop">
          <table class="data-table">
            <colgroup>
              <col class="label-col">
              ${numericHeaders.map(() => '<col class="value-col">').join("")}
            </colgroup>
            <thead><tr>${head}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="table-mobile">${cards}</div>
      </div>
    `;
  }

  function renderActividad(actividad) {
    if (!actividad) return "";

    const preguntas = (actividad.preguntas || [])
      .map(q => `<li>${esc(q)}</li>`)
      .join("");

    return `
      <div class="problem-activity">
        <h3>${iconHtml("pencil", "heading-icon")}${esc(actividad.titulo || "Trabajo estudiantil independiente")}</h3>
        ${paragraphList(actividad.introduccion)}
        ${preguntas ? `<ol class="question-list alpha-list">${preguntas}</ol>` : ""}
      </div>
    `;
  }

  function renderSituacion(situacion, index) {
    const texto = paragraphList(situacion.texto || []);
    const tabla = renderTabla(situacion.tabla);

    const preguntaClave = situacion.preguntaClave
      ? `<p class="key-question"><strong>${esc(situacion.preguntaClave)}</strong></p>`
      : "";

    const hasImage = Boolean(situacion.imagen?.src);

    return `
      <section class="panel problem-panel">
        <div class="problem-number">SITUACIÓN ${String(index + 1).padStart(2, "0")}</div>
        <h2>${iconHtml("target", "heading-icon")}${esc(situacion.titulo || `Situación problema ${index + 1}`)}</h2>

        <div class="${hasImage ? "problem-grid" : ""}">
          <div class="problem-copy">${texto}</div>
          ${renderImagen(situacion.imagen)}
        </div>

        ${tabla}
        ${preguntaClave}
        ${renderActividad(situacion.actividad)}
      </section>
    `;
  }

  function renderEjemplo(seccion = {}) {
    return `
      <section class="example-panel">
        <div class="example-head">
          <span class="example-number">${esc(seccion.titulo || "Ejemplo")}</span>
          ${seccion.subtitulo ? `<span class="example-subtitle">${esc(seccion.subtitulo)}</span>` : ""}
        </div>

        <div class="example-body">
          ${paragraphList(seccion.parrafos)}
          ${renderTabla(seccion.tabla)}
          ${seccion.pregunta ? `<p class="example-question">${esc(seccion.pregunta)}</p>` : ""}
          ${seccion.solucionTitulo ? `<h3 class="example-solution-title">${esc(seccion.solucionTitulo)}</h3>` : ""}
          ${paragraphList(seccion.solucionParrafos)}
          ${renderTabla(seccion.tablaSolucion)}
        </div>
      </section>
    `;
  }

  function renderSeccion(seccion = {}) {
    const icono = seccion.icono ? iconHtml(seccion.icono, "heading-icon") : "";

    if (seccion.tipo === "ejemplo") {
      return renderEjemplo(seccion);
    }

    if (seccion.tipo === "actividad") {
      const preguntas = (seccion.preguntas || [])
        .map(q => `<li>${esc(q)}</li>`)
        .join("");

      return `
        <section class="panel">
          <h2>${icono}${esc(seccion.titulo || "")}</h2>
          ${paragraphList(seccion.introduccion)}
          ${preguntas ? `<ol class="question-list">${preguntas}</ol>` : ""}
          ${renderImagen(seccion.imagen)}
        </section>
      `;
    }

    if (seccion.tipo === "nota" || seccion.tipo === "definicion") {
      return `
        <aside class="important-note">
          ${seccion.titulo ? `<h3>${icono}${esc(seccion.titulo)}</h3>` : ""}
          ${paragraphList(seccion.parrafos)}
        </aside>
      `;
    }

    return `
      <section class="panel">
        <h2>${icono}${esc(seccion.titulo || "")}</h2>
        ${paragraphList(seccion.parrafos)}
        ${renderImagen(seccion.imagen)}
      </section>
    `;
  }

  function resourceHTML(r = {}) {
    const disponible = r.disponible === true && Boolean(r.url);
    const iconName = ICONOS_RECURSO[r.tipo] || "link";

    if (!disponible) {
      return `
        <div class="resource disabled" aria-disabled="true">
          <div class="resource-icon">${iconHtml(iconName)}</div>
          <div class="resource-body">
            <strong>${esc(r.titulo || "Recurso")}</strong>
            <span>${esc(r.descripcion || "")}</span>
            <span class="resource-status">Próximamente</span>
          </div>
        </div>
      `;
    }

    const target = r.abrirEnNuevaPestana ? ' target="_blank" rel="noopener noreferrer"' : "";

    return `
      <a class="resource" href="${esc(r.url)}"${target}>
        <div class="resource-icon">${iconHtml(iconName)}</div>
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

    const label = `${iconHtml("message", "button-icon")}<span>Enviar mensaje</span>`;

    const boton = ayuda.url
      ? `<a class="button-primary" href="${esc(ayuda.url)}">${label}</a>`
      : `<span class="button-primary disabled-button" aria-disabled="true">${label}</span>`;

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

      const situaciones = Array.isArray(data.situacionesProblema)
        ? data.situacionesProblema.map(renderSituacion).join("")
        : "";

      const secciones = (data.secciones || [])
        .map(renderSeccion)
        .join("");

      const recursos = (data.recursos || [])
        .map(resourceHTML)
        .join("");

      content.innerHTML = `
        <section class="indicator-box">
          <div class="indicator-box-head">
            <div class="indicator-box-title">
              ${iconHtml("pin", "heading-icon")}
              <span>Indicadores del trabajo cotidiano</span>
            </div>
            ${data.leccionesSugeridas
              ? `<span class="indicator-lessons">Lecciones sugeridas ${esc(data.leccionesSugeridas)}</span>`
              : ""}
          </div>
          <div class="indicator-box-body">
            <ol class="indicators alpha-list">${indicadores}</ol>
          </div>
        </section>

        ${situaciones}
        ${secciones}

        <section class="panel">
          <div class="panel-heading-row">
            <h2>${iconHtml("toolbox", "heading-icon")}Recursos de la semana</h2>
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
