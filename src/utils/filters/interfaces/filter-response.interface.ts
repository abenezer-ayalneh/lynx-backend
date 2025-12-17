export default interface FilterResponseInterface {
	statusCode: number
	errorType: string
	message: string
	data?: string | object
}
