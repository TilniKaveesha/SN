import type { Metadata } from "next"
import CheckoutForm from "./checkout-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCustomerDetails } from "@/lib/actions/user.actions"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/checkout")
  }

  const customerDetailsResult = await getCustomerDetails()
  const savedCustomerDetails = customerDetailsResult.success ? customerDetailsResult.data : null

  return <CheckoutForm userEmail={session.user.email || ""} savedCustomerDetails={savedCustomerDetails} />
}
