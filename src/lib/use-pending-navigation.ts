"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Navegación con `startTransition` para poder mostrar UI de carga mientras cambia la ruta. */
export function usePendingNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  return { push, isPending };
}
