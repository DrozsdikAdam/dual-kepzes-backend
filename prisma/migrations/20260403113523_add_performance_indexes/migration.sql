-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_positionId_idx" ON "Application"("positionId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_submittedAt_idx" ON "Application"("submittedAt");

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "CompanyEmployee_companyId_idx" ON "CompanyEmployee"("companyId");

-- CreateIndex
CREATE INDEX "CompanyImage_companyId_idx" ON "CompanyImage"("companyId");

-- CreateIndex
CREATE INDEX "DualPartnership_studentId_idx" ON "DualPartnership"("studentId");

-- CreateIndex
CREATE INDEX "DualPartnership_mentorId_idx" ON "DualPartnership"("mentorId");

-- CreateIndex
CREATE INDEX "DualPartnership_uniEmployeeId_idx" ON "DualPartnership"("uniEmployeeId");

-- CreateIndex
CREATE INDEX "DualPartnership_positionId_idx" ON "DualPartnership"("positionId");

-- CreateIndex
CREATE INDEX "DualPartnership_status_idx" ON "DualPartnership"("status");

-- CreateIndex
CREATE INDEX "DualPartnership_createdAt_idx" ON "DualPartnership"("createdAt");

-- CreateIndex
CREATE INDEX "DualPartnership_deletedAt_idx" ON "DualPartnership"("deletedAt");

-- CreateIndex
CREATE INDEX "GalleryImage_galleryGroupId_idx" ON "GalleryImage"("galleryGroupId");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Location_studentProfileId_idx" ON "Location"("studentProfileId");

-- CreateIndex
CREATE INDEX "MaterialCompletion_studentProfileId_idx" ON "MaterialCompletion"("studentProfileId");

-- CreateIndex
CREATE INDEX "MaterialCompletion_completedAt_idx" ON "MaterialCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "News_isArchived_idx" ON "News"("isArchived");

-- CreateIndex
CREATE INDEX "News_deletedAt_idx" ON "News"("deletedAt");

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_isArchived_idx" ON "Notification"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Position_companyId_idx" ON "Position"("companyId");

-- CreateIndex
CREATE INDEX "Position_isActive_idx" ON "Position"("isActive");

-- CreateIndex
CREATE INDEX "Position_deletedAt_idx" ON "Position"("deletedAt");

-- CreateIndex
CREATE INDEX "Position_majorId_idx" ON "Position"("majorId");

-- CreateIndex
CREATE INDEX "Position_locationId_idx" ON "Position"("locationId");

-- CreateIndex
CREATE INDEX "Position_deadline_idx" ON "Position"("deadline");

-- CreateIndex
CREATE INDEX "StudentProfile_majorId_idx" ON "StudentProfile"("majorId");

-- CreateIndex
CREATE INDEX "StudentProfile_firstChoiceId_idx" ON "StudentProfile"("firstChoiceId");

-- CreateIndex
CREATE INDEX "StudentProfile_secondChoiceId_idx" ON "StudentProfile"("secondChoiceId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");
