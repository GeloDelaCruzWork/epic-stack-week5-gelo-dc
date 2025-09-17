import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedEmployees() {
  console.log('Seeding employees and assignments...');

  // Create some sample positions, departments, and offices if they don't exist
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { code: 'SWENG' },
      update: {},
      create: { code: 'SWENG', title: 'Software Engineer', level: 3 },
    }),
    prisma.position.upsert({
      where: { code: 'QAENG' },
      update: {},
      create: { code: 'QAENG', title: 'QA Engineer', level: 2 },
    }),
    prisma.position.upsert({
      where: { code: 'PM' },
      update: {},
      create: { code: 'PM', title: 'Project Manager', level: 4 },
    }),
    prisma.position.upsert({
      where: { code: 'HRSP' },
      update: {},
      create: { code: 'HRSP', title: 'HR Specialist', level: 2 },
    }),
    prisma.position.upsert({
      where: { code: 'MKTG' },
      update: {},
      create: { code: 'MKTG', title: 'Marketing Specialist', level: 2 },
    }),
    prisma.position.upsert({
      where: { code: 'ACC' },
      update: {},
      create: { code: 'ACC', title: 'Accountant', level: 3 },
    }),
  ]);

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'ENG' },
      update: {},
      create: { code: 'ENG', name: 'Engineering' },
    }),
    prisma.department.upsert({
      where: { code: 'QA' },
      update: {},
      create: { code: 'QA', name: 'Quality Assurance' },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: { code: 'HR', name: 'Human Resources' },
    }),
    prisma.department.upsert({
      where: { code: 'MKT' },
      update: {},
      create: { code: 'MKT', name: 'Marketing' },
    }),
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: {},
      create: { code: 'FIN', name: 'Finance' },
    }),
  ]);

  const offices = await Promise.all([
    prisma.office.upsert({
      where: { code: 'HQ' },
      update: {},
      create: { code: 'HQ', name: 'Headquarters', address: '123 Main St', city: 'Anytown' },
    }),
    prisma.office.upsert({
      where: { code: 'BR1' },
      update: {},
      create: { code: 'BR1', name: 'Branch 1', address: '456 Oak Ave', city: 'Otherville' },
    }),
    prisma.office.upsert({
      where: { code: 'BR2' },
      update: {},
      create: { code: 'BR2', name: 'Branch 2', address: '789 Pine Ln', city: 'Anotherburg' },
    }),
  ]);

  const genders = ['M', 'F'];
  const civilStatuses = ['Single', 'Married', 'Widowed', 'Separated'];
  const employmentTypes = ['Regular', 'Contractual', 'Probationary'];

  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const middleName = faker.person.middleName();
    const email = faker.internet.email({ firstName, lastName });
    const mobileNumber = faker.phone.number('##########');
    const dateHired = faker.date.past({ years: 5 });
    const birthDate = faker.date.past({ years: 30, refDate: dateHired });
    const gender = faker.helpers.arrayElement(genders);
    const civilStatus = faker.helpers.arrayElement(civilStatuses);

    const employee = await prisma.employee.create({
      data: {
        employeeCode: `EMP-${faker.string.uuid().substring(0, 8).toUpperCase()}`,
        firstName,
        lastName,
        middleName,
        email,
        mobileNumber,
        dateHired,
        dateRegular: faker.helpers.arrayElement([null, faker.date.soon({ days: 365, refDate: dateHired })]),
        birthDate,
        gender,
        civilStatus,
        isActive: true,
      },
    });

    // Create at least one assignment for each employee
    const randomPosition = faker.helpers.arrayElement(positions);
    const randomDepartment = faker.helpers.arrayElement(departments);
    const randomOffice = faker.helpers.arrayElement([null, ...offices]);
    const effectiveDate = faker.date.soon({ days: 30, refDate: employee.dateHired });

    await prisma.employeeAssignment.create({
      data: {
        employeeId: employee.id,
        positionId: randomPosition.id,
        departmentId: randomDepartment.id,
        officeId: randomOffice?.id,
        employmentType: faker.helpers.arrayElement(employmentTypes),
        effectiveDate,
        endDate: faker.helpers.arrayElement([null, faker.date.future({ years: 5, refDate: effectiveDate })]),
        isPrimary: true,
        remarks: faker.helpers.arrayElement([null, faker.lorem.sentence()]),
      },
    });
  }

  console.log('Employee seeding complete.');
}
