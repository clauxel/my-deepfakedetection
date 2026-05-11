import { handleReminder } from '../../worker/index.js'

export function onRequest(context) {
  return handleReminder(context.request, context.env)
}
