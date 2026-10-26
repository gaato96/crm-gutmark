"use client";

import { Printer } from "lucide-react";

// "Guardar como PDF" es la opción de destino del diálogo de impresión en
// todos los navegadores (también en el celular): no hace falta generar el PDF
// en el server ni sumar una librería.
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary">
      <Printer className="h-4 w-4" /> Descargar PDF
    </button>
  );
}
