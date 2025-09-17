import { Html5QrcodeScanner } from 'html5-qrcode'
import QRCode from 'qrcode'
import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/styles/ag-theme-quartz.css'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

const ClockInSchema = z.object({
	qrCodeData: z.string(),
	time: z.string(),
	fullName: z.string().min(1, 'Full Name is required'),
	detachment: z.string().min(1, 'Detachment is required'),
})

export default function ClockInOut() {
	const theme = useTheme()
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
	const [data, setData] = useState('')
	const [time, setTime] = useState(new Date())
	const [isScanning, setIsScanning] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [scannedData, setScannedData] = useState('')
	const [errors, setErrors] = useState<any>({})

	const [rowData, setRowData] = useState<any[]>([])

	const gridThemeClass =
		theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'

	const fetchQrCodes = useCallback(async () => {
		const response = await fetch('/api/qr-code')
		const data = await response.json()
		const formattedData = data.qrCodes.map((qr: any) => {
			const date = new Date(qr.time)
			return {
				qrCodeData: qr.data,
				date: date.toLocaleDateString(),
				time: date.toLocaleTimeString(),
				fullName: qr.fullName,
				detachment: qr.detachment,
			}
		})
		setRowData(formattedData)
	}, [])

	useEffect(() => {
		fetchQrCodes()
	}, [fetchQrCodes])

	const [colDefs, setColDefs] = useState([
		{ field: 'qrCodeData' },
		{ field: 'date' },
		{ field: 'time' },
		{ field: 'fullName' },
		{ field: 'detachment' },
	])

	const generateQrCode = async () => {
		const randomData = Math.random().toString(36).substring(2, 15)
		const url = await QRCode.toDataURL(randomData)
		setQrCodeDataUrl(url)
		setData(randomData)
	}

	useEffect(() => {
		generateQrCode()
		const interval = setInterval(() => {
			setTime(new Date())
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		const interval = setInterval(() => {
			generateQrCode()
		}, 10000) // Refresh QR code every 10 seconds
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (!isScanning) return

		const scanner = new Html5QrcodeScanner(
			'qr-scanner',
			{ fps: 10, qrbox: 250 },
			false,
		)

		const onScanSuccess = (decodedText: string) => {
			setScannedData(decodedText)
			setIsModalOpen(true)
			setIsScanning(false)
			scanner.clear()
		}

		scanner.render(onScanSuccess, undefined)

		return () => {
			try {
				scanner.clear()
			} catch (error) {
				console.error('Failed to clear scanner.', error)
			}
		}
	}, [isScanning])

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const submissionData = Object.fromEntries(formData)
		const submission = ClockInSchema.safeParse(submissionData)

		if (!submission.success) {
			setErrors(submission.error.flatten().fieldErrors)
			return
		}

		const response = await fetch('/api/qr-code', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(submission.data),
		})

		if (!response.ok) {
			const errorData = await response.json()
			if (errorData.errors) {
				setErrors(errorData.errors)
			} else {
				setErrors({ form: ['An unknown error occurred.'] })
			}
			return
		}

		setIsModalOpen(false)
		setErrors({})
		fetchQrCodes()
	}

	return (
		<div className="flex h-screen bg-gray-100 dark:bg-black">
			<div className="flex w-1/2 flex-col items-center justify-center p-4">
				<div className="rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
					<h1 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-gray-200">
						Scan for Clock Out
					</h1>
					<div
						className="mb-4 text-center text-lg text-gray-800 dark:text-gray-200"
						suppressHydrationWarning
					>
						{time.toLocaleTimeString()}
					</div>
					<div className="flex justify-center">
						{qrCodeDataUrl && (
							<img
								src={qrCodeDataUrl}
								alt="QR Code"
								className="h-64 w-64"
							/>
						)}
					</div>
					<div className="mt-4 text-center text-sm text-gray-800 dark:text-gray-200">
						QR Code Data: {data}
					</div>
				</div>
				<div className="mt-4 flex gap-4">
					<Button onClick={generateQrCode}>Refresh QR Code</Button>
					<Button onClick={() => setIsScanning(true)}>Scan QR Code</Button>
				</div>
			</div>
			<div className="w-1/2 p-4">
				<div className={`${gridThemeClass} h-[500px] w-full`}>
					<AgGridReact rowData={rowData} columnDefs={colDefs} />
				</div>
			</div>

			{isScanning && (
				<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-white p-4">
						<div id="qr-scanner" />
						<Button
							variant="destructive"
							className="mt-4 w-full"
							onClick={() => setIsScanning(false)}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="dark:text-white">
					<DialogHeader>
						<DialogTitle>Clock Out</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit}>
						<div className="space-y-4">
							<div>
								<Label htmlFor="qrCodeData">QR Code Data</Label>
								<Input
									id="qrCodeData"
									name="qrCodeData"
									value={scannedData}
									readOnly
								/>
							</div>
							<div>
								<Label>Date & Time</Label>
								<Input
									type="text"
									value={new Date().toLocaleString()}
									readOnly
								/>
								<Input
									type="hidden"
									name="time"
									value={new Date().toISOString()}
								/>
							</div>
							<div>
								<Label htmlFor="fullName">Full Name</Label>
								<Input id="fullName" name="fullName" />
								{errors?.fullName && (
									<p className="text-sm text-red-500">{errors.fullName}</p>
								)}
							</div>
							<div>
								<Label htmlFor="detachment">Detachment</Label>
								<Input id="detachment" name="detachment" />
								{errors?.detachment && (
									<p className="text-sm text-red-500">
										{errors.detachment}
									</p>
								)}
							</div>
							{errors?.qrCodeData && (
								<p className="text-sm text-red-500">{errors.qrCodeData}</p>
							)}
							{errors?.form && (
								<p className="text-sm text-red-500">{errors.form}</p>
							)}
						</div>
						<div className="mt-4 flex justify-end">
							<Button type="submit">Submit</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}