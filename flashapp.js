// [SECTION: Inside fetchJourneyCards function in flashapp.js]

    const prompt = `Actúa como una enciclopedia académica para niños de primaria en España.
    TU OBJETIVO: Generar 20 frases que sean DATOS O HECHOS REALES del currículo escolar.
    
    DISTRIBUCIÓN DE CONTENIDO:
    - 70%: Datos de ${currentYear}º de Primaria.
    - 10%: Datos de ${currentYear + 1 > 6 ? 6 : currentYear + 1}º de Primaria.
    - 20%: Datos de repaso (1º a ${currentYear > 1 ? currentYear - 1 : 1}º).

    DIFICULTAD DE LECTURA (Sintaxis): ${selectedDiff}
    
    REGLAS CRÍTICAS:
    1. PROHIBIDO usar lenguaje descriptivo de clase (ej. No digas "Los alumnos aprenden...", "Observamos...", "Estudiamos...").
    2. SÓLO HECHOS DIRECTOS: (ej. "La Tierra tiene un satélite llamado Luna", "Los mamíferos tienen pelo y maman leche").
    3. Cada frase debe ser una afirmación independiente y completa.
    4. El campo 'cat' debe ser la asignatura (ej. CIENCIAS, MATEMÁTICAS, HISTORIA).
    
    FORMATO JSON: [{"es": "Hecho académico directo", "val": "traducción", "cat": "ASIGNATURA", "keywords": ["palabra"]}]`;
