import { defineWidgetConfig } from "@medusajs/admin-sdk"

const HideDraftsSidebarItem = () => {
  return (
    <style>
      {`
        /* Hide built-in Medusa Orders (cart icon link) and Drafts sidebar entries */
        a[href="/orders"]:not([href="/simple-orders"]):not([href="/app/simple-orders"]),
        a[href="/app/orders"]:not([href="/simple-orders"]):not([href="/app/simple-orders"]),
        nav a[href="/orders"]:first-of-type,
        nav a[href="/app/orders"]:first-of-type,
        nav a[href="/draft-orders"],
        nav a[href="/app/draft-orders"] { 
          display: none !important; 
        }
      `}
    </style>
  )
}

export const config = defineWidgetConfig({
  zone: [
    "product.list.before",
    "order.list.before",
    "customer.list.before",
    "promotion.list.before",
  ],
})

export default HideDraftsSidebarItem
