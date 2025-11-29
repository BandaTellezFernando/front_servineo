import type { CategoryDTO } from "@/lib/api/categories";
import type { PaymentMethodKey } from "@/types/payment";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE = RAW_API ? RAW_API.replace(/\/+$/, "") : "https://alquiler-back-soft-war2-qizb.vercel.app";
const FIXER_BASE = `${API_BASE}/api/fixers`;

// Definimos un tipo genérico para errores de API comunes
type ApiErrorResponse = { message?: string };

type ApiSuccess<T> = { success: true; data: T } & Record<string, unknown>;

/**
 * Helper para extraer el mensaje de error de un payload desconocido de forma segura.
 */
function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" && 
    payload !== null && 
    "message" in payload
  ) {
    // Aserción segura: sabemos que es un objeto y tiene la propiedad message
    return String((payload as Record<string, unknown>).message);
  }
  return fallback;
}

// 1. Eliminamos el default 'any' del genérico
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  
  // 2. Usamos 'unknown' en lugar de 'any'
  let payload: unknown = null;
  
  try {
    payload = await res.json();
  } catch {
    // no json body
  }

  if (!res.ok) {
    // 3. Usamos la función helper para obtener el mensaje sin usar 'any'
    const message = getErrorMessage(payload, `Error HTTP ${res.status}`);
    throw new Error(message);
  }

  // Hacemos cast a T porque fetch no sabe qué estructura devuelve
  return payload as T;
}

export type FixerSkillDTO = {
  categoryId: string;
  customDescription?: string;
};

export type FixerSkillInfoDTO = {
  category: CategoryDTO;
  description: string;
  customDescription?: string;
  source: "personal" | "general";
};

export type FixerDTO = {
  id: string;
  userId: string;
  ci?: string;
  location?: { lat: number; lng: number; address?: string };
  categories?: string[];
  skills?: FixerSkillDTO[];
  categoriesInfo?: CategoryDTO[];
  skillsInfo?: FixerSkillInfoDTO[];
  paymentMethods?: ("card" | "qr" | "cash")[];
  paymentAccounts?: Record<string, { holder: string; accountNumber: string }>;
  termsAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  name?: string;
  city?: string;
  photoUrl?: string;
  whatsapp?: string;
  bio?: string;
  jobsCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  memberSince?: string;
};

export type FixerWithCategoriesDTO = FixerDTO & {
  categoriesInfo: CategoryDTO[];
  skillsInfo?: FixerSkillInfoDTO[];
};

export type FixersByCategoryDTO = {
  category: CategoryDTO;
  total: number;
  fixers: FixerWithCategoriesDTO[];
};

export type UpdateCategoriesPayload = {
  categories: string[];
  skills?: FixerSkillDTO[];
  bio?: string; 
};

export async function checkCI(ci: string, excludeId?: string) {
  const url = new URL(`${FIXER_BASE}/check-ci`);
  url.searchParams.set("ci", ci);
  if (excludeId) url.searchParams.set("excludeId", excludeId);
  return request<{ success: true; unique: boolean; message: string }>(url.toString(), {
    cache: "no-store",
  });
}

export async function createFixer(payload: {
  userId: string;
  ci: string;
  city?: string;
  location?: { lat: number; lng: number; address?: string };
}): Promise<ApiSuccess<FixerDTO>> {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getFixer(id: string): Promise<ApiSuccess<FixerDTO>> {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}`, { cache: "no-store" });
}

export async function getFixerByUser(userId: string): Promise<FixerDTO | null> {
  const url = `${FIXER_BASE}/user/${userId}`;
  const res = await fetch(url, { cache: "no-store" });
  
  // payloadText es string, JSON.parse retorna 'any' por defecto, 
  // pero lo asignamos a unknown para manejarlo nosotros.
  const payloadText = await res.text();
  let payload: unknown = null;
  
  if (payloadText) {
      try {
          payload = JSON.parse(payloadText);
      } catch (e) {
          console.error("Error parsing JSON", e);
      }
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    // Reutilizamos el helper seguro
    const message = getErrorMessage(payload, `Error HTTP ${res.status}`);
    throw new Error(message);
  }

  // Validación final antes de retornar
  const successPayload = payload as ApiSuccess<FixerDTO>;
  return successPayload?.data ?? null;
}

export async function getFixersByCategory(search?: string): Promise<FixersByCategoryDTO[]> {
  const url = new URL(`${FIXER_BASE}/by-category`);
  const trimmed = search?.trim();
  if (trimmed) {
    url.searchParams.set("search", trimmed);
  }
  const response = await request<ApiSuccess<FixersByCategoryDTO[]>>(url.toString(), { cache: "no-store" });
  return response.data;
}

export async function updateIdentity(id: string, ci: string): Promise<ApiSuccess<FixerDTO>> {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}/identity`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ci }),
  });
}

export async function updateLocation(id: string, location: { lat: number; lng: number; address?: string }) {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}/location`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });
}

export async function updateCategories(id: string, payload: UpdateCategoriesPayload) {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}/categories`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), 
  });
}

export async function updatePayments(
  id: string,
  payload: {
    methods: PaymentMethodKey[];
    accounts?: Partial<Record<PaymentMethodKey, { holder: string; accountNumber: string }>>;
  }
) {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}/payments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function acceptTerms(id: string) {
  return request<ApiSuccess<FixerDTO>>(`${FIXER_BASE}/${id}/terms`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accepted: true }),
  });
}