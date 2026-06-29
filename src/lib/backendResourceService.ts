export type BackendPickerCategory = {
  categoryId: string;
  name: string;
};

export type BackendPickerProduct = {
  id: string;
  categoryId: string;
  title: string;
  brand: string;
  coverImage?: string;
  galleryImages: string[];
  videoUrls: string[];
};

export type BackendPickerPayload = {
  categories: BackendPickerCategory[];
  products: BackendPickerProduct[];
};

export async function getBackendPickerPayload(params?: { categoryId?: string; q?: string }): Promise<BackendPickerPayload> {
  const search = new URLSearchParams();
  if (params?.categoryId) search.set("categoryId", params.categoryId);
  if (params?.q) search.set("q", params.q);

  const response = await fetch(`/api/content/resources?${search.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Failed to fetch backend resource payload (${response.status})${details ? `: ${details}` : ""}`);
  }

  const json = await response.json();
  return json?.data || { categories: [], products: [] };
}
