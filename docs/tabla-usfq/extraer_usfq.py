"""Extrae la Tabla de composición química de los alimentos (USFQ, 2021) del PDF.

Cada número se asigna a su columna por posición horizontal, usando la fila de
unidades "(Kcal) (g) ... (µg)" de cada página como referencia. Así las celdas
vacías no corren los valores a la columna equivocada.
"""
import csv, json, re, sys
import pdfplumber

PDF, SALIDA = sys.argv[1], sys.argv[2]

COLUMNAS = [
    "energia_kcal", "proteina_g", "grasa_total_g", "carbohidratos_g", "fibra_g",
    "ags_g", "agm_g", "agpi_g", "colesterol_mg", "calcio_mg", "fosforo_mg",
    "hierro_mg", "potasio_mg", "sodio_mg", "zinc_mg", "vitamina_c_mg",
    "vitamina_a_ug", "folatos_ug", "vitamina_b12_ug",
]
FUENTES = {
    "1": "Centroamérica (INCAP 2012)", "2": "USDA FoodData Central 2019",
    "3": "Perú 2017", "4": "Colombia 2015/2018", "5": "Cuenca - Ecuador 2018",
    "6": "Bolivia 2005", "7": "Etiquetado nutricional", "8": "Artículo científico",
    "9": "Receta estandarizada (EuroFIR)",
}
X_FUENTE_MAX, X_ESP_MAX, X_NUM_MIN = 70, 168, 262
NUM = re.compile(r"^-?\d+([.,]\d*)?$")


def es_numero(t):
    return bool(NUM.match(t))


def a_float(t):
    return float(t.replace(",", "."))


def centros_columnas(words):
    """Centros x de las 19 columnas, a partir de la fila de unidades."""
    kcal = next((w for w in words if w["text"] == "(Kcal)"), None)
    if not kcal:
        return None, None
    y = kcal["top"]
    cand = sorted(
        (w for w in words if abs(w["top"] - y) <= 7 and w["x0"] >= X_NUM_MIN - 5
         and w["text"].startswith("(")),
        key=lambda w: w["x0"],
    )
    centros = []
    for w in cand:
        c = (w["x0"] + w["x1"]) / 2
        if not centros or c - centros[-1] > 10:
            centros.append(c)
    return centros, y


def agrupar_lineas(words, tol=2.5):
    lineas = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if lineas and abs(lineas[-1]["top"] - w["top"]) <= tol:
            lineas[-1]["words"].append(w)
        else:
            lineas.append({"top": w["top"], "words": [w]})
    return lineas


def unir_decimales_partidos(ws):
    """'0,' + '37' (decimal partido por un espacio en el PDF) -> '0,37'."""
    out = []
    for w in ws:
        if out and out[-1]["text"].endswith(",") and re.match(r"^\d+$", w["text"]) \
                and w["x0"] - out[-1]["x1"] < 6:
            prev = dict(out[-1])
            prev["text"] += w["text"]
            prev["x1"] = w["x1"]
            out[-1] = prev
        else:
            out.append(w)
    return out


def titulo_grupo(page):
    """Las páginas separadoras solo tienen el nombre del grupo (letra grande)."""
    texto = " ".join(w["text"] for w in page.extract_words() if 40 < w["top"] < 540)
    return re.sub(r"\s+", " ", texto).strip()


