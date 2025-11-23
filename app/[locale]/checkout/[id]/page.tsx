/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { getOrderById } from "@/lib/actions/order.actions"
import PaymentForm from "./payment-form"
import Stripe from "stripe"

export const metadata = {
  title: "Payment",
}

const CheckoutPaymentPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const serializedOrder = JSON.parse(JSON.stringify(order))

  const session = await auth()

  let client_secret = null
  if (serializedOrder.paymentMethod === "Stripe" && !serializedOrder.isPaid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(serializedOrder.totalPrice * 100),
      currency: "USD",
      metadata: { orderId: serializedOrder._id },
    })
    client_secret = paymentIntent.client_secret
  }
  return (
    <PaymentForm
      order={serializedOrder}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
      clientSecret={client_secret}
    />
  )
}

export default CheckoutPaymentPage
