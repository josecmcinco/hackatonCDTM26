import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from tools import GEMINI_TOOLS_DECLARATIONS
from tools.candidatos_tools import ejecutar_tool
from service.candidatos_service import CandidatosService
from dto import DTO_request_candidato_ideal


def _cargar_env_local():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for p in [os.path.join(base_dir, "..", ".env"), os.path.join(base_dir, "..", "..", ".env"), os.path.abspath(".env")]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            except Exception:
                pass


_cargar_env_local()


class AgenteService:
    """
    Servicio orquestador del agente de IA:
    Ejecuta el bucle de razonamiento de Gemini con Function Calling (Tools)
    para analizar la necesidad del manager, buscar perfiles en DuckDB y
    construir el equipo óptimo fundamentado en evidencias reales.
    """

    SYSTEM_PROMPT = """Eres el Asistente Experto de Staffing y Talent Matching de NTT DATA.
Tu objetivo es analizar la necesidad de proyecto expresada por el usuario (en lenguaje natural o transcrita de audio), encontrar a los mejores profesionales en el dataset de la empresa y proponer un equipo de trabajo complementario.

REGLAS ESTRICTAS DE NTT DATA:
1. Aplica filtros duros obligatorios usando la herramienta 'tool_buscar_candidatos': disponibilidad (por defecto 'En banca' y 'Roll-off próximo (<3 meses)') y años mínimos de experiencia.
2. Reconoce tecnologías equivalentes y relacionadas (ej. Kubernetes <-> Docker/Orquestación, Azure OpenAI <-> RAG/GenAI).
3. Distingue requisitos obligatorios de deseables: si algo es 'no esencial', no debe actuar como filtro excluyente.
4. Complementariedad: si se requieren varios roles para un equipo, asegúrate de que ningún candidato esté repetido en dos posiciones.
5. CERO ALUCINACIÓN: Justifica cada candidato usando datos reales. Puedes usar 'tool_obtener_detalle_candidato' para comprobar proyectos pasados, certificaciones y empresas reales. No inventes experiencia no registrada.

Devuelve tu respuesta estructurada explicando:
- Roles identificados y requisitos extraídos.
- Candidatos recomendados por rol con su grado de ajuste (%), fortalezas, requisitos cubiertos, gaps/riesgos y evidencias literales del perfil.
- Análisis de sinergia y complementariedad del equipo propuesto.
"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        candidatos_service: Optional[CandidatosService] = None
    ):
        _cargar_env_local()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.candidatos_service = candidatos_service or CandidatosService()

    def esta_configurado(self) -> bool:
        _cargar_env_local()
        self.api_key = os.getenv("GEMINI_API_KEY", self.api_key)
        return bool(self.api_key and self.api_key != "tu_gemini_api_key_aqui")

    def procesar_consulta(self, texto_consulta: str) -> Dict[str, Any]:
        """
        Ejecuta el bucle de agente:
        Si Gemini API Key está disponible -> Ejecuta bucle Gemini + Tools.
        Si no está disponible o falla la red -> Usa el servicio heurístico determinista como fallback robusto.
        """
        if not texto_consulta or not texto_consulta.strip():
            raise ValueError("El texto de la consulta está vacío.")

        if not self.esta_configurado():
            # Fallback determinista automático si aún no han pegado la clave en el .env
            return self._procesar_con_fallback_heuristico(texto_consulta)

        try:
            return self._ejecutar_bucle_gemini(texto_consulta)
        except Exception as e:
            # Fallback de seguridad en caso de fallo de red/cuota para no tirar la demo
            fallback_res = self._procesar_con_fallback_heuristico(texto_consulta)
            fallback_res["advertencia_red_gemini"] = f"Se utilizó el motor interno porque la llamada a Gemini falló: {str(e)}"
            return fallback_res

    def _ejecutar_bucle_gemini(self, texto_consulta: str, max_iteraciones: int = 5) -> Dict[str, Any]:
        """
        Bucle de razonamiento iterativo de Gemini con Tool Calling usando la API REST oficial.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        # Preparar historial inicial con system instruction y mensaje del usuario
        contents: List[Dict[str, Any]] = [
            {
                "role": "user",
                "parts": [{"text": f"Necesidad del proyecto:\n\n{texto_consulta}"}]
            }
        ]

        # Estructura de herramientas para la API de Gemini
        tools_payload = [
            {"function_declarations": GEMINI_TOOLS_DECLARATIONS}
        ]

        system_instruction_payload = {
            "parts": [{"text": self.SYSTEM_PROMPT}]
        }

        herramientas_ejecutadas: List[Dict[str, Any]] = []

        for _ in range(max_iteraciones):
            payload = {
                "contents": contents,
                "system_instruction": system_instruction_payload,
                "tools": tools_payload
            }

            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=40) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                err_str = e.read().decode("utf-8", errors="ignore")
                raise RuntimeError(f"Error en Gemini API (HTTP {e.code}): {err_str}")
            except Exception as e:
                raise RuntimeError(f"Error de red con Gemini: {str(e)}")

            candidate = res_json.get("candidates", [{}])[0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])

            # Agregar respuesta del modelo al historial
            contents.append(content)

            # Buscar si el modelo solicitó una llamada a función
            function_calls = [p.get("functionCall") for p in parts if "functionCall" in p]

            if not function_calls:
                # El modelo terminó de razonar y devolvió la respuesta final
                texto_respuesta = "".join([p.get("text", "") for p in parts if "text" in p])
                return {
                    "consulta_original": texto_consulta,
                    "modo": "gemini_agent_loop",
                    "respuesta_agente": texto_respuesta,
                    "herramientas_usadas": herramientas_ejecutadas
                }

            # Si hay function calls, ejecutarlas y agregarlas como functionResponse
            response_parts = []
            for fc in function_calls:
                fn_name = fc.get("name")
                fn_args = fc.get("args", {})

                try:
                    fn_result = ejecutar_tool(fn_name, fn_args)
                except Exception as err:
                    fn_result = {"error": str(err)}

                herramientas_ejecutadas.append({
                    "tool": fn_name,
                    "args": fn_args,
                    "resultado_resumido": f"{len(fn_result)} registros" if isinstance(fn_result, list) else "detalle obtenido"
                })

                response_parts.append({
                    "functionResponse": {
                        "name": fn_name,
                        "response": {"result": fn_result}
                    }
                })

            contents.append({
                "role": "function",
                "parts": response_parts
            })

        # Si llegó al límite de iteraciones
        return {
            "consulta_original": texto_consulta,
            "modo": "gemini_agent_loop_max_turns",
            "respuesta_agente": "Límite de razonamiento alcanzado. Revisa las herramientas ejecutadas.",
            "herramientas_usadas": herramientas_ejecutadas
        }

    def _procesar_con_fallback_heuristico(self, texto_consulta: str) -> Dict[str, Any]:
        """
        Fallback determinista cuando GEMINI_API_KEY no está configurada:
        Infiere palabras clave del texto y ejecuta el motor interno de matching.
        """
        # Detección básica de años y sector del texto libre
        anios = 3
        if "senior" in texto_consulta.lower() or "arquitecto" in texto_consulta.lower() or "architect" in texto_consulta.lower():
            anios = 6
        elif "lead" in texto_consulta.lower():
            anios = 8

        sector = None
        for s in ["Banca y Finanzas", "Retail y Consumo", "Sector Público", "Telecomunicaciones y Media", "Sanidad y Farma"]:
            if any(w in texto_consulta.lower() for w in s.lower().split()):
                sector = s
                break

        # Extraer skills comunes
        skills_detectadas = []
        for sk in ["Azure", "AWS", "Python", "Java", "Docker", "Kubernetes", "Kafka", "React", "Angular", "SQL"]:
            if sk.lower() in texto_consulta.lower():
                skills_detectadas.append(sk)

        # Buscar candidatos con el motor del repositorio
        dto_ideal = DTO_request_candidato_ideal(
            descripcion_necesidad=texto_consulta,
            anios_experiencia_minimos=anios,
            disponibilidad=["En banca", "Roll-off próximo (<3 meses)"],
            sector=sector,
            skills=[{"nombre": s, "nivel_minimo": 3} for s in skills_detectadas],
            top_k=5
        )

        ranking = self.candidatos_service.obtener_ranking_para_candidato_ideal(dto_ideal)

        return {
            "consulta_original": texto_consulta,
            "modo": "fallback_motor_interno (GEMINI_API_KEY no configurada)",
            "parametros_interpretados": {
                "anios_minimos": anios,
                "sector_detectado": sector,
                "skills_detectadas": skills_detectadas
            },
            "candidatos_recomendados": ranking,
            "mensaje": "Para habilitar el razonamiento autónomo continuo de Gemini, añade tu GEMINI_API_KEY en backend/.env."
        }
