import { handleForecast } from '../../worker/index.js'

export function onRequest(context) {
  return handleForecast(context.request, context.env)
}
