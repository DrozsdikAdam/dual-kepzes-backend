export const mapCompany = (company: any) => {
     if (!company) return null;
     const { location, ...rest } = company;
     // Return locations array, mapping each to only include relevant fields
     return {
          ...rest,
          locations: location ? location.map((loc: any) => ({
               id: loc.id,
               country: loc.country,
               zipCode: loc.zipCode,
               city: loc.city,
               address: loc.address
          })) : []
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

     if (mapped.student) {
          // application.student is the StudentProfile (from the new select)
          // We want to format it as a User object with a proper studentProfile inside
          const profile = mapped.student;
          const user = profile.user || {};

          // Construct the student object (simulating a User)
          mapped.student = {
               id: profile.userId, // The generic user ID
               email: user.email,
               fullName: user.fullName,
               phoneNumber: user.phoneNumber,

               // The profile data itself
               studentProfile: mapStudentProfile({
                    ...profile,
                    userId: undefined, // remove redundancy if desired
                    user: undefined
               })
          };
     }

     return mapped;
};
