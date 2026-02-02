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
import {
     MappedLocation,
     MappedCompany,
     MappedPosition,
     MappedStudentProfile,
     MappedStudent,
     MappedApplication,
     MappedDualPartnership
} from '../types/mappers.types';

type PartialLocation = Partial<Location>;

export const mapCompany = (company: (Partial<Company> & { location?: PartialLocation[] }) | null): MappedCompany | null => {
     if (!company) return null;
     const { location, ...rest } = company;

     return {
          id: rest.id!,
          name: rest.name!,
          taxId: rest.taxId,
          description: rest.description,
          contactName: rest.contactName,
          contactEmail: rest.contactEmail,
          website: rest.website,
          logoUrl: rest.logoUrl,
          hasOwnApplication: rest.hasOwnApplication,
          isActive: rest.isActive,
          createdAt: rest.createdAt,
          locations: location ? location.map((loc: PartialLocation) => ({
               id: loc.id,
               country: loc.country!,
               zipCode: loc.zipCode!,
               city: loc.city!,
               address: loc.address!
          })) : []
     };
};

export const mapPosition = (position: (Partial<Position> & {
     location?: PartialLocation | null,
     company?: (Partial<Company> & { location?: PartialLocation[] }) | null,
     tags?: Array<{ name: string; category: string }>
}) | null): MappedPosition | null => {
     if (!position) return null;
     const { location: loc, company, tags, ...rest } = position;

     return {
          id: rest.id!,
          companyId: rest.companyId!,
          title: rest.title!,
          description: rest.description,
          isDual: rest.isDual ?? true,
          deadline: rest.deadline,
          isActive: rest.isActive ?? true,
          createdAt: rest.createdAt,
          company: company ? mapCompany(company)! : undefined,
          locationId: rest.locationId,
          location: loc ? {
               id: loc.id,
               zipCode: loc.zipCode!,
               city: loc.city!,
               address: loc.address!,
               country: loc.country || "Magyarország"
          } : null,
          tags: tags
     };
};

export const mapStudentProfile = (profile: (Partial<StudentProfile> & { locations?: PartialLocation[] }) | null): MappedStudentProfile | null => {
     if (!profile) return null;
     const mainLocation = profile.locations && profile.locations.length > 0 ? profile.locations[0] : null;
     const { locations, ...rest } = profile;

     return {
          id: rest.id!,
          userId: rest.userId!,
          mothersName: rest.mothersName!,
          birthDate: rest.birthDate!,
          highSchool: rest.highSchool!,
          graduationYear: rest.graduationYear!,
          neptunCode: rest.neptunCode,
          currentMajor: rest.currentMajor!,
          studyMode: rest.studyMode!,
          hasLanguageCert: rest.hasLanguageCert ?? false,
          location: mainLocation ? {
               id: mainLocation.id,
               country: mainLocation.country!,
               zipCode: mainLocation.zipCode!,
               city: mainLocation.city!,
               address: mainLocation.address!
          } : null
     };
};

export const mapStudent = (user: (Partial<User> & { studentProfile?: (Partial<StudentProfile> & { locations?: PartialLocation[] }) | null }) | null): MappedStudent | null => {
     if (!user) return null;

     return {
          id: user.id!,
          email: user.email!,
          fullName: user.fullName!,
          phoneNumber: user.phoneNumber,
          role: user.role!,
          isActive: user.isActive ?? true,
          isEmailVerified: user.isEmailVerified ?? false,
          studentProfile: user.studentProfile ? mapStudentProfile(user.studentProfile) : null
     };
};

export const mapApplication = (application: (Partial<Application> & {
     student?: (Partial<StudentProfile> & {
          user?: Partial<User> | null,
          locations?: PartialLocation[]
     }) | null,
     position?: (Partial<Position> & {
          location?: PartialLocation | null,
          company?: (Partial<Company> & { location?: PartialLocation[] }) | null
     }) | null
}) | null): MappedApplication | null => {
     if (!application) return null;

     const { student: profile, position, ...rest } = application;
     let mappedStudent: MappedStudent | undefined;

     if (profile) {
          const user = profile.user || {};
          mappedStudent = {
               id: profile.userId!,
               email: user.email!,
               fullName: user.fullName!,
               phoneNumber: user.phoneNumber,
               role: user.role || 'STUDENT',
               isActive: user.isActive ?? true,
               isEmailVerified: user.isEmailVerified ?? false,
               studentProfile: mapStudentProfile(profile)
          };
     }

     return {
          id: rest.id!,
          studentId: rest.studentId!,
          positionId: rest.positionId!,
          status: rest.status!,
          companyNote: rest.companyNote,
          studentNote: rest.studentNote,
          submittedAt: rest.submittedAt!,
          student: mappedStudent,
          position: position ? mapPosition(position)! : undefined
     };
};

export const mapDualPartnership = (partnership: (Partial<DualPartnership> & {
     student?: (Partial<StudentProfile> & {
          user?: Partial<User> | null,
          locations?: PartialLocation[]
     }) | null,
     mentor?: (Partial<CompanyEmployee> & { user?: Partial<User> | null }) | null,
     position?: (Partial<Position> & { company?: (Partial<Company> & { location?: PartialLocation[] }) | null }) | null,
     uniEmployee?: Partial<User> | null
}) | null): MappedDualPartnership | null => {
     if (!partnership) return null;

     const { student: profile, mentor, position, uniEmployee, ...rest } = partnership;

     let mappedStudent: MappedStudent | undefined;
     if (profile) {
          const user = profile.user || {};
          mappedStudent = {
               id: profile.userId!,
               email: user.email!,
               fullName: user.fullName!,
               phoneNumber: user.phoneNumber,
               role: user.role || 'STUDENT',
               isActive: user.isActive ?? true,
               isEmailVerified: user.isEmailVerified ?? false,
               studentProfile: mapStudentProfile(profile)
          };
     }

     let mappedMentor: MappedDualPartnership['mentor'] | undefined;
     if (mentor) {
          const user = mentor.user || {};
          mappedMentor = {
               id: mentor.userId!,
               email: user.email!,
               fullName: user.fullName!,
               isEmailVerified: user.isEmailVerified ?? false,
               companyId: mentor.companyId!,
               jobTitle: mentor.jobTitle,
          };
     }

     let mappedUniEmployee: MappedDualPartnership['uniEmployee'] | undefined;
     if (uniEmployee) {
          mappedUniEmployee = {
               id: uniEmployee.id!,
               email: uniEmployee.email!,
               fullName: uniEmployee.fullName!,
               isEmailVerified: uniEmployee.isEmailVerified ?? false,
          };
     }

     return {
          id: rest.id!,
          studentId: rest.studentId!,
          mentorId: rest.mentorId,
          uniEmployeeId: rest.uniEmployeeId,
          positionId: rest.positionId,
          semester: rest.semester!,
          contractNumber: rest.contractNumber,
          status: rest.status!,
          startDate: rest.startDate!,
          endDate: rest.endDate,
          createdAt: rest.createdAt!,
          student: mappedStudent,
          mentor: mappedMentor,
          position: position ? {
               id: position.id!,
               title: position.title!,
               companyId: position.companyId!,
               company: { name: position.company?.name! }
          } : undefined,
          uniEmployee: mappedUniEmployee
     };
};
