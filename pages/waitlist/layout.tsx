import type React from "react"
import Head from "next/head"

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Head>
        <title>Join the Waitlist | GTX - Next-Gen Trading Platform</title>
        <meta
          name="description"
          content="Join the exclusive waitlist for GTX, the next-generation trading platform."
        />
      </Head>
      {children}
    </>
  )
}