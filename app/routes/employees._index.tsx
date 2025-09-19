import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { MasterDetailModule, MenuModule, ColumnsToolPanelModule, SetFilterModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Input } from '#app/components/ui/input.tsx';
import { useTheme } from '#app/routes/resources+/theme-switch.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#app/components/ui/select.tsx';
import type { ColDef, GridOptions, GridApi, GridReadyEvent, ICellRendererParams, GetDetailRowDataParams } from 'ag-grid-community';
import { useLoaderData } from 'react-router';
import { useSearchParams, useNavigation } from 'react-router-dom';
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx';
import { Button } from '#app/components/ui/button.tsx';
import type { Employee, EmployeeAssignment } from '@prisma/client';
import Modal from '#app/components/modal.tsx';
import NewEmployeeForm from '#app/routes/employees.new.tsx';


// Type definitions for our data shapes after processing

type FormattedAssignment = Omit<EmployeeAssignment, 'department' | 'position' | 'office'> & {
    department: string;
    position: string;
    office: string | undefined;
}

type FormattedEmployee = Employee & {
    fullName: string;
    status: 'Active' | 'Inactive';
    assignments: FormattedAssignment[];
}

interface EmployeeLoaderData {
    employees: FormattedEmployee[];
    totalCount: number;
    page: number;
    pageSize: number;
    search?: string;
    department?: string;
    position?: string;
    status?: string;
}

// Register AG Grid modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  MasterDetailModule,
  MenuModule,
  ColumnsToolPanelModule,
  SetFilterModule,
]);

export async function loader({ request }: { request: Request }): Promise<EmployeeLoaderData> {
	const url = new URL(request.url);

	// Forward all search params to the API route
	const api_url = new URL('/api/employees', url.origin);
	api_url.search = url.search;

	const response = await fetch(api_url.href);

	if (!response.ok) {
		// In a real app, you'd want to handle this error more gracefully
		throw new Response('Failed to load employees from API', {
			status: response.status,
		});
	}

    const data = await response.json();
	return data as EmployeeLoaderData;
}

const StatusCellRenderer = (params: ICellRendererParams) => {
  const html =
    params.value === 'Active'
      ? '<span class="text-green-600">●</span> Active'
      : '<span class="text-red-600">●</span> Inactive';
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const EmployeeGridSkeleton = ({ theme, pageSize }: { theme: string | null; pageSize: number }) => (
  <div className={`ag-theme-quartz${theme === 'dark' ? '-dark' : ''} h-full w-[90%] mx-auto`}>
    <div className="space-y-2">
      <div className="h-12 animate-pulse rounded-md bg-gray-300/50 dark:bg-gray-600/50" />
      {Array.from({ length: pageSize }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-gray-200/50 dark:bg-gray-700/50" />
      ))}
    </div>
  </div>
);

