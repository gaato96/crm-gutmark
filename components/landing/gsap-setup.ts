"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Registro único de plugins para toda la landing. Cada componente de motion
// importa desde acá en vez de registrar por su cuenta (registrar dos veces
// funciona pero ensucia, y así hay un solo lugar donde mirar qué está activo).
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
