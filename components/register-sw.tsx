"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Instalación como PWA es un extra, no algo crítico: si falla, no hacemos ruido.
      });
    }
  }, []);

  return null;
}
