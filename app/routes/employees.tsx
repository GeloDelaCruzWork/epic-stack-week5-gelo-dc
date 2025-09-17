import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Modal from '../components/modal'
import NewEmployeeForm from '../routes/employees.new'

export default function Employees() {
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false)

  function closeNewEmployeeModal() {
    setIsNewEmployeeModalOpen(false)
  }

  function openNewEmployeeModal() {
    setIsNewEmployeeModalOpen(true)
  }

  return (
    <div className="h-full">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Employees</h1>
        <nav className="mt-4">
          <button
            type="button"
            onClick={openNewEmployeeModal}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Add New Employee
          </button>
        </nav>
      </div>
      <main className="p-4">
        <Outlet />
      </main>

      <Modal
        isOpen={isNewEmployeeModalOpen}
        onClose={closeNewEmployeeModal}
        title="Add New Employee"
      >
        <NewEmployeeForm />
      </Modal>
    </div>
  )
}