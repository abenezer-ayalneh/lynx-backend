import { tz } from '@date-fns/tz/tz'
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isFuture, parseISO } from 'date-fns'

/**
 * A custom validation decorator for checking if a given date is in the future.
 * This decorator ensures that the value of the decorated property is a date string
 * representing a date that occurs after the current date and time.
 *
 * @param timezoneFieldName - The timezone field name to be extracted from the DTO
 * @param {ValidationOptions} [validationOptions] - Optional validation configuration options,
 * such as a custom error message.
 *
 * @returns {(object: object, propertyName: string) => void} - A function that registers the custom decorator.
 */
const IsInTheFuture = (timezoneFieldName: string, validationOptions?: ValidationOptions): ((object: object, propertyName: string) => void) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isInTheFuture',
      target: object.constructor,
      propertyName,
      constraints: [timezoneFieldName],
      options: {
        message: 'Date must be in the future',
        ...validationOptions,
      },
      async: false,
      validator: {
        validate(dateString: string, args: ValidationArguments) {
          const constraint = args.constraints[0] as string
          if (!args.object[constraint]) {
            throw Error('Constraint name does not exist inside the dto')
          }

          const timezone = args.object[constraint] as string
          const startTimeIso = parseISO(dateString, {
            in: tz(timezone),
          })

          return isFuture(startTimeIso)
        },
      },
    })
  }
}

export default IsInTheFuture
