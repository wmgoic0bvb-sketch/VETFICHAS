/** Interest de Pusher Beams por usuario (excluye caracteres no permitidos por Beams). */
export function beamsInterestForUserId(userId: string): string {
  return `user-${userId}`;
}
