import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Parsea una fecha de forma segura evitando problemas de desfase horario en Colombia (UTC-5).
 * - Si es solo fecha ("YYYY-MM-DD"), se parsea en hora local (evita que se reste 1 día).
 * - Si es timestamp de Postgres sin zona ("YYYY-MM-DD HH:MM:SS" o "YYYY-MM-DDTHH:MM:SS"),
 *   se asume UTC (ya que Postgres now() se guarda en UTC) y se convierte a la hora local de Colombia.
 * - Si ya incluye 'Z' u offset de zona, se procesa normalmente.
 */
export function parseDateSafe(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    
    // Formato solo fecha YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-").map(Number);
      return new Date(year, month - 1, day, 12, 0, 0); // mediodía para evitar cualquier borde
    }
    
    // Si viene de Postgres/Supabase sin indicador de zona horaria (sin 'Z' y sin '+/-HH:MM')
    if (!trimmed.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(trimmed)) {
      // Reemplazar espacio por 'T' si es necesario y agregar 'Z' para tratarlo como UTC
      const isoUtc = trimmed.replace(" ", "T") + "Z";
      const parsed = new Date(isoUtc);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date(dateInput);
}

/**
 * Formatea una fecha en formato dd/MM/yyyy
 */
export function formatColombiaDate(dateInput, pattern = "dd/MM/yyyy") {
  try {
    return format(parseDateSafe(dateInput), pattern, { locale: es });
  } catch (err) {
    console.error("Error formatting date:", err);
    return "";
  }
}

/**
 * Formatea fecha y hora completa (ej: "01/09/2026 09:38 pm" o "1 Sep 2026 • 09:38 pm")
 */
export function formatColombiaDateTime(dateInput, pattern = "dd/MM/yyyy • hh:mm a") {
  try {
    return format(parseDateSafe(dateInput), pattern, { locale: es });
  } catch (err) {
    console.error("Error formatting datetime:", err);
    return "";
  }
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para inputs de tipo date
 */
export function getTodayDateString() {
  return format(new Date(), "yyyy-MM-dd");
}
