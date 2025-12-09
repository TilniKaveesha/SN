import { Resend } from 'resend'
import PurchaseReceiptEmail, { OrderEmail } from './purchase-receipt'
import AskReviewOrderItemsEmail from './ask-review-order-items'
import { IOrder } from '@/lib/db/models/order.model'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY as string)

/* ---------------------------------------------------------
   HELPER: Convert IOrder (Mongoose) -> OrderEmail (DTO)
--------------------------------------------------------- */
const toOrderEmail = (order: IOrder): OrderEmail => ({
  _id: order._id.toString(),
  isPaid: order.isPaid,
  paidAt: order.paidAt ?? null,
  totalPrice: order.totalPrice,
  itemsPrice: order.itemsPrice,
  taxPrice: order.taxPrice,
  shippingPrice: order.shippingPrice,
  paymentMethod: order.paymentMethod,
  expectedDeliveryDate: order.expectedDeliveryDate ?? null,
  isDelivered: order.isDelivered,
  createdAt: order.createdAt,

  // ensure user is always an object
  user:
    typeof order.user === 'string'
      ? { name: 'Customer', email: '' } // fallback for unpopulated user
      : { name: order.user.name, email: order.user.email },

  shippingAddress: {
    fullName: order.shippingAddress.fullName,
    street: order.shippingAddress.street,
    city: order.shippingAddress.city,
    postalCode: order.shippingAddress.postalCode,
    country: order.shippingAddress.country,
    phone: order.shippingAddress.phone,
    province: order.shippingAddress.province,
  },

  items: order.items.map((item) => ({
    clientId: item.clientId,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    product: item.product.toString(),
    slug: item.slug,
    category: item.category,
    countInStock: item.countInStock,
  })),
})

/* ---------------------------------------------------------
   SEND PURCHASE RECEIPT EMAIL
--------------------------------------------------------- */
export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  const orderDTO = toOrderEmail(order)

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: orderDTO.user.email,
    subject: 'Order Confirmation',
    react: <PurchaseReceiptEmail order={orderDTO} />,
  })
}

/* ---------------------------------------------------------
   SEND ASK REVIEW EMAIL (SCHEDULED 1 DAY LATER)
--------------------------------------------------------- */
export const sendAskReviewOrderItems = async ({ order }: { order: IOrder }) => {
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  const orderDTO = toOrderEmail(order)

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: orderDTO.user.email,
    subject: 'Review your order items',
    react: <AskReviewOrderItemsEmail order={orderDTO} />,
    scheduledAt: oneDayFromNow,
  })
}
