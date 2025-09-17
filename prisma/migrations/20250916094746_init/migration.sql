-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hr";

-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "hr"."employees" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "email" TEXT,
    "mobile_number" TEXT,
    "date_hired" TIMESTAMP(3) NOT NULL,
    "date_regular" TIMESTAMP(3),
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "civil_status" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."employee_assignments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "office_id" TEXT,
    "employment_type" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,

    CONSTRAINT "employee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."positions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."offices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "hr"."employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "hr"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "catalog"."positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "catalog"."departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "offices_code_key" ON "catalog"."offices"("code");

-- AddForeignKey
ALTER TABLE "hr"."employee_assignments" ADD CONSTRAINT "employee_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_assignments" ADD CONSTRAINT "employee_assignments_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "catalog"."positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_assignments" ADD CONSTRAINT "employee_assignments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "catalog"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_assignments" ADD CONSTRAINT "employee_assignments_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "catalog"."offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