export default function EmployeeDirectory() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { employees, totalCount, page, pageSize, search, department, position, status } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState(search || '');

  const handleFilterChange = useCallback((filterName: string, value: string) => {
    setSearchParams(prev => {
        const newSearchParams = new URLSearchParams(prev);
        if (value === 'all' || !value) {
            newSearchParams.delete(filterName);
        } else {
            newSearchParams.set(filterName, value);
        }
        newSearchParams.set('page', '1');
        return newSearchParams;
    });
  }, [setSearchParams]);

  useEffect(() => {
    // To prevent resetting the page when navigating, we only trigger the
    // search effect if the input value differs from the URL search param.
    if (searchTerm === (search || '')) return;

    const handler = setTimeout(() => {
      handleFilterChange('search', searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, search, handleFilterChange]);

  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);

  function closeNewEmployeeModal() {
    setIsNewEmployeeModalOpen(false);
  }

  function openNewEmployeeModal() {
    setIsNewEmployeeModalOpen(true);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams(prev => {
        const newSearchParams = new URLSearchParams(prev);
        newSearchParams.set('page', String(newPage));
        return newSearchParams;
      });
    },
    [setSearchParams],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: string) => {
      setSearchParams(prev => {
        const newSearchParams = new URLSearchParams(prev);
        newSearchParams.set('pageSize', newPageSize);
        newSearchParams.set('page', '1'); // reset to first page
        return newSearchParams;
      });
    },
    [setSearchParams],
  );

  const gridRef = useRef<AgGridReact | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const defaultColDef = useMemo(() => ({ filter: true, sortable: true, resizable: true }), []);

  const [employeeColumns] = useState<ColDef<FormattedEmployee>[]>([
    { field: 'employeeCode', headerName: 'Employee Code', width: 200, sortable: true, filter: true, cellRenderer: 'agGroupCellRenderer' },
    { field: 'fullName', headerName: 'Full Name', width: 200, sortable: true, filter: true },
    { field: 'email', headerName: 'Email', width: 250, sortable: true, filter: true },
    {
      headerName: 'Department',
      width: 150,
      sortable: true,
      filter: 'agSetColumnFilter',
      valueGetter: (params) => params.data?.assignments[0]?.department,
    },
    {
      headerName: 'Position',
      width: 150,
      sortable: true,
      filter: 'agSetColumnFilter',
      valueGetter: (params) => params.data?.assignments[0]?.position,
    },
    { field: 'dateHired', headerName: 'Date Hired', width: 150, sortable: true, filter: 'agDateColumnFilter' },
    {
      headerName: 'Type',
      width: 120,
      sortable: true,
      filter: 'agSetColumnFilter',
      valueGetter: (params) => params.data?.assignments[0]?.employmentType,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      filter: 'agSetColumnFilter',
      cellRenderer: StatusCellRenderer,
    },
  ]);

  const [assignmentColumns] = useState<ColDef<FormattedAssignment>[]>([
    { field: 'effectiveDate', headerName: 'Effective Date', width: 150, sortable: true },
    { field: 'endDate', headerName: 'End Date', width: 150, sortable: true },
    { field: 'department', headerName: 'Department', width: 150, sortable: true },
    { field: 'position', headerName: 'Position', width: 200, sortable: true },
    { field: 'office', headerName: 'Office', width: 150, sortable: true },
    { field: 'employmentType', headerName: 'Employment Type', width: 200, sortable: true },
    { field: 'isPrimary', headerName: 'Primary', width: 100, sortable: true, cellRenderer: (p: ICellRendererParams) => (p.value ? '✓' : '') },
    { field: 'remarks', headerName: 'Remarks', flex: 1, sortable: false },
  ]);

  const detailCellRendererParams = useMemo(
    () => ({
      detailGridOptions: {
        columnDefs: assignmentColumns,
      },
      getDetailRowData: (params: GetDetailRowDataParams<FormattedEmployee>) => {
        fetch(`/api/employees/${params.data.id}/assignments`)
          .then((res) => {
            if (!res.ok) {
              console.error('Failed to fetch assignments');
              params.successCallback([]);
              return null;
            }
            return res.json();
          })
          .then((data) => {
            const result = data as { assignments: FormattedAssignment[] };
            if (result && result.assignments) {
                params.successCallback(result.assignments);
            } else {
                params.successCallback([]);
            }
          })
          .catch((error) => {
            console.error('Failed to fetch assignments:', error);
            params.successCallback([]);
          });
      },
    }),
    [assignmentColumns],
  );

  const gridOptions: GridOptions = {
    masterDetail: true,
    detailCellRendererParams,
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      const v = emp.assignments?.[0]?.department;
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [employees]);

  const positions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      const v = emp.assignments?.[0]?.position;
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [employees]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
      </div>

      {/* Filters as a form */}
      <div className="flex justify-center gap-4 p-4 items-end">
        <div className="flex flex-col">
          <label htmlFor="search" className="text-sm font-medium mb-1">Search</label>
          <Input
            id="search"
            name="search"
            placeholder="Quick search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="department" className="text-sm font-medium mb-1">Department</label>
          <Select
            name="department"
            value={department || 'all'}
            onValueChange={(value) => handleFilterChange('department', value)}
          >
            <SelectTrigger className="w-40" id="department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dep) => (
                <SelectItem key={dep} value={dep}>{dep}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="position" className="text-sm font-medium mb-1">Position</label>
          <Select
            name="position"
            value={position || 'all'}
            onValueChange={(value) => handleFilterChange('position', value)}
          >
            <SelectTrigger className="w-40" id="position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm font-medium mb-1">Status</label>
          <Select
            name="status"
            value={status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-32" id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSearchParams({ page: '1', pageSize: String(pageSize) });
            }}
          >
            Reset
          </Button>
		  <Button
            type="button"
            onClick={openNewEmployeeModal}>
            Add New Employee
          </Button>
        </div>
      </div>

      {navigation.state === 'loading' ? (
        <EmployeeGridSkeleton theme={theme} pageSize={pageSize} />
      ) : (
        <div className={`ag-theme-quartz${theme === 'dark' ? '-dark' : ''} h-full w-[90%] mx-auto`} role="region" aria-label="Employee Data Grid">
          <AgGridReact
            ref={gridRef}
            onGridReady={onGridReady}
            rowData={employees}
            columnDefs={employeeColumns}
            gridOptions={gridOptions}
            domLayout="autoHeight"
            suppressFieldDotNotation
            defaultColDef={defaultColDef}
          />
        </div>
      )}

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page:</label>
          <Select onValueChange={handlePageSizeChange} defaultValue={String(pageSize)}>
            <SelectTrigger className="w-[70px]" id="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4" aria-label="Pagination controls">
          <span role="status" aria-live="polite" className="text-sm font-medium">
            Showing {Math.min(totalCount, (page - 1) * pageSize + 1)} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </span>
          <button onClick={() => handlePageChange(1)} disabled={page === 1} className="px-3 py-1 border rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black" aria-label="Go to first page">
            First
          </button>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black" aria-label="Go to previous page">
            Previous
          </button>
          <span role="status" aria-live="polite" className="text-sm font-medium">
            Page {page} of {totalPages}
            {navigation.state === 'loading' && <span className="ml-2 text-gray-500">(Loading...)</span>}
          </span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-3 py-1 border rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-.not-allowed text-black" aria-label="Go to next page">
            Next
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black" aria-label="Go to last page">
            Last
          </button>
        </div>
      </div>
	  <Modal
        isOpen={isNewEmployeeModalOpen}
        onClose={closeNewEmployeeModal}
        title="Add New Employee"
      >
        <NewEmployeeForm />
      </Modal>
    </div>
  );
}

export const ErrorBoundary = GeneralErrorBoundary;