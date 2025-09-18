-- CreateIndex
CREATE INDEX "employee_assignments_employee_id_effective_date_idx" ON "hr"."employee_assignments"("employee_id", "effective_date");

-- CreateIndex
CREATE INDEX "employee_assignments_department_id_idx" ON "hr"."employee_assignments"("department_id");

-- CreateIndex
CREATE INDEX "employee_assignments_position_id_idx" ON "hr"."employee_assignments"("position_id");

-- CreateIndex
CREATE INDEX "employee_assignments_office_id_idx" ON "hr"."employee_assignments"("office_id");

-- CreateIndex
CREATE INDEX "employees_last_name_first_name_idx" ON "hr"."employees"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "employees_is_active_idx" ON "hr"."employees"("is_active");

-- CreateIndex
CREATE INDEX "Session_expirationDate_idx" ON "public"."Session"("expirationDate");
