// respuestas offline (fallback cuando no hay API)
import type { FileAttachment } from '../types';
import { analyzeFiles } from './analyzer';

type Intent = 'code_request' | 'conversation';

const CODE_PATTERNS: RegExp[] = [
  /\b(dame|genera|crea|creame|escribe|hazme|haz)\b.*(código|codigo|script|programa|función|funcion|componente|app|api|clase)/i,
  /\b(código|codigo|script|programa|implementa|desarrolla|codifica)\b.*(de|para|que|con|en)\b/i,
  /\b(necesito|quiero)\b.*(código|codigo|script|programa|función|funcion|componente)/i,
  /\b(programa|codifica|implementa|desarrolla|construye)\b.*(un|una|el|la)\b/i,
  /\b(create|generate|write|build|make|code|develop|implement)\b.*(code|script|function|component|app|api)/i,
  /^(crea|genera|codifica|programa|implementa|desarrolla|escribe|haz|construye)\b/i,
  /^(create|generate|code|program|implement|develop|write|build|make)\b/i,
];

const CHAT_PATTERNS: RegExp[] = [
  /^(hola|hey|buenas|hi|hello|que tal|qué tal|saludos)\b/i,
  /\b(gracias|thanks|genial|perfecto|excelente|ok|vale|bien|entiendo|claro)\b/i,
  /\b(qué es|que es|qué son|explica|explicame|explícame|define)\b/i,
  /\b(opinas|piensas|crees|recomiendas|sugieres)\b/i,
  /\b(cuéntame|háblame|dime)\b.*(sobre|acerca|de)\b/i,
  /\b(ayuda|help|puedes|qué haces|que haces)\b/i,
];

function detectIntent(msg: string): Intent {
  const clean = msg.trim().toLowerCase();
  for (const p of CHAT_PATTERNS) {
    if (p.test(clean)) {
      for (const cp of CODE_PATTERNS) {
        if (cp.test(clean)) return 'code_request';
      }
      return 'conversation';
    }
  }
  for (const p of CODE_PATTERNS) {
    if (p.test(clean)) return 'code_request';
  }
  return 'conversation';
}

interface TopicEntry {
  patterns: RegExp[];
  conversational: string[];
  withCode: string[];
}

