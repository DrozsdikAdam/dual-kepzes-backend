
export const mapCompany = (company: any) => {
     if (!company) return null;
     const mainLocation = company.location && company.location.length > 0 ? company.location[0] : null;
     const { location, ...rest } = company;
     return {
          ...rest,
          location: mainLocation ? {
               country: mainLocation.country,
               zipCode: mainLocation.zipCode,
               city: mainLocation.city,
               address: mainLocation.address
          } : null
     };
};

export const mapPosition = (position: any) => {
     if (!position) return null;
     const loc = position.location;
     const { location, company, ...rest } = position;

     // Map company if present
     const mappedCompany = company ? mapCompany(company) : undefined;

     return {
          ...rest,
          company: mappedCompany,
          location: loc ? {
               zipCode: loc.zipCode,
               city: loc.city,
               address: loc.address,
               country: loc.country // Added country if available in position location
          } : null
     };
};

export const mapStudentProfile = (profile: any) => {
     if (!profile) return null;
     const mainLocation = profile.locations && profile.locations.length > 0 ? profile.locations[0] : null;
     // Extract locations and locationId to exclude them and flatten properties
     const { locations, ...rest } = profile;

     return {
          ...rest,
          location: mainLocation ? {
               country: mainLocation.country,
               zipCode: mainLocation.zipCode,
               city: mainLocation.city,
               address: mainLocation.address
          } : null
     };
};

export const mapStudent = (user: any) => {
     if (!user) return null;
     const mapped = { ...user };

     if (mapped.studentProfile) {
          mapped.studentProfile = mapStudentProfile(mapped.studentProfile);
     }
     return mapped;
};

export const mapApplication = (application: any) => {
     if (!application) return null;

     const mapped = { ...application };

     if (mapped.student && mapped.student.studentProfile) {
          mapped.student.studentProfile = mapStudentProfile(mapped.student.studentProfile);
     }

     return mapped;
};
