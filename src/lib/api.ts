
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://alquiler-back-soft-war2-qizb.vercel.app/api/ofertas";

export async function crearOferta(formData: FormData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    body: formData, // enviamos FormData directamente
  });

  if (!res.ok) throw new Error("Error al crear la oferta");

  return res.json();
}

export async function obtenerOfertas() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error al obtener las ofertas");
  return res.json();
}

export async function actualizarOferta(id: string, formData: FormData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) throw new Error("Error al editar la oferta");

  return res.json();
}

export async function eliminarOferta(id: string) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Error al borrar la oferta");
}
