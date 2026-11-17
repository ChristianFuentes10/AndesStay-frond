import { HttpErrorResponse } from '@angular/common/http';

export type ErrorContext = 'create' | 'cancel' | 'general';

export function translateReservationError(
  err: HttpErrorResponse | any,
  context: ErrorContext = 'general'
): string {
  const status: number = err?.status ?? 0;

  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor.';

    case 400:
      return (
        err?.error?.message ||
        'Los datos enviados no son válidos. Revisa las fechas y la cantidad de huéspedes.'
      );

    case 401:
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';

    case 403:
      return context === 'create'
        ? 'Tu cuenta aún no tiene rol de huésped asignado. Contacta al administrador para poder reservar.'
        : 'No tienes permiso para realizar esta acción.';

    case 404:
      return 'La reserva o la unidad ya no existe.';

    case 409:
      if (context === 'create') {
        return 'La unidad no está disponible para esas fechas, ya fue reservada, o la cantidad de huéspedes excede su capacidad. Prueba con otras fechas.';
      }
      if (context === 'cancel') {
        return 'Esta reserva ya no se puede cancelar en su estado actual.';
      }
      return 'No se pudo completar la operación por un conflicto de estado.';

    case 502:
      return 'El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.';

    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
  }
}

