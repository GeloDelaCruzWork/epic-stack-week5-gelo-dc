import { useState, useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { MasterDetailModule, MenuModule, ColumnsToolPanelModule, SetFilterModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Input } from '#app/components/ui/input.tsx';
import { useTheme } from '#app/routes/resources+/theme-switch.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#app/components/ui/select.tsx';
import type { ColDef, GridOptions, GridApi, GridReadyEvent } from 'ag-grid-community';
import { data, useLoaderData } from 'react-router';
import { prisma } from '#app/utils/db.server.ts';

// Register AG Grid modules (keep as you had)
ModuleRegistry.registerModules([
  AllCommunityModule,
  MasterDetailModule,
  MenuModule,
  ColumnsToolPanelModule,
  SetFilterModule,
]);

export async function loader() {
  const employees = await prisma.employee.findMany({
    include: {
      assignments: {
        include: {
          department: true,
          position: true,
          office: true,
        },
        orderBy: {
          effectiveDate: 'desc',
        },
      },
    },
  });
  return data({ employees });
}

const StatusCellRenderer = (params: any) => {
  const html = params.value === 'Active'
    ? '<span class="text-green-600">●</span> Active'
    : '<span class="text-red-600">●</span> Inactive';
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function EmployeeDirectory() {
  const theme = useTheme();
  const { employees: rawEmployees } = useLoaderData<typeof loader>();

  const employees = useMemo(
    () =>
      rawEmployees.map((emp) => ({
        ...emp,
        fullName: `${emp.lastName}, ${emp.firstName}`,
        status: emp.isActive ? 'Active' : 'Inactive',
        assignments: emp.assignments.map((a) => ({
          ...a,
          department: a.department.name,
          position: a.position.title,
          office: a.office?.name,
        })),
      })),
    [rawEmployees]
  );

  const gridRef = useRef<AgGridReact | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [quickFilterText, setQuickFilterText] = useState<string>(''); //function: Added quickFilterText state

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // store the API (sometimes gridRef.current.api is the more reliable source at runtime)
    gridApiRef.current = params.api;
  }, []);

  // defaultColDef to ensure filters exist
  const defaultColDef = useMemo(() => ({ filter: true, sortable: true, resizable: true }), []);

  // Use set filters for dropdown-like programmatic filtering
  const [employeeColumns] = useState<ColDef[]>([
  { field: 'employeeCode', headerName: 'Employee Code', width: 200, sortable: true, filter: true, cellRenderer: 'agGroupCellRenderer' },
  { field: 'fullName', headerName: 'Full Name', width: 200, sortable: true, filter: true },
  { field: 'email', headerName: 'Email', width: 200, sortable: true, filter: true },
  { field: 'department', headerName: 'Department', width: 150, sortable: true, filter: 'agSetColumnFilter', valueGetter: params => params.data.assignments[0]?.department },
  { field: 'position', headerName: 'Position', width: 150, sortable: true, filter: 'agSetColumnFilter', valueGetter: params => params.data.assignments[0]?.position },
  { field: 'dateHired', headerName: 'Date Hired', width: 120, sortable: true, filter: 'agDateColumnFilter' },
  { field: 'employmentType', headerName: 'Type', width: 120, sortable: true, filter: 'agSetColumnFilter', valueGetter: params => params.data.assignments[0]?.employmentType },
  { field: 'status', headerName: 'Status', width: 100, sortable: true, filter: 'agSetColumnFilter',
    cellRenderer: StatusCellRenderer
  }
]);

  const [assignmentColumns] = useState<ColDef[]>([
    { field: 'effectiveDate', headerName: 'Effective Date', width: 120, sortable: true },
    { field: 'endDate', headerName: 'End Date', width: 120, sortable: true },
    { field: 'department', headerName: 'Department', width: 150, sortable: true },
    { field: 'position', headerName: 'Position', width: 150, sortable: true },
    { field: 'office', headerName: 'Office', width: 150, sortable: true },
    { field: 'employmentType', headerName: 'Employment Type', width: 130, sortable: true },
    {
      field: 'isPrimary',
      headerName: 'Primary',
      width: 80,
      sortable: true,
      cellRenderer: (p: any) => (p.value ? '✓' : ''),
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1, sortable: false },
  ]);

  const detailCellRendererParams = useMemo(
    () => ({
      detailGridOptions: {
        columnDefs: assignmentColumns,
      },
      getDetailRowData: (params: any) => {
        params.successCallback(params.data.assignments);
      },
    }),
    [assignmentColumns]
  );

  const gridOptions: GridOptions = {
    masterDetail: true,
    detailCellRendererParams,
  };

  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleQuickFilter = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(e.target.value); //function: Updated handleQuickFilter to set quickFilterText state
  }, []);

  // Generic helper that sets the filter model for a column (avoids getFilterInstance())
  const setColumnFilterByValue = useCallback((colId: string, value: string) => {
    // get the "real" api either from stored ref or from the component ref (fallback)
    const api: GridApi | undefined = (gridApiRef.current ?? (gridRef.current as any)?.api) ?? undefined;
    if (!api) {
      // grid not ready yet; bail out quietly (or you can queue)
      console.warn('AG Grid API not ready yet — filter not applied.');
      return;
    }

    // get current model, update only the column in question
    const currentModel = api.getFilterModel ? api.getFilterModel() || {} : {};
    const newModel = { ...currentModel };

    if (value === 'all') {
      // remove filter for that column
      if (newModel.hasOwnProperty(colId)) delete newModel[colId];
    } else {
      // set SetFilter model shape
      newModel[colId] = { values: [value] };
    }

    api.setFilterModel(newModel);
  }, []);

  const handleDepartmentFilter = useCallback((value: string) => {
    setDepartmentFilter(value);
    setColumnFilterByValue('department', value);
  }, [setColumnFilterByValue]);

  const handlePositionFilter = useCallback((value: string) => {
    setPositionFilter(value);
    setColumnFilterByValue('position', value);
  }, [setColumnFilterByValue]);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setColumnFilterByValue('status', value);
  }, [setColumnFilterByValue]);

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
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
      </div>

      <div className="flex gap-4 p-4 border-b bg-muted/50">
        <Input placeholder="Quick search..." className="max-w-xs" onChange={handleQuickFilter} />

        <Select onValueChange={handleDepartmentFilter} defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handlePositionFilter} defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={`ag-theme-quartz${theme === 'dark' ? '-dark' : ''} h-full w-full`}>
        <AgGridReact
          ref={gridRef}
          onGridReady={onGridReady}
          rowData={employees}
          columnDefs={employeeColumns}
          gridOptions={gridOptions}
          domLayout="autoHeight"
          suppressFieldDotNotation
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText} //function: Added quickFilterText prop to AgGridReact
        />
      </div>
    </div>
  );
}