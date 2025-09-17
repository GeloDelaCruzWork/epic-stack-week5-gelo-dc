import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useState,
	useEffect,
} from 'react'
import { ICellEditorParams } from 'ag-grid-community'

export interface DateEditorProps extends ICellEditorParams {}

export const DateEditor = forwardRef((props: DateEditorProps, ref) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const [value, setValue] = useState<string>('')

	useEffect(() => {
		// Convert the initial value to a date string for the input
		if (props.value) {
			const date = new Date(props.value)
			if (!isNaN(date.getTime())) {
				// Format as YYYY-MM-DD for the date input
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				setValue(`${year}-${month}-${day}`)
			}
		}
	}, [props.value])

	useEffect(() => {
		// Focus on the input when the editor is created
		if (inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}
	}, [])

	useImperativeHandle(ref, () => ({
		getValue: () => {
			// Return the date as an ISO string
			if (value) {
				const date = new Date(value)
				if (!isNaN(date.getTime())) {
					return date.toISOString()
				}
			}
			return props.value
		},
		isCancelBeforeStart: () => false,
		isCancelAfterEnd: () => false,
	}))

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			props.stopEditing()
		} else if (e.key === 'Escape') {
			props.stopEditing(true)
		}
	}

	return (
		<input
			ref={inputRef}
			type="date"
			value={value}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			className="bg-background h-full w-full border-0 px-2 outline-none"
			style={{ lineHeight: 'normal' }}
		/>
	)
})

DateEditor.displayName = 'DateEditor'
