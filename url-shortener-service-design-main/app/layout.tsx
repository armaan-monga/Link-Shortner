import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Michroma, Poppins } from 'next/font/google'
import './globals.css'

const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-michroma' })
const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'SNIP / 26 — short links with real analytics',
  description:
    'Shorten URLs with custom aliases, expiry, click limits and passwords. Every redirect is logged with referrer, device, browser and country.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#070707',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${michroma.variable} ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
