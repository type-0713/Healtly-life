type LocationShape = {
  clinic?: string;
  address?: string;
  mapQuery?: string;
};

const normalizePart = (value?: string) => value?.trim() ?? "";

export const getDoctorMapQuery = ({ clinic, address, mapQuery }: LocationShape) => {
  const explicitQuery = normalizePart(mapQuery);

  if (explicitQuery) {
    return explicitQuery;
  }

  return [normalizePart(clinic), normalizePart(address)].filter(Boolean).join(", ");
};

export const getMapSearchUrl = (query: string) =>
  query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";

export const getMapEmbedUrl = (query: string) =>
  query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed` : "";