const topics: TopicEntry[] = [
  {
    patterns: [/^(hola|hey|buenas|buenos|saludos|hi|hello|que tal|qué tal)\b/i],
    conversational: [
      'Hola, bienvenido. Soy VORTEX.\n\nPuedo ayudarte con lo que necesites: resolver dudas, explicar conceptos, analizar archivos, o generar código. Solo pregúntame.\n\n¿En qué puedo ayudarte?',
      'Hey, ¿qué tal? Soy VORTEX.\n\nEstoy aquí para lo que necesites. Puedo conversar sobre tecnología, resolver dudas o ayudarte con código.\n\n¿Qué tienes en mente?',
    ],
    withCode: [],
  },
  {
    patterns: [/ayuda|help|puedes|qué haces|que haces|funciones|capacidades|qué eres|que eres/i],
    conversational: [
      'Soy VORTEX, un asistente de IA.\n\nLo que puedo hacer:\n\n1. Responder preguntas sobre cualquier tema técnico.\n2. Explicar conceptos de forma clara.\n3. Analizar archivos (imágenes, PDFs, ZIPs, código, CSV, JSON).\n4. Generar código cuando lo pidas.\n\nEn cada respuesta mía tienes botones para copiar, regenerar o borrar.\n\n¿Qué necesitas?',
    ],
    withCode: [],
  },
  {
    patterns: [/react|componente|hook|useState|useEffect|jsx|tsx/i],
    conversational: [
      'React es una biblioteca de JavaScript para construir interfaces de usuario. Fue creada por Facebook y es la más popular en frontend.\n\nConceptos clave:\n\n1. Componentes: piezas reutilizables de la interfaz.\n2. JSX: sintaxis que combina JavaScript con HTML.\n3. Estado (State): datos que cambian y actualizan la UI.\n4. Props: datos que pasan de padre a hijo.\n5. Hooks: funciones como useState y useEffect para manejar estado y efectos.\n6. Virtual DOM: React solo actualiza lo que cambió en pantalla.\n\n¿Tienes alguna duda sobre React? Si necesitas código, solo pídelo.',
    ],
    withCode: [
      'Aquí tienes un ejemplo de componente React:\n\n```tsx\nimport { useState, useEffect } from \'react\';\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nexport function UserList() {\n  const [users, setUsers] = useState<User[]>([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch(\'/api/users\')\n      .then(res => res.json())\n      .then(data => setUsers(data))\n      .catch(err => console.error(err))\n      .finally(() => setLoading(false));\n  }, []);\n\n  if (loading) return <p>Cargando...</p>;\n\n  return (\n    <ul>\n      {users.map(user => (\n        <li key={user.id}>{user.name} - {user.email}</li>\n      ))}\n    </ul>\n  );\n}\n```\n\n¿Necesitas algo más?',
    ],
  },
  {
    patterns: [/javascript|js|typescript|ts|node|npm/i],
    conversational: [
      'JavaScript es el lenguaje más usado del mundo. Corre en navegadores, servidores (Node.js) y mobile.\n\nTypeScript le agrega tipos estáticos, lo que ayuda a detectar errores antes de ejecutar.\n\nConceptos importantes:\n\n1. Asincronía: Promises y async/await.\n2. Closures: funciones que recuerdan su scope.\n3. Destructuring: extraer valores de objetos y arrays.\n4. Módulos: import/export para organizar código.\n5. Event Loop: cómo JS maneja operaciones asíncronas.\n\n¿Qué aspecto te interesa? Si quieres código, dime.',
    ],
    withCode: [
      'Ejemplo de TypeScript:\n\n```typescript\nasync function fetchWithRetry<T>(\n  url: string,\n  retries = 3,\n  delay = 1000\n): Promise<T> {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url);\n      if (!res.ok) throw new Error(`HTTP ${res.status}`);\n      return await res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(r => setTimeout(r, delay * (i + 1)));\n    }\n  }\n  throw new Error(\'Unreachable\');\n}\n```\n\n¿Quieres ver algo más?',
    ],
  },
  {
    patterns: [/python|django|flask|fastapi|pandas|numpy/i],
    conversational: [
      'Python es muy versátil y fácil de aprender. Es el más usado en ciencia de datos e IA.\n\nFrameworks principales:\n\n1. Django: todo incluido para web.\n2. FastAPI: moderno y rápido, con tipado.\n3. Flask: minimalista y flexible.\n\nPara datos: Pandas, NumPy, Scikit-learn.\nPara IA: PyTorch, TensorFlow.\n\n¿Qué aspecto de Python te interesa?',
    ],
    withCode: [
      'Ejemplo en Python:\n\n```python\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass User(BaseModel):\n    name: str\n    email: str\n\nusers_db: dict[int, User] = {}\n\n@app.post("/users/{user_id}")\nasync def create_user(user_id: int, user: User):\n    if user_id in users_db:\n        raise HTTPException(400, "Ya existe")\n    users_db[user_id] = user\n    return {"msg": "Creado", "user": user}\n\n@app.get("/users/{user_id}")\nasync def get_user(user_id: int):\n    if user_id not in users_db:\n        raise HTTPException(404, "No encontrado")\n    return users_db[user_id]\n```\n\n¿Algo más?',
    ],
  },
  {
    patterns: [/seguridad|security|hack|hacking|pentest|vulnerabil|ciberseguridad/i],
    conversational: [
      'La ciberseguridad es un campo cada vez más importante.\n\nRamas principales:\n\n1. Pentesting: simular ataques para encontrar vulnerabilidades.\n2. Blue Team: defender sistemas y responder a incidentes.\n3. Red Team: ataques avanzados para evaluar seguridad.\n4. AppSec: seguridad en desarrollo de software.\n5. Forense: investigar incidentes y analizar malware.\n\nOWASP Top 10 es la referencia para vulnerabilidades web.\n\n¿Qué área te interesa?',
    ],
    withCode: [
      'Ejemplo de seguridad en código:\n\n```python\n# Prevencion de SQL Injection\nimport sqlite3\n\n# MAL - vulnerable:\nquery = f"SELECT * FROM users WHERE name = \'{user_input}\'"\n\n# BIEN - parametrizado:\nconn = sqlite3.connect("app.db")\ncursor = conn.cursor()\ncursor.execute("SELECT * FROM users WHERE name = ?", (user_input,))\n```\n\n```python\n# Hash de contraseñas\nimport bcrypt\n\ndef hash_password(password: str) -> bytes:\n    salt = bcrypt.gensalt(rounds=12)\n    return bcrypt.hashpw(password.encode(), salt)\n\ndef verify(password: str, hashed: bytes) -> bool:\n    return bcrypt.checkpw(password.encode(), hashed)\n```\n\n¿Necesitas algo más?',
    ],
  },
  {
    patterns: [/linux|terminal|bash|shell|ubuntu|debian/i],
    conversational: [
      'Linux es el sistema operativo más usado en servidores. Dominar la terminal es esencial.\n\nDistros recomendadas:\n\n1. Ubuntu / Debian: para empezar.\n2. Fedora: más actualizada.\n3. Arch: para aprender a fondo.\n4. Kali: para ciberseguridad.\n\n¿Qué te gustaría saber?',
    ],
    withCode: [
      'Comandos Linux útiles:\n\n```bash\n# Buscar archivos\nfind / -name "*.conf" -type f 2>/dev/null\ngrep -rn "password" /var/log/ --include="*.log"\n\n# Redes\nss -tlnp\ncurl -s ifconfig.me\n\n# Procesos\nps aux --sort=-%mem | head -10\n```\n\n¿Algo más?',
    ],
  },
  {
    patterns: [/\bgit\b|github|commit|branch|merge|repo/i],
    conversational: [
      'Git es el sistema de control de versiones estándar. Rastrea cambios en tu código.\n\nConceptos clave:\n\n1. Commit: foto del estado de tu código.\n2. Branch: línea paralela de desarrollo.\n3. Merge: unir ramas.\n4. Pull Request: propuesta para integrar cambios.\n\n¿Tienes alguna duda o necesitas comandos?',
    ],
    withCode: [
      'Comandos Git esenciales:\n\n```bash\ngit init\ngit add .\ngit commit -m "feat: initial commit"\ngit remote add origin <url>\ngit push -u origin main\n\n# Ramas\ngit checkout -b feature/nueva\ngit checkout main\ngit merge feature/nueva\n\n# Utiles\ngit stash push -m "wip"\ngit log --oneline --graph --all\ngit reset --soft HEAD~1\n```\n\n¿Algo más?',
    ],
  },
  {
    patterns: [/docker|container|kubernetes|k8s|devops|deploy/i],
    conversational: [
      'Docker empaqueta tu app con todo lo que necesita para que corra igual en cualquier lugar.\n\nConceptos:\n\n1. Image: la plantilla.\n2. Container: una instancia corriendo.\n3. Dockerfile: instrucciones para crear la imagen.\n4. Docker Compose: orquestar varios contenedores.\n\nKubernetes es el siguiente nivel: orquesta muchos contenedores con auto-escalado.\n\n¿Qué te interesa?',
    ],
    withCode: [
      'Ejemplo de Docker:\n\n```dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n```\n\n¿Algo más?',
    ],
  },
  {
    patterns: [/archivo|file|subir|upload|imagen|pdf|zip|adjunt|analiz/i],
    conversational: [
      'Puedo analizar varios tipos de archivo. Solo arrástralo al chat o usa el botón de clip.\n\nFormatos que acepto: imágenes (JPG, PNG, etc.), PDFs, ZIPs, código fuente, CSV, JSON, audio y video.\n\n¿Quieres probarlo?',
    ],
    withCode: [],
  },
  {
    patterns: [/gracias|thanks|genial|perfecto|excelente|ok|vale/i],
    conversational: [
      'De nada. Si necesitas algo más, aquí estoy.',
      'Me alegra ayudar. ¿Alguna otra pregunta?',
    ],
    withCode: [],
  },
];