alimentos, avisos = [], []
grupo = None
with pdfplumber.open(PDF) as pdf:
    for num_pag, page in enumerate(pdf.pages, start=1):
        words = page.extract_words(x_tolerance=1.5)
        centros, y_header = centros_columnas(words)
        if centros is None:
            # Página separadora de grupo (desde la sección de tablas en adelante)
            if num_pag >= 10:
                t = titulo_grupo(page)
                if t and len(t) < 60:
                    grupo = t
            continue
        if len(centros) != len(COLUMNAS):
            avisos.append(f"pág {num_pag}: {len(centros)} columnas detectadas, se esperaban 19")
            continue

        cuerpo = [w for w in words if y_header + 8 < w["top"] < page.height - 30]
        lineas = agrupar_lineas(cuerpo)

        # Filas ancla: las que traen el código de fuente o valores numéricos
        for ln in lineas:
            ln["words"] = unir_decimales_partidos(sorted(ln["words"], key=lambda w: w["x0"]))
            nums = [w for w in ln["words"] if w["x0"] >= X_NUM_MIN and es_numero(w["text"])]
            tiene_fuente = any(w["x1"] <= X_FUENTE_MAX and w["text"].isdigit() for w in ln["words"])
            ln["ancla"] = tiene_fuente or len(nums) >= 3

        # Los nombres largos ocupan varias líneas, arriba y abajo de la fila
        # numérica. Dentro de un alimento las líneas van a ~4-5 px; entre
        # alimentos hay ~10 px: se agrupan en bloques por ese espacio
        bloques = []
        for ln in lineas:
            if bloques and ln["top"] - bloques[-1][-1]["top"] <= 7.5:
                bloques[-1].append(ln)
            else:
                bloques.append([ln])

        anclas, huerfanos = [], []
        for bloque in bloques:
            propias = [ln for ln in bloque if ln["ancla"]]
            if not propias:
                huerfanos.append(bloque)
                continue
            for ln in propias:
                anclas.append({"top": ln["top"], "words": ln["words"], "extra": []})
            # Si un bloque tuviera dos alimentos pegados, cada línea va al más cercano
            for ln in bloque:
                if ln["ancla"]:
                    continue
                a = min(anclas[-len(propias):], key=lambda a: abs(a["top"] - ln["top"]))
                a["extra"].append(ln)
            if len(propias) > 1:
                avisos.append(f"pág {num_pag}: bloque con {len(propias)} alimentos (revisar nombres)")

        # En nombres de 3 líneas la fila numérica queda un poco más separada de
        # la primera y la última línea: esas líneas sueltas van a la fila más
        # cercana. Las que quedan lejos son subtítulos de la tabla
        for bloque in huerfanos:
            for ln in bloque:
                a = min(anclas, key=lambda a: abs(a["top"] - ln["top"])) if anclas else None
                if a and abs(a["top"] - ln["top"]) < 14:
                    a["extra"].append(ln)
                else:
                    avisos.append(f"pág {num_pag}: subtítulo (ignorado): "
                                  + " ".join(w["text"] for w in ln["words"]))

        for a in anclas:
            todas = [(a["top"], w) for w in a["words"]] + \
                    [(ln["top"], w) for ln in a["extra"] for w in ln["words"]]
            todas.sort(key=lambda t: (t[0], t[1]["x0"]))
            fuente = [w["text"] for _, w in todas if w["x1"] <= X_FUENTE_MAX and w["text"].isdigit()]
            esp = " ".join(w["text"] for _, w in todas if X_FUENTE_MAX < w["x0"] < X_ESP_MAX)
            ing = " ".join(w["text"] for _, w in todas
                           if X_ESP_MAX <= w["x0"] < X_NUM_MIN and not (w["x0"] >= X_NUM_MIN - 6 and es_numero(w["text"])))

            valores = {c: None for c in COLUMNAS}
            for w in a["words"]:
                if w["x1"] < X_NUM_MIN or not es_numero(w["text"]):
                    continue
                c = (w["x0"] + w["x1"]) / 2
                i = min(range(len(centros)), key=lambda k: abs(centros[k] - c))
                if abs(centros[i] - c) > 13:
                    avisos.append(f"pág {num_pag} '{esp}': valor {w['text']} lejos de toda columna")
                    continue
                if valores[COLUMNAS[i]] is not None:
                    avisos.append(f"pág {num_pag} '{esp}': dos valores en {COLUMNAS[i]}")
                valores[COLUMNAS[i]] = a_float(w["text"])

            alimentos.append({
                "grupo": grupo,
                "nombre": re.sub(r"\s+", " ", esp).strip(" ,"),
                "nombre_ingles": re.sub(r"\s+", " ", ing).strip(" ,"),
                "fuente": FUENTES.get(fuente[0]) if fuente else None,
                "codigo_fuente": int(fuente[0]) if fuente else None,
                "pagina_pdf": num_pag,
                **valores,
            })

# Control de calidad: energía declarada vs 4P + 4C + 9G (regla usada por la tabla)
for al in alimentos:
    p, c, g, e = (al[k] for k in ("proteina_g", "carbohidratos_g", "grasa_total_g", "energia_kcal"))
    if None in (p, c, g, e) or e == 0:
        al["control_energia"] = "sin_datos"
        continue
    calc = 4 * p + 4 * c + 9 * g
    al["control_energia"] = "ok" if abs(calc - e) <= max(3, 0.03 * e) else f"revisar ({calc:.1f} vs {e})"

with open(SALIDA + ".json", "w", encoding="utf-8") as f:
    json.dump(alimentos, f, ensure_ascii=False, indent=1)
with open(SALIDA + ".csv", "w", encoding="utf-8-sig", newline="") as f:
    wr = csv.DictWriter(f, fieldnames=list(alimentos[0].keys()))
    wr.writeheader()
    wr.writerows(alimentos)
with open(SALIDA + "_avisos.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(avisos))

ok = sum(a["control_energia"] == "ok" for a in alimentos)
rev = sum(a["control_energia"].startswith("revisar") for a in alimentos)
print(f"alimentos: {len(alimentos)} | energía ok: {ok} | revisar: {rev} | sin datos: {len(alimentos)-ok-rev} | avisos: {len(avisos)}")
print("grupos:", sorted({a['grupo'] for a in alimentos}, key=str))
