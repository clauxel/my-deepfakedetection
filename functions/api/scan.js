import { handleScan } from '../../worker/index.js'

export function onRequest(context) {
  return handleScan(context.request, context.env)
}
