/** Mensaje de validación visible en el formulario (reemplaza alert del navegador). */
export function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 text-[13px] font-medium text-red-700"
    >
      {message}
    </p>
  );
}

export function inputErrorRing(hasError: boolean): string {
  return hasError
    ? "border-red-400 focus:border-red-500 bg-red-50/50"
    : "border-[#e8e0d8] focus:border-[#2d6a4f] bg-[#faf9f7] focus:bg-white";
}
