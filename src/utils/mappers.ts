import {
     Company,
     Position,
     StudentProfile,
     Location,
     User,
     CompanyEmployee,
     Application,
     DualPartnership
} from '@prisma/client';

type PartialLocation = Partial<Location>;
type CompanyWithLocations = Partial<Company> & { location?: PartialLocation[] };

export const mapCompany = (company: CompanyWithLocations | null): any => {
     if (!company) return null;
     const { location, ...rest } = company;
     // Return locations array, mapping each to only include relevant fields
     return {
          ...rest,
          locations: location ? location.map((loc: PartialLocation) => ({
               id: loc.id,
               country: loc.country,
               zipCode: loc.zipCode,
               city: loc.city,
               address: loc.address
          })) : []
     };
};

type PositionWithRelations = Partial<Position> & {
     location?: PartialLocation | null,
     company?: CompanyWithLocations | null
};

export const mapPosition = (position: PositionWithRelations | null): any => {
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

type ProfileWithLocations = Partial<StudentProfile> & { locations?: PartialLocation[] };

export const mapStudentProfile = (profile: ProfileWithLocations | null): any => {
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

type UserWithProfile = Partial<User> & { studentProfile?: ProfileWithLocations | null };

export const mapStudent = (user: UserWithProfile | null): any => {
     if (!user) return null;
     const mapped = { ...user };

     if (mapped.studentProfile) {
          mapped.studentProfile = mapStudentProfile(mapped.studentProfile) as any;
     }
     return mapped;
};

type ApplicationWithStudent = Partial<Application> & {
     student?: (Partial<StudentProfile> & { user?: Partial<User> | null }) | null
};

export const mapApplication = (application: ApplicationWithStudent | null): any => {
     if (!application) return null;

     const mapped = { ...application } as any;

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
                    userId: undefined as any, // remove redundancy if desired
                    user: undefined as any
               })
          };
     }

     return mapped;
};

type PartnershipWithRelations = Partial<DualPartnership> & {
     student?: (Partial<StudentProfile> & { user?: Partial<User> | null }) | null,
     mentor?: (Partial<CompanyEmployee> & { user?: Partial<User> | null }) | null,
     position?: (Partial<Position> & { company?: Partial<Company> | null }) | null,
     uniEmployee?: Partial<User> | null
};

export const mapDualPartnership = (partnership: PartnershipWithRelations | null): any => {
     if (!partnership) return null;

     const mapped = { ...partnership } as any;

     if (mapped.student) {
          // partnership.student is the StudentProfile
          // We need to construct a user-like object from it
          const profile = mapped.student;
          const user = profile.user || {};

          mapped.student = {
               id: profile.userId,
               email: user.email,
               fullName: user.fullName,
               studentProfile: mapStudentProfile({
                    ...profile,
                    user: undefined as any, // Avoid circular reference
               }),
          };
     }

     if (mapped.mentor) {
          const employee = mapped.mentor;
          const user = employee.user || {};
          mapped.mentor = {
               id: employee.userId,
               email: user.email,
               fullName: user.fullName,
               companyId: employee.companyId,
               jobTitle: employee.jobTitle,
          };
     }

     if (mapped.uniEmployee) {
          const user = mapped.uniEmployee;
          mapped.uniEmployee = {
               id: user.id,
               email: user.email,
               fullName: user.fullName,
          };
     }

     return mapped;
};
