# CV – fuente editable

`cv-santiago-lafuente.html` es la fuente del CV (A4, una página). Las imágenes están en `assets/`
(foto de perfil y QR de LinkedIn). Esta carpeta **no** se sirve en la web: lo que se publica es
`public/cv/cv-santiago-lafuente.pdf`.

## Regenerar el PDF

1. Edita `cv/cv-santiago-lafuente.html` (el contenido está en HTML plano; los colores y tamaños, en el `<style>`).
2. Desde la raíz del repo, en Git Bash (necesita conexión para cargar Montserrat y Source Sans 3 de Google Fonts):

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf="$(pwd -W)/public/cv/cv-santiago-lafuente.pdf" \
  "file:///$(pwd -W)/cv/cv-santiago-lafuente.html"
```

   En PowerShell:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
  --no-pdf-header-footer --virtual-time-budget=10000 `
  --print-to-pdf="$PWD\public\cv\cv-santiago-lafuente.pdf" `
  "file:///$($PWD -replace '\\','/')/cv/cv-santiago-lafuente.html"
```

   **Las rutas tienen que ser absolutas.** Chrome headless no resuelve `--print-to-pdf` respecto a
   la carpeta actual: con una ruta relativa (`public/cv/...`) falla con `Failed to write file`. Por
   eso se construyen a partir de `$(pwd -W)` (Git Bash, devuelve `C:/Users/...`) o `$PWD` (PowerShell).

3. Comprueba que sigue ocupando **una sola página** (si añades contenido y se desborda, la parte
   inferior se recorta: ajusta los márgenes de `.main h2` / `.entry` en el CSS).
4. Haz commit y push: Render despliega el PDF nuevo automáticamente.
