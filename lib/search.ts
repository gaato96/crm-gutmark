// Normalización para buscar texto como lo escribe la gente: sin mayúsculas y
// sin acentos. "patricio" tiene que encontrar a "Patricio" y "nunez" a
// "Núñez". Archivo puro: lo usan la búsqueda del server y las listas client.
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ¿El texto contiene todas las palabras de la búsqueda, en cualquier orden?
// "maria gon" encuentra a "María González" sin exigir el nombre completo.
export function matchesSearch(text: string, query: string): boolean {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const t = normalizeSearch(text);
  return words.every((w) => t.includes(w));
}
