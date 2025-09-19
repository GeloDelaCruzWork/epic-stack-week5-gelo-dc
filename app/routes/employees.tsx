import { Link, Outlet } from 'react-router-dom'

export default function Employees() {

  return (
    <div className="h-full">
      <div className="flex items-center justify-center p-4">
        <h1 className="text-4xl font-bold">Employee Directory</h1>
      </div>
      <nav className="p-4">
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
