# Blogger_CINDEA

Base técnica para el portal de Matemática del CINDEA Aserrí.

## Publicación
GitHub Pages debe configurarse así:

- Branch: `main`
- Folder: `/docs`

## Estructura
- `docs/`: sitio público.
- `docs/assets/`: CSS y JavaScript compartidos.
- `docs/data/modulos.json`: catálogo general de módulos y semanas.
- `docs/modulos/<modulo>/semana-XX/contenido.json`: contenido de cada semana.
- `docs/modulos/<modulo>/semana-XX/practica/`: exportación HTML de eXeLearning.

## Flujo de trabajo
1. Agregar/editar una semana.
2. Actualizar `docs/data/modulos.json`.
3. Subir recursos de la semana.
4. GitHub Pages publica los cambios automáticamente al hacer commit.