function defaultResponse(msg: string): string {
  const hasQuestion = msg.includes('?');
  const words = msg.split(/\s+/).length;

  if (words < 3 && !hasQuestion) {
    return 'Entiendo. ¿Podrías darme más contexto? Así puedo ayudarte mejor.\n\nPuedes preguntarme sobre cualquier tema o pedirme ayuda con algo específico.';
  }
  if (hasQuestion) {
    return 'Buena pregunta. Para darte la mejor respuesta, me ayudaría saber:\n\n1. ¿Cuál es el contexto? (proyecto, trabajo, aprendizaje)\n2. ¿Qué tecnologías usas?\n3. ¿Hay alguna restricción?\n\nSi me das más detalles, te respondo con más precisión.';
  }
  return 'Entiendo lo que planteas. Es un tema que depende del contexto.\n\nPuntos a considerar:\n\n1. Entender bien el problema antes de buscar soluciones.\n2. Siempre hay trade-offs entre opciones.\n3. Pensar en mantenibilidad a largo plazo.\n\n¿Te gustaría que profundice en algo?';
}

function defaultCodeResponse(): string {
  return 'Necesito un poco más de info para generarte algo útil:\n\n1. ¿Qué funcionalidad necesitas?\n2. ¿Qué lenguaje o framework?\n3. ¿Algún requisito especial?\n\nDame esos detalles y te genero el código.';
}

function matchTopic(msg: string): TopicEntry | null {
  const lower = msg.toLowerCase().trim();
  for (const entry of topics) {
    for (const p of entry.patterns) {
      if (p.test(lower)) return entry;
    }
  }
  return null;
}

function getTextResponse(msg: string): string {
  const intent = detectIntent(msg);
  const entry = matchTopic(msg);

  if (entry) {
    if (intent === 'code_request' && entry.withCode.length > 0) {
      return entry.withCode[Math.floor(Math.random() * entry.withCode.length)];
    }
    return entry.conversational[Math.floor(Math.random() * entry.conversational.length)];
  }

  return intent === 'code_request' ? defaultCodeResponse() : defaultResponse(msg);
}

export function generateBotResponse(userMessage: string, attachments?: FileAttachment[]): string {
  if (attachments && attachments.length > 0) {
    const analysis = analyzeFiles(attachments);
    return userMessage.trim() ? analysis + '\n\n' + getTextResponse(userMessage) : analysis;
  }
  return getTextResponse(userMessage);
}

export function generateTitle(message: string, attachments?: FileAttachment[]): string {
  if (attachments && attachments.length > 0 && !message.trim()) {
    return attachments.length === 1 ? attachments[0].name : `${attachments.length} archivos`;
  }
  const words = message.split(' ').slice(0, 5).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
}
