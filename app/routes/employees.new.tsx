import { Form, redirect, type ActionFunctionArgs } from 'react-router-dom'
import { prisma } from '#app/utils/db.server'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const employeeCode = formData.get('employeeCode') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const middleName = formData.get('middleName') as string
  const email = formData.get('email') as string
  const mobileNumber = formData.get('mobileNumber') as string
  const dateHired = new Date(formData.get('dateHired') as string)
  const dateRegular = new Date(formData.get('dateRegular') as string)
  const birthDate = new Date(formData.get('birthDate') as string)
  const gender = formData.get('gender') as string
  const civilStatus = formData.get('civilStatus') as string

  await prisma.employee.create({
    data: {
      employeeCode,
      firstName,
      lastName,
      middleName,
      email,
      mobileNumber,
      dateHired,
      dateRegular,
      birthDate,
      gender,
      civilStatus,
    },
  })

  return redirect('/employees')
}

export default function NewEmployeeForm() {
  return (
    <Form method="post" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700">
            Employee Code
          </label>
          <input
            type="text"
            name="employeeCode"
            id="employeeCode"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
            Middle Name
          </label>
          <input
            type="text"
            name="middleName"
            id="middleName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <input
            type="text"
            name="mobileNumber"
            id="mobileNumber"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="dateHired" className="block text-sm font-medium text-gray-700">
            Date Hired
          </label>
          <input
            type="date"
            name="dateHired"
            id="dateHired"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="dateRegular" className="block text-sm font-medium text-gray-700">
            Date Regular
          </label>
          <input
            type="date"
            name="dateRegular"
            id="dateRegular"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Birth Date
          </label>
          <input
            type="date"
            name="birthDate"
            id="birthDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            name="gender"
            id="gender"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <label htmlFor="civilStatus" className="block text-sm font-medium text-gray-700">
            Civil Status
          </label>
          <select
            name="civilStatus"
            id="civilStatus"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add Employee
        </button>
      </div>
    </Form>
  )
}