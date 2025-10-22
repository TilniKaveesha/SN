/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { createOrder } from "@/lib/actions/order.actions"
import { calculateFutureDate } from "@/lib/utils"
import { ShippingAddressSchema } from "@/lib/validator"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import CheckoutFooter from "./checkout-footer"
import type { ShippingAddress } from "@/types"
import useIsMounted from "@/hooks/use-is-mounted"
import Link from "next/link"
import useCartStore from "@/hooks/use-cart-store"
import useSettingStore from "@/hooks/use-setting-store"
import ProductPrice from "@/components/shared/product/product-price"
import PayWayCheckout from "@/components/payway/payway-checkout"
import { saveCustomerDetails } from "@/lib/actions/user.actions"

const shippingAddressDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        fullName: "Basir",
        street: "1911, 65 Sherbrooke Est",
        city: "Montreal",
        province: "Quebec",
        phone: "4181234567",
        postalCode: "H2X 1C4",
        country: "Canada",
      }
    : {
        fullName: "",
        street: "",
        city: "",
        province: "",
        phone: "",
        postalCode: "",
        country: "",
      }

interface CheckoutFormProps {
  userEmail: string
  savedCustomerDetails?: {
    fullName?: string
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
    phone?: string
  } | null
}

const CheckoutForm = ({ userEmail, savedCustomerDetails }: CheckoutFormProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const {
    setting: { site, availablePaymentMethods, defaultPaymentMethod, availableDeliveryDates },
  } = useSettingStore()

  const {
    cart: {
      items,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      shippingAddress,
      deliveryDateIndex,
      paymentMethod = defaultPaymentMethod,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    clearCart,
    setDeliveryDateIndex,
  } = useCartStore()
  const isMounted = useIsMounted()

  const defaultValues =
    savedCustomerDetails && Object.values(savedCustomerDetails).some((v) => v)
      ? (savedCustomerDetails as ShippingAddress)
      : shippingAddress || shippingAddressDefaultValues

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues,
  })
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = async (values) => {
    setShippingAddress(values)
    await saveCustomerDetails(values)
    setIsAddressSelected(true)
  }

  useEffect(() => {
    if (!isMounted || !shippingAddress) return
    shippingAddressForm.setValue("fullName", shippingAddress.fullName)
    shippingAddressForm.setValue("street", shippingAddress.street)
    shippingAddressForm.setValue("city", shippingAddress.city)
    shippingAddressForm.setValue("country", shippingAddress.country)
    shippingAddressForm.setValue("postalCode", shippingAddress.postalCode)
    shippingAddressForm.setValue("province", shippingAddress.province)
    shippingAddressForm.setValue("phone", shippingAddress.phone)
  }, [items, isMounted, router, shippingAddress, shippingAddressForm])

  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] = useState<boolean>(false)

  const [isPayWayProcessing, setIsPayWayProcessing] = useState(false)
  const [showPayWayCheckout, setShowPayWayCheckout] = useState(false)

  const handlePlaceOrder = async () => {
    if (paymentMethod === "PayWay") {
      setShowPayWayCheckout(true)
      return
    }

    const res = await createOrder({
      items,
      shippingAddress,
      expectedDeliveryDate: calculateFutureDate(availableDeliveryDates[deliveryDateIndex!].daysToDeliver),
      deliveryDateIndex,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    })
    if (!res.success) {
      toast({
        description: res.message,
        variant: "destructive",
      })
    } else {
      toast({
        description: res.message,
        variant: "default",
      })
      clearCart()
      router.push(`/checkout/${res.data?.orderId}`)
    }
  }

  const handlePayWayOrder = async () => {
    setIsPayWayProcessing(true)

    try {
      const orderRes = await createOrder({
        items,
        shippingAddress,
        expectedDeliveryDate: calculateFutureDate(availableDeliveryDates[deliveryDateIndex!].daysToDeliver),
        deliveryDateIndex,
        paymentMethod: "PayWay",
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      })

      if (!orderRes.success) {
        throw new Error(orderRes.message)
      }

      clearCart()
      router.push(`/checkout/${orderRes.data?.orderId}`)
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Order creation failed",
        variant: "destructive",
      })
    } finally {
      setIsPayWayProcessing(false)
      setShowPayWayCheckout(false)
    }
  }

  const handleSelectPaymentMethod = () => {
    setIsAddressSelected(true)
    setIsPaymentMethodSelected(true)
  }
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)()
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className="p-4">
        {!isAddressSelected && (
          <div className="border-b mb-4">
            <Button className="rounded-full w-full" onClick={handleSelectShippingAddress}>
              Ship to this address
            </Button>
            <p className="text-xs text-center py-2">
              Choose a shipping address and payment method in order to calculate shipping, handling, and tax.
            </p>
          </div>
        )}
        {isAddressSelected && !isPaymentMethodSelected && (
          <div className=" mb-4">
            <Button className="rounded-full w-full" onClick={handleSelectPaymentMethod}>
              Use this payment method
            </Button>

            <p className="text-xs text-center py-2">
              Choose a payment method to continue checking out. You&apos;ll still have a chance to review and edit your
              order before it&apos;s final.
            </p>
          </div>
        )}
        {isPaymentMethodSelected && isAddressSelected && (
          <div>
            {showPayWayCheckout && paymentMethod === "PayWay" ? (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setShowPayWayCheckout(false)} className="w-full">
                  Back to Order Review
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={handlePlaceOrder} className="rounded-full w-full" disabled={isPayWayProcessing}>
                  {isPayWayProcessing ? "Processing..." : "Place Your Order"}
                </Button>
                <p className="text-xs text-center py-2">
                  By placing your order, you agree to {site.name}&apos;s{" "}
                  <Link href="/page/privacy-policy">privacy notice</Link> and
                  <Link href="/page/conditions-of-use"> conditions of use</Link>.
                </p>
              </>
            )}
          </div>
        )}

        <div>
          <div className="text-lg font-bold">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined ? (
                  "--"
                ) : shippingPrice === 0 ? (
                  "FREE"
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span> Tax:</span>
              <span>{taxPrice === undefined ? "--" : <ProductPrice price={taxPrice} plain />}</span>
            </div>
            <div className="flex justify-between  pt-4 font-bold text-lg">
              <span> Order Total:</span>
              <span>
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className="max-w-6xl mx-auto highlight-link">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div>
            {isAddressSelected && shippingAddress ? (
              <div className="grid grid-cols-1 md:grid-cols-12    my-3  pb-3">
                <div className="col-span-5 flex text-lg font-bold ">
                  <span className="w-8">1 </span>
                  <span>Customer Details</span>
                </div>
                <div className="col-span-5 ">
                  <p>
                    {shippingAddress.fullName} <br />
                    {shippingAddress.street} <br />
                    {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                  </p>
                </div>
                <div className="col-span-2">
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      setIsAddressSelected(false)
                      setIsPaymentMethodSelected(false)
                      setShowPayWayCheckout(false)
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex text-primary text-lg font-bold my-2">
                  <span className="w-8">1 </span>
                  <span>Enter Customer Details</span>
                </div>
                <Form {...shippingAddressForm}>
                  <form
                    method="post"
                    onSubmit={shippingAddressForm.handleSubmit(onSubmitShippingAddress)}
                    className="space-y-4"
                  >
                    <Card className="md:ml-8 my-4">
                      <CardContent className="p-4 space-y-2">
                        <div className="text-lg font-bold mb-2">Your Details</div>

                        <div className="flex flex-col gap-5 md:flex-row">
                          <FormField
                            control={shippingAddressForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={shippingAddressForm.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-col gap-5 md:flex-row">
                          <FormField
                            control={shippingAddressForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name="province"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter province" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter country" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-col gap-5 md:flex-row">
                          <FormField
                            control={shippingAddressForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter postal code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Phone number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="  p-4">
                        <Button type="submit" className="rounded-full font-bold">
                          Continue to Payment
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            )}
          </div>
          {/* payment method */}
          <div className="border-y">
            {isPaymentMethodSelected && paymentMethod ? (
              <div className="grid  grid-cols-1 md:grid-cols-12  my-3 pb-3">
                <div className="flex text-lg font-bold  col-span-5">
                  <span className="w-8">2 </span>
                  <span>Payment Method</span>
                </div>
                <div className="col-span-5 ">
                  <p>{paymentMethod}</p>
                  {paymentMethod === "PayWay" && (
                    <p className="text-sm text-gray-600">Secure payment with PayWay Cambodia</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPaymentMethodSelected(false)
                      setShowPayWayCheckout(false)
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isAddressSelected ? (
              <>
                <div className="flex text-primary text-lg font-bold my-2">
                  <span className="w-8">2 </span>
                  <span>Choose a payment method</span>
                </div>
                <Card className="md:ml-8 my-4">
                  <CardContent className="p-4">
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                      {availablePaymentMethods.map((pm) => (
                        <div key={pm.name} className="flex items-center py-1 ">
                          <RadioGroupItem value={pm.name} id={`payment-${pm.name}`} />
                          <Label className="font-bold pl-2 cursor-pointer" htmlFor={`payment-${pm.name}`}>
                            {pm.name}
                            {pm.name === "PayWay" && (
                              <span className="text-sm text-gray-600 font-normal ml-2">
                                - Visa, Mastercard, ABA Bank, ACLEDA
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="p-4">
                    <Button onClick={handleSelectPaymentMethod} className="rounded-full font-bold">
                      Use this payment method
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className="flex text-muted-foreground text-lg font-bold my-4 py-3">
                <span className="w-8">2 </span>
                <span>Choose a payment method</span>
              </div>
            )}
          </div>

          {isPaymentMethodSelected && isAddressSelected && (
            <div className="mt-6">
              <div className="block md:hidden">
                <CheckoutSummary />
              </div>

              <Card className="hidden md:block ">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-3">
                  {showPayWayCheckout && paymentMethod === "PayWay" ? (
                    <div className="w-full">
                      <PayWayCheckout
                        orderId={`temp_${Date.now()}`}
                        amount={totalPrice}
                        customerInfo={{
                          name: shippingAddress?.fullName || "",
                          email: userEmail || "customer@example.com",
                          phone: shippingAddress?.phone || "",
                        }}
                        onSuccess={() => handlePayWayOrder()}
                        onError={(error: string) => {
                          toast({
                            title: "Payment Failed",
                            description: error,
                            variant: "destructive",
                          })
                          setShowPayWayCheckout(false)
                        }}
                        onCancel={() => setShowPayWayCheckout(false)}
                      />
                    </div>
                  ) : (
                    <>
                      <Button onClick={handlePlaceOrder} className="rounded-full" disabled={isPayWayProcessing}>
                        {isPayWayProcessing ? "Processing..." : "Place Your Order"}
                      </Button>
                      <div className="flex-1">
                        <p className="font-bold text-lg">
                          Order Total: <ProductPrice price={totalPrice} plain />
                        </p>
                        <p className="text-xs">
                          By placing your order, you agree to {site.name}&apos;s{" "}
                          <Link href="/page/privacy-policy">privacy notice</Link> and
                          <Link href="/page/conditions-of-use"> conditions of use</Link>.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <CheckoutFooter />
        </div>
        <div className="hidden md:block">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
export default CheckoutForm
