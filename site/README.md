# YouBox.Fit · Web pitch (IAT ODISSEA Ceuta)

Presentación de 6 diapositivas como página web estática (HTML + CSS + JS vanilla, sin build).

## Abrir

- **Doble clic** en `index.html` (funciona en `file://`, sin servidor).
- O servir localmente:

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000/#1
```

## Controles

| Acción | Tecla / gesto |
| --- | --- |
| Siguiente / anterior | `→` `←` `espacio` `PgDn` `PgUp` · clic en los laterales · swipe |
| Ir a la diapositiva N | `1`–`6` · `Home` / `End` · URL `#1`…`#6` |
| Modo presentador (notas + cronómetro 4:00) | `P` |
| Pantalla completa | `F` |
| Reiniciar cronómetro | `R` |
| Cerrar panel de notas | `Esc` |

## Estructura

```
site/
├── index.html   # 6 slides + footer institucional + notas del ponente (JSON inline)
├── styles.css   # tokens del blueprint 1920×1080, escalado 16:9, modo fluido < 900 px
├── app.js       # navegación, hash, dots, presentador, cronómetro, placeholders
└── assets/      # WebP + odissea-feder.svg (placeholder institucional)
```

El escenario de diseño es 1920×1080 y se escala al viewport con `transform: scale()`;
por debajo de 900 px las columnas se apilan y la tipografía usa `clamp()`.
Si falta un asset, se muestra un recuadro con el nombre del fichero esperado.
