# -*- coding: utf-8 -*-
"""
Limpieza y normalización de CaseContext/profiles.parquet -> dataAnalysis/Procesado/profiles_procesado.parquet

Uso:  python limpieza.py <entrada.parquet> <salida.parquet>

Principios:
- No se borra información: cada valor normalizado conserva su original (campo *_original) cuando cambia.
- Las columnas originales mantienen nombre y formato (el backend actual sigue funcionando);
  los filtros duros (anios_experiencia, disponibilidad) NO se modifican.
- Lo que no aparece no se asume (no se inventan skills/certificaciones).
"""
import sys, re, unicodedata, collections
import pandas as pd
import pyarrow as pa, pyarrow.parquet as pq
from diccionarios import *

FECHA_REF = pd.Timestamp("2026-11-21")
PRE_SEN = re.compile(r"^(Trainee|Junior|Senior|Lead|Principal) ")


def sin_acentos(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


def clean_str(s):
    if s is None:
        return None
    s = unicodedata.normalize("NFC", str(s)).replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def canon_skill(name):
    """-> lista de nombres canónicos (1 normalmente, >1 si es compuesta)."""
    n = clean_str(name)
    if n in SKILL_EXPANSION:
        return SKILL_EXPANSION[n]
    return [SKILL_SINONIMOS.get(n, n)]


def canon_techs(lst):
    out = []
    for t in lst:
        for c in canon_skill(t):
            if c not in out:
                out.append(c)
    return out


def split_rol(r):
    r = clean_str(r)
    m = PRE_SEN.match(r)
    sen = m.group(1) if m else "Mid"
    return sen, PRE_SEN.sub("", r)


def anio_date(s):
    return FECHA_REF if s == "Actual" else pd.Timestamp(s)


def main(src, dst):
    df = pd.read_parquet(src)
    n0 = len(df)
    stats = collections.Counter()

    # ---------------- strings planos ----------------
    for c in ["nombre", "apellidos", "nombre_completo", "email", "pais", "ciudad", "area", "rol", "nivel_seniority",
              "puesto_actual", "sector_principal", "disponibilidad", "modalidad_trabajo", "resumen", "skills_texto"]:
        new = df[c].map(clean_str)
        stats[f"strings_limpiados_{c}"] = int((new != df[c]).sum())
        df[c] = new
    df["email"] = df["email"].str.lower()

    # mapa ciudad -> país (para ubicaciones de experiencia)
    ciudad_pais = df.groupby("ciudad")["pais"].agg(lambda s: s.mode()[0]).to_dict()
    rol_area = df.groupby("rol")["area"].agg(lambda s: s.mode()[0]).to_dict()
    rol_area.update(ROL_AREA_EXTRA)

    # ---------------- identidad / ubicación / estado ----------------
    df["pais_iso"] = df.pais.map(lambda p: PAISES.get(p, (None,))[0])
    df["pais_en"] = df.pais.map(lambda p: PAISES.get(p, (None, None))[1])
    df["region"] = df.pais.map(lambda p: PAISES.get(p, (None, None, None))[2])
    df["seniority_nivel"] = df.nivel_seniority.map(SENIORITY_ORD).astype("int8")
    df["rol_es"] = df.rol.map(lambda r: ROLES.get(r, (r, []))[0])
    df["rol_alias"] = df.rol.map(lambda r: ROLES.get(r, (r, []))[1])
    df["sector_codigo"] = df.sector_principal.map(lambda s: SECTORES[s][0])
    df["sector_en"] = df.sector_principal.map(lambda s: SECTORES[s][1])
    df["disponibilidad_codigo"] = df.disponibilidad.map(DISPONIBILIDAD)
    df["disponible_inmediato"] = df.disponibilidad_codigo.eq("en_banca")
    df["disponible_3_meses"] = df.disponibilidad_codigo.isin(["en_banca", "roll_off_3m"])
    df["modalidad_codigo"] = df.modalidad_trabajo.map(MODALIDAD)
    df["fecha_incorporacion"] = pd.to_datetime(df.fecha_incorporacion).dt.date
    assert df.disponibilidad_codigo.notna().all() and df.modalidad_codigo.notna().all()

    # ---------------- SKILLS ----------------
    nuevas_skills, flags_sk = [], []
    for sk in df.skills:
        merged = {}
        for s in sk:
            orig = clean_str(s["skill"])
            for c in canon_skill(orig):
                prev = merged.get(c)
                cand = {"skill": c, "nivel": int(s["nivel"]), "anios": float(s["anios"]),
                        "skill_original": orig if orig != c else None}
                if prev is None:
                    merged[c] = cand
                else:  # sinónimo duplicado en el mismo perfil -> se queda el de mayor nivel/años
                    stats["skills_duplicadas_fusionadas"] += 1
                    prev["nivel"] = max(prev["nivel"], cand["nivel"])
                    prev["anios"] = max(prev["anios"], cand["anios"])
                    prev["skill_original"] = "; ".join(x for x in [prev["skill_original"] or prev["skill"], orig] if x)
                if orig != c:
                    stats["skills_renombradas"] += 1
        nuevas_skills.append(list(merged.values()))
    df["skills"] = nuevas_skills

    # experiencia y proyectos (tecnologías canónicas) + evidencia
    nuevas_exp, nuevas_proy = [], []
    flag_everis, anios_real = [], []
    sectores_exp, tipos_proy = [], []
    for idx, (exp, proy, sp) in enumerate(zip(df.experiencia, df.proyectos, df.sector_principal)):
        ex_out, intervals, everis = [], [], False
        sect = collections.Counter({sp: 0})
        for e in exp:
            sen, base = split_rol(e["puesto"])
            emp = clean_str(e["empresa"])
            tipo, sector_emp, grupo = EMPRESAS.get(emp, (None, None, None))
            ini, fin = anio_date(e["inicio"]), anio_date(e["fin"])
            intervals.append((ini, fin))
            ubic = clean_str(e["ubicacion"])
            es_grupo_ntt = grupo == "NTT DATA"
            if emp == "Everis":
                everis = True
            if sector_emp:
                sect[sector_emp] += 0  # se cuenta como sector conocido
            ex_out.append({
                "empresa": emp, "puesto": clean_str(e["puesto"]), "puesto_rol_base": base, "puesto_seniority": sen,
                "inicio": e["inicio"], "fin": e["fin"], "actual": e["fin"] == "Actual",
                "duracion_anios": round((fin - ini).days / 365.25, 2),
                "ubicacion": ubic, "ubicacion_pais": ciudad_pais.get(ubic),
                "tecnologias": canon_techs(e["tecnologias"]), "es_ntt": bool(e["es_ntt"]),
                "es_grupo_ntt": es_grupo_ntt, "tipo_empresa": tipo, "sector_empresa": sector_emp, "grupo_empresa": grupo,
            })
        # años reales a partir de la línea temporal (unión de intervalos, sin solapes)
        intervals.sort()
        tot, cur_s, cur_e = 0.0, None, None
        for s_, e_ in intervals:
            if cur_e is None or s_ > cur_e:
                if cur_e is not None:
                    tot += (cur_e - cur_s).days
                cur_s, cur_e = s_, e_
            else:
                cur_e = max(cur_e, e_)
        if cur_e is not None:
            tot += (cur_e - cur_s).days
        anios_real.append(round(tot / 365.25, 1))
        flag_everis.append(everis)
        nuevas_exp.append(ex_out)

        pr_out, tp = [], []
        for p in proy:
            nombre = clean_str(p["nombre"])
            fixed = re.sub(r"\b(\w+) de \1 de\b", r"\1 de", nombre)  # "plataforma de plataforma de" -> "plataforma de"
            if fixed != nombre:
                stats["nombres_proyecto_corregidos"] += 1
            tipo, dominio = None, None
            for pref, t in PROYECTO_TIPOS:
                if nombre.startswith(pref):
                    tipo, dominio = t, nombre[len(pref):]
                    break
            sen, base = split_rol(p["rol"])
            dom_sector = DOMINIO_SECTOR.get(dominio)
            cs = clean_str(p["cliente_sector"])
            if dom_sector and dom_sector != cs:
                stats["proyectos_dominio_de_otro_sector (p.ej. sanidad pública)"] += 1
            sect[cs] += 1
            tp.append(tipo)
            pr_out.append({
                "nombre": fixed, "nombre_original": nombre if fixed != nombre else None,
                "tipo_proyecto": tipo, "dominio_funcional": dominio, "sector_dominio": dom_sector,
                "cliente_sector": cs, "cliente_sector_codigo": SECTORES[cs][0], "anio": int(p["anio"]),
                "rol": clean_str(p["rol"]), "rol_base": base, "rol_seniority": sen,
                "tecnologias": canon_techs(p["tecnologias"]),
            })
        nuevas_proy.append(pr_out)
        tipos_proy.append(sorted({t for t in tp if t}))
        sectores_exp.append(sect)
    df["experiencia"] = nuevas_exp
    df["proyectos"] = nuevas_proy
    df["anios_experiencia_real"] = anios_real
    df["trabajo_previo_everis"] = flag_everis
    df["tipos_proyecto"] = tipos_proy
    df["dominios_funcionales"] = [sorted({p["dominio_funcional"] for p in pr if p["dominio_funcional"]}) for pr in nuevas_proy]

    # experiencia sectorial (sector principal + sectores de proyectos + sector de empresas anteriores)
    exp_sect_list, sect_names = [], []
    for sect, exp, proy in zip(sectores_exp, df.experiencia, df.proyectos):
        for e in exp:
            if e["sector_empresa"]:
                sect[e["sector_empresa"]] += 0
        ult = {}
        for p in proy:
            ult[p["cliente_sector"]] = max(ult.get(p["cliente_sector"], 0), p["anio"])
        items = [{"sector": s, "sector_codigo": SECTORES[s][0], "n_proyectos": int(n), "ultimo_anio_proyecto": ult.get(s)}
                 for s, n in sorted(sect.items(), key=lambda x: -x[1])]
        exp_sect_list.append(items)
        sect_names.append([i["sector"] for i in items])
    df["experiencia_sectorial"] = exp_sect_list
    df["sectores_experiencia"] = sect_names

    # evidencia de cada skill en proyectos/experiencia + categoría dominante de la skill
    skill_area = collections.defaultdict(collections.Counter)
    for area, sk in zip(df.area, df.skills):
        for s in sk:
            skill_area[s["skill"]][area] += 1
    skill_meta = {}
    for k, c in skill_area.items():
        a, n = c.most_common(1)[0]
        skill_meta[k] = (a, n / sum(c.values()) < 0.5)  # (área dominante, transversal?)

    sk_final, sk_txt, sk_amp, sk_lista, sk_evid = [], [], [], [], []
    for sk, exp, proy in zip(df.skills, df.experiencia, df.proyectos):
        usos = collections.Counter()
        for p in proy:
            usos.update(set(p["tecnologias"]))
        for e in exp:
            usos.update(set(e["tecnologias"]))
        out = []
        for s in sk:
            a, trans = skill_meta[s["skill"]]
            out.append({**s, "area_skill": a, "skill_transversal": trans, "alias": SKILL_ALIAS.get(s["skill"], []),
                        "evidencias": int(usos.get(s["skill"], 0))})
        sk_final.append(out)
        names = [s["skill"] for s in out]
        sk_lista.append(names)
        sk_txt.append(", ".join(names))
        amp = []
        for s in out:
            for x in [s["skill"]] + s["alias"]:
                if x not in amp:
                    amp.append(x)
        sk_amp.append(", ".join(amp))
        sk_evid.append([s["skill"] for s in out if s["evidencias"] > 0])
    df["skills"] = sk_final
    df["skills_lista"] = sk_lista
    df["skills_texto"] = sk_txt
    df["skills_texto_ampliado"] = sk_amp
    df["skills_con_evidencia"] = sk_evid
    tecs = []
    for exp, proy in zip(df.experiencia, df.proyectos):
        t = []
        for x in list(exp) + list(proy):
            for y in x["tecnologias"]:
                if y not in t:
                    t.append(y)
        tecs.append(t)
    df["tecnologias_usadas"] = tecs

    # ---------------- metodologías / habilidades blandas ----------------
    df["metodologias"] = df.metodologias.map(lambda a: list(dict.fromkeys(clean_str(x) for x in a)))
    df["metodologias_familia"] = df.metodologias.map(lambda a: sorted({METODOLOGIA_FAMILIA.get(x, "Otra") for x in a}))
    df["habilidades_blandas"] = df.habilidades_blandas.map(lambda a: list(dict.fromkeys(clean_str(x) for x in a)))
    df["habilidades_blandas_en"] = df.habilidades_blandas.map(lambda a: [HABILIDADES_BLANDAS_EN.get(x, x) for x in a])

    # ---------------- IDIOMAS ----------------
    id_out, ing_txt, ing_num, id_lista = [], [], [], []
    for a in df.idiomas:
        best = {}
        for x in a:
            orig = clean_str(x["idioma"])
            nombre = IDIOMA_SINONIMOS.get(orig, orig)
            nivel = clean_str(x["nivel"]).upper().replace("NATIVO", "Nativo")
            num = NIVEL_IDIOMA[nivel]
            iso, en = IDIOMAS[nombre]
            cand = {"idioma": nombre, "nivel": nivel, "nivel_num": num, "idioma_iso": iso, "idioma_en": en,
                    "variante": orig if orig != nombre else None}
            if nombre in best:
                stats["idiomas_duplicados_fusionados"] += 1
                if num > best[nombre]["nivel_num"]:
                    cand["variante"] = cand["variante"] or best[nombre]["variante"]
                    best[nombre] = cand
            else:
                best[nombre] = cand
            if orig != nombre:
                stats["idiomas_sinonimo_unificado"] += 1
        lst = sorted(best.values(), key=lambda d: -d["nivel_num"])
        id_out.append(lst)
        en_ = best.get("Inglés")
        ing_txt.append(en_["nivel"] if en_ else None)
        ing_num.append(en_["nivel_num"] if en_ else 0)
        id_lista.append([d["idioma"] for d in lst])
    df["idiomas"] = id_out
    df["nivel_ingles"] = ing_txt
    df["nivel_ingles_num"] = pd.Series(ing_num, dtype="int8")
    df["idiomas_lista"] = id_lista

    # ---------------- CERTIFICACIONES ----------------
    def cert_info(nombre):
        canon = CERT_RENOMBRE.get(nombre, nombre).replace("–", "-")
        low = canon.lower() + " "
        prov = next((p for k, p in CERT_PROVEEDORES if k in low), "Otro")
        area = next((a for k, a in CERT_AREA if k in low), "Otro")
        m = re.search(r"\b([A-Z]{2,3}-\d{3})\b", canon) or re.search(r"\((CKA|CKS|PSM I|PSPO I|RHCSA|SFPC)\)", canon) \
            or re.match(r"^(CBAP|CCXP|CISA|CISM|CISSP|CRISC|OSCP|PMP|PgMP|PMI-ACP|SABSA|IIBA-ECBA|eJPT)\b", canon)
        return canon, prov, area, (m.group(1) if m else None)

    cert_cache = {}
    ce_out, ce_lista = [], []
    for a in df.certificaciones:
        best = {}
        for x in a:
            orig = clean_str(x["nombre"])
            if orig not in cert_cache:
                cert_cache[orig] = cert_info(orig)
            canon, prov, area, cod = cert_cache[orig]
            d = {"nombre": canon, "anio": int(x["anio"]), "proveedor": prov, "codigo": cod, "area_certificacion": area,
                 "nombre_original": orig if orig != canon else None}
            if canon in best:
                stats["certificaciones_duplicadas_fusionadas"] += 1
                if d["anio"] > best[canon]["anio"]:
                    best[canon] = d
            else:
                best[canon] = d
        lst = sorted(best.values(), key=lambda d: -d["anio"])
        ce_out.append(lst)
        ce_lista.append([d["nombre"] for d in lst])
    df["certificaciones"] = ce_out
    df["certificaciones_lista"] = ce_lista
    df["n_certificaciones"] = df.certificaciones_lista.map(len).astype("int16")

    # ---------------- ESTUDIOS ----------------
    es_out, es_max, es_disc = [], [], []
    for a in df.estudios:
        out = []
        for x in a:
            nivel, nnum = NIVEL_ESTUDIOS[clean_str(x["nivel"])]
            tit = clean_str(x["titulo"])
            low = tit.lower()
            disc, stem = next(((d, s) for k, d, s in DISCIPLINAS if k in low), ("Otra", False))
            inst = clean_str(x["institucion"])
            m = re.match(r"^(.*) \(([^)]+)\)$", inst)
            inst_nombre, inst_ciudad = (m.group(1), m.group(2)) if m and inst.startswith("IES ") else (inst, None)
            tipo_inst = ("Centro de FP" if inst.startswith("IES ") else "Escuela de negocios" if inst in ESCUELAS_NEGOCIO
                         else "Universidad online" if inst in UNIV_ONLINE else "Universidad")
            out.append({"nivel": nivel, "nivel_num": nnum, "titulo": tit, "disciplina": disc, "es_stem": stem,
                        "institucion": inst, "institucion_nombre": inst_nombre, "institucion_ciudad": inst_ciudad,
                        "tipo_institucion": tipo_inst, "anio_inicio": int(x["anio_inicio"]), "anio_fin": int(x["anio_fin"]),
                        "en_curso": int(x["anio_fin"]) >= FECHA_REF.year})
        out.sort(key=lambda d: -d["anio_fin"])
        es_out.append(out)
        es_max.append(max(out, key=lambda d: d["nivel_num"])["nivel"] if out else None)
        es_disc.append(sorted({d["disciplina"] for d in out}))
    df["estudios"] = es_out
    df["nivel_estudios_max"] = es_max
    df["disciplinas_estudios"] = es_disc

    # ---------------- flags de calidad ----------------
    flags = []
    for i, r in enumerate(df.itertuples(index=False)):
        f = []
        if r.anios_en_ntt > r.anios_experiencia + 0.5:
            f.append("anios_experiencia_redondeado_por_debajo_de_anios_en_ntt")
        if any(p["nombre_original"] for p in r.proyectos):
            f.append("nombre_proyecto_corregido")
        if any(s["skill_original"] for s in r.skills):
            f.append("skills_normalizadas")
        if any(d["variante"] for d in r.idiomas):
            f.append("idioma_variante_unificada")
        flags.append(f)
    df["calidad_flags"] = flags

    # ---------------- texto de búsqueda normalizado ----------------
    def txt(r):
        parts = [r.rol, r.rol_es, " ".join(r.rol_alias), r.puesto_actual, r.area, r.nivel_seniority, r.sector_principal,
                 " ".join(r.sectores_experiencia), r.skills_texto_ampliado, " ".join(r.tecnologias_usadas),
                 " ".join(r.metodologias), " ".join(r.habilidades_blandas), " ".join(r.certificaciones_lista),
                 " ".join(f"{d['idioma']} {d['nivel']}" for d in r.idiomas),
                 " ".join(p["nombre"] for p in r.proyectos), r.pais, r.ciudad]
        return re.sub(r"\s+", " ", sin_acentos(" | ".join(p for p in parts if p))).strip()
    df["texto_busqueda"] = [txt(r) for r in df.itertuples(index=False)]

    # ---------------- orden de columnas y escritura ----------------
    orig_cols = ["employee_id", "nombre", "apellidos", "nombre_completo", "email", "pais", "ciudad", "area", "rol",
                 "nivel_seniority", "puesto_actual", "anios_experiencia", "anios_en_ntt", "fecha_incorporacion",
                 "sector_principal", "disponibilidad", "modalidad_trabajo", "movilidad_internacional", "skills",
                 "skills_texto", "metodologias", "habilidades_blandas", "estudios", "certificaciones", "experiencia",
                 "proyectos", "idiomas", "resumen"]
    new_cols = [c for c in df.columns if c not in orig_cols]
    df = df[orig_cols + new_cols]
    assert len(df) == n0 and df.employee_id.is_unique
    table = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(table, dst, compression="zstd", compression_level=15, row_group_size=50_000)
    return df, stats


if __name__ == "__main__":
    df, stats = main(sys.argv[1], sys.argv[2])
    print(df.shape)
    for k, v in sorted(stats.items()):
        if v:
            print(f"{k}: {v}")
