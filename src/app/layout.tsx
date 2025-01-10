import '@/app/globals.css'
import { Providers } from "@/components/providers"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HubSpot Bulk Property Upload',
  description: 'Upload and manage HubSpot properties in bulk',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
