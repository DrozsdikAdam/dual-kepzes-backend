export interface LocationInput {
     country?: string;
     zipCode?: string | number;
     city?: string;
     address?: string;
}

/**
 * Prepares location data for Prisma create/update operations.
 * Handles default values and type conversions (e.g., zipCode to string).
 */
export function prepareLocationData(loc: LocationInput) {
     return {
          country: loc.country || "Magyarország",
          zipCode: loc.zipCode ? String(loc.zipCode) : "",
          city: loc.city || "",
          address: loc.address || "",
     };
}
