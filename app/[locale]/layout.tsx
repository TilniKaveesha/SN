/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inter } from 'next/font/google'
import '../globals.css'
import ClientProviders from '@/components/shared/client-providers'
import { getDirection } from '@/i18n-config'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { getSetting } from '@/lib/actions/setting.actions'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  params: Promise<{ locale: string }>
  children: ReactNode
}

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export async function generateMetadata() {
  const {
    site: { slogan, name, description, url },
  } = await getSetting()

  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${slogan}`,
    },
    description,
    metadataBase: new URL(url),
  }
}

export default async function AppLayout({
  params,
  children,
}: AppLayoutProps) {
  const { locale } = await params

  const setting = await getSetting()
  const currencyCookie = (await cookies()).get('currency')
  const currency = currencyCookie ? currencyCookie.value : 'USD'

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === 'rtl' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <body className={`min-h-screen pointer-events-auto ${inter.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders setting={{ ...setting, currency }}>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
