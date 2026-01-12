-- USER TÁBLA
ALTER TABLE "User" 
  ALTER COLUMN "email" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "fullName" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "phoneNumber" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "passwordResetToken" TYPE TEXT COLLATE "hu-HU-x-icu";

-- STUDENTPROFILE TÁBLA
ALTER TABLE "StudentProfile" 
  ALTER COLUMN "mothersName" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "country" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "zipCode" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "city" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "streetAddress" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "highSchool" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "neptunCode" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "currentMajor" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "studyMode" TYPE TEXT COLLATE "hu-HU-x-icu";

-- COMPANYEMPLOYEE TÁBLA
ALTER TABLE "CompanyEmployee" 
  ALTER COLUMN "jobTitle" TYPE TEXT COLLATE "hu-HU-x-icu";

-- COMPANY TÁBLA
ALTER TABLE "Company" 
  ALTER COLUMN "name" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "taxId" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "hqCountry" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "hqZipCode" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "hqCity" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "hqAddress" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "contactName" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "contactEmail" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "website" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "logoUrl" TYPE TEXT COLLATE "hu-HU-x-icu";

-- POSITION TÁBLA
ALTER TABLE "Position" 
  ALTER COLUMN "title" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "description" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "zipCode" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "city" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "address" TYPE TEXT COLLATE "hu-HU-x-icu";

-- TAG TÁBLA
ALTER TABLE "Tag" 
  ALTER COLUMN "name" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "category" TYPE TEXT COLLATE "hu-HU-x-icu";

-- APPLICATION TÁBLA
ALTER TABLE "Application" 
  ALTER COLUMN "companyNote" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "studentNote" TYPE TEXT COLLATE "hu-HU-x-icu";

-- DUALPARTNERSHIP TÁBLA
ALTER TABLE "DualPartnership" 
  ALTER COLUMN "semester" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "contractNumber" TYPE TEXT COLLATE "hu-HU-x-icu";

-- DOCUMENT TÁBLA
ALTER TABLE "Document" 
  ALTER COLUMN "filePath" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "originalName" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "mimeType" TYPE TEXT COLLATE "hu-HU-x-icu";

-- LOGBOOKENTRY TÁBLA
ALTER TABLE "LogbookEntry" 
  ALTER COLUMN "activity" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "rejectionNote" TYPE TEXT COLLATE "hu-HU-x-icu";

-- NOTIFICATION TÁBLA
ALTER TABLE "Notification" 
  ALTER COLUMN "title" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "message" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "type" TYPE TEXT COLLATE "hu-HU-x-icu";

-- AUDITLOG TÁBLA
ALTER TABLE "AuditLog" 
  ALTER COLUMN "action" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "entity" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "entityId" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "ipAddress" TYPE TEXT COLLATE "hu-HU-x-icu";

-- MESSAGE TÁBLA
ALTER TABLE "Message" 
  ALTER COLUMN "subject" TYPE TEXT COLLATE "hu-HU-x-icu",
  ALTER COLUMN "content" TYPE TEXT COLLATE "hu-HU-x-icu";