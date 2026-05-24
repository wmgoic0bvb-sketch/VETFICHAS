"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";

const TOUR_KEY = "tour_calendario_v1";

export function useCalendarioTour(ready: boolean, tieneControles: boolean) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!ready || firedRef.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TOUR_KEY)) return;

    firedRef.current = true;

    // Pequeño delay para que el DOM esté pintado
    const timeout = setTimeout(() => {
      const steps = [
        {
          element: "#tour-filtro-sucursal",
          popover: {
            title: "Filtrar por sucursal",
            description:
              "Podés filtrar los controles del día por sucursal para ver solo los que te interesan.",
          },
        },
        {
          element: "#tour-selector-fecha",
          popover: {
            title: "Seleccionar fecha",
            description:
              "Usá el calendario para navegar a cualquier día y ver los controles programados.",
          },
        },
        ...(tieneControles
          ? [
              {
                element: "#tour-checkbox-asistencia",
                popover: {
                  title: "Asistencia del control",
                  description:
                    "Activá el interruptor si el paciente asistió; desactivalo para marcar ausente. También podés ajustarlo desde la ficha.",
                },
              },
              {
                element: "#tour-whatsapp-btn",
                popover: {
                  title: "Recordatorio por WhatsApp",
                  description:
                    "Enviá un recordatorio al dueño con un mensaje predefinido directo a WhatsApp. (Próximamente automatizado)",
                },
              },
            ]
          : []),
      ];

      // Solo mostrar si hay al menos un step con elemento visible
      const validSteps = steps.filter(
        (s) => !s.element || document.querySelector(s.element),
      );
      if (validSteps.length === 0) return;

      const tour = driver({
        showProgress: true,
        animate: true,
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Entendido",
        progressText: "{{current}} de {{total}}",
        steps: validSteps,
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, "true");
        },
      });

      tour.drive();
    }, 500);

    return () => clearTimeout(timeout);
  }, [ready, tieneControles]);
}
