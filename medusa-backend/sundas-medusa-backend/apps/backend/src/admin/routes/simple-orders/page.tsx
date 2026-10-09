
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag } from "@medusajs/icons"
import {
  Badge,
  Container,
  DropdownMenu,
  Heading,
  Table,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useCallback, useState } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string
  title?: string
  product_title?: string
  thumbnail?: string | null
  variant?: {
    product?: {
      title?: string
      thumbnail?: string | null
    }
  }
}

type ShippingAddress = {
  first_name?: string
  last_name?: string
  phone?: string
}

type PaymentCollection = {
  payment_provider_id?: string
}

type OrderMetadata = {
  delivery_status?: string
  [key: string]: unknown
}

type Order = {
  id: string
  display_id?: number
  created_at?: string
  items?: OrderItem[]
  shipping_address?: ShippingAddress
  payment_collections?: PaymentCollection[]
  metadata?: OrderMetadata | null
}

type OrdersResponse = {
  orders: Order[]
  count: number
  offset: number
  limit: number
}

type DeliveryStatus = "pending" | "confirmed" | "delivered"

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDeliveryStatus(order: Order): DeliveryStatus {
  const raw = order.metadata?.delivery_status
  if (raw === "confirmed" || raw === "delivered") return raw
  return "pending"
}

function statusBadgeColor(status: DeliveryStatus) {
  switch (status) {
    case "confirmed":
      return "green" as const
    case "delivered":
      return "blue" as const
    default:
      return "orange" as const
  }
}

function statusLabel(status: DeliveryStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmed"
    case "delivered":
      return "Delivered"
    default:
      return "Pending"
  }
}

function getPaymentMethod(order: Order): string {
  const providerId = order.payment_collections?.[0]?.payment_provider_id
  return providerId === "pp_system_default"
    ? "Cash on Delivery"
    : "Online Payment"
}

function getProductDisplay(order: Order): {
  name: string
  thumbnail: string | null
} {
  const items = order.items ?? []
  const first = items[0]
  if (!first) return { name: "No items", thumbnail: null }

  const name =
    first.product_title ??
    first.variant?.product?.title ??
    first.title ??
    "Product"
  const thumbnail =
    first.thumbnail ??
    first.variant?.product?.thumbnail ??
    null
  const extra = items.length - 1

  return {
    name: extra > 0 ? `${name} +${extra} more` : name,
    thumbnail,
  }
}

function getCustomerName(order: Order): string {
  const addr = order.shipping_address
  if (!addr) return "—"
  return [addr.first_name, addr.last_name].filter(Boolean).join(" ") || "—"
}

function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ── Fetch ────────────────────────────────────────────────────────────────────

const ORDER_FIELDS =
  "+metadata,*items,*items.variant,*items.variant.product,*shipping_address,*payment_collections"

async function fetchOrders(): Promise<OrdersResponse> {
  const res = await fetch(
    `/admin/orders?fields=${encodeURIComponent(ORDER_FIELDS)}&order=-created_at&limit=50`,
    { credentials: "include" }
  )
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

async function updateOrderStatus(
  orderId: string,
  status: DeliveryStatus
): Promise<void> {
  const res = await fetch(`/admin/custom/orders/${orderId}/status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string
    }
    throw new Error(data.message ?? "Failed to update status")
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const SimpleOrdersPage = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["simple-orders"],
    queryFn: fetchOrders,
  })

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: DeliveryStatus) => {
      setUpdatingId(orderId)
      try {
        await updateOrderStatus(orderId, newStatus)
        toast.success("Status updated", {
          description: `Order marked as ${statusLabel(newStatus)}`,
        })
        await queryClient.invalidateQueries({
          queryKey: ["simple-orders"],
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        toast.error("Update failed", { description: msg })
      } finally {
        setUpdatingId(null)
      }
    },
    [queryClient]
  )

  const orders = data?.orders ?? []

  return (
    <Container className="divide-y p-0">
      <Toaster />
      <style>
        {`
          nav a[href="/orders"],
          nav a[href="/app/orders"],
          nav a[href="/draft-orders"],
          nav a[href="/app/draft-orders"] {
            display: none !important;
          }
        `}
      </style>
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Orders</Heading>
        <span style={{ fontSize: 13, color: "#889096" }}>
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading && (
        <div className="px-6 py-12" style={{ textAlign: "center", color: "#889096" }}>
          Loading orders...
        </div>
      )}

      {error && (
        <div className="px-6 py-12" style={{ textAlign: "center", color: "#e5484d" }}>
          Failed to load orders. Please refresh the page.
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="px-6 py-12" style={{ textAlign: "center", color: "#889096" }}>
          No orders yet.
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell>Payment</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell style={{ width: 50 }}></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((order) => {
              const currentStatus = getDeliveryStatus(order)
              const product = getProductDisplay(order)
              const isUpdating = updatingId === order.id

              return (
                <Table.Row
                  key={order.id}
                  style={{
                    cursor: "pointer",
                    opacity: isUpdating ? 0.5 : 1,
                  }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <Table.Cell>{formatDate(order.created_at)}</Table.Cell>
                  <Table.Cell>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <span style={{ fontSize: 13 }}>{product.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{getCustomerName(order)}</Table.Cell>
                  <Table.Cell>
                    {order.shipping_address?.phone ?? "—"}
                  </Table.Cell>
                  <Table.Cell>{getPaymentMethod(order)}</Table.Cell>
                  <Table.Cell>
                    <Badge color={statusBadgeColor(currentStatus)}>
                      {statusLabel(currentStatus)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell
                    onClick={(e) => e.stopPropagation()}
                    style={{ textAlign: "center" }}
                  >
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 8px",
                            fontSize: 18,
                            lineHeight: 1,
                            color: "#889096",
                          }}
                          title="Actions"
                        >
                          ⋯
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        {currentStatus !== "confirmed" && (
                          <DropdownMenu.Item
                            onClick={() =>
                              handleStatusChange(order.id, "confirmed")
                            }
                          >
                            Confirm Order
                          </DropdownMenu.Item>
                        )}
                        {currentStatus !== "delivered" && (
                          <DropdownMenu.Item
                            onClick={() =>
                              handleStatusChange(order.id, "delivered")
                            }
                          >
                            Mark as Delivered
                          </DropdownMenu.Item>
                        )}
                        {currentStatus !== "pending" && (
                          <DropdownMenu.Item
                            onClick={() =>
                              handleStatusChange(order.id, "pending")
                            }
                          >
                            Mark as Pending
                          </DropdownMenu.Item>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Orders",
  icon: ShoppingBag,
})

export default SimpleOrdersPage
