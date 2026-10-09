import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const VALID_STATUSES = ["pending", "confirmed", "delivered"] as const
type DeliveryStatus = (typeof VALID_STATUSES)[number]

type StatusBody = {
  status: DeliveryStatus
}

export async function POST(
  req: MedusaRequest<StatusBody>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { status } = req.body ?? {}

  if (!status || !VALID_STATUSES.includes(status as DeliveryStatus)) {
    res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    })
    return
  }

  try {
    const orderService = req.scope.resolve(Modules.ORDER)
    const updated = await orderService.updateOrders(id, {
      metadata: { delivery_status: status },
    })
    res.json({ order: updated })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({ message })
  }
}
