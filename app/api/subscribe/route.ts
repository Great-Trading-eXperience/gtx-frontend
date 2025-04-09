import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 })
  }

  try {
    // Mailchimp API configuration
    const API_KEY = process.env.MAILCHIMP_API_KEY
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
    const API_SERVER = process.env.MAILCHIMP_API_SERVER

    if (!API_KEY || !AUDIENCE_ID || !API_SERVER) {
      throw new Error("Mailchimp configuration is missing")
    }

    const url = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`

    // Create member data
    const data = {
      email_address: email,
      status: "subscribed",
    }

    // Make API request to Mailchimp
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${API_KEY}`,
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    // Handle existing subscribers
    if (response.status === 400 && responseData.title === "Member Exists") {
      return NextResponse.json({ success: true, message: "You're already subscribed!" }, { status: 200 })
    }

    if (!response.ok) {
      throw new Error(responseData.detail || "Failed to subscribe to the newsletter")
    }

    return NextResponse.json({ success: true, message: "Successfully subscribed to the waitlist!" }, { status: 200 })
  } catch (error: any) {
    console.error("Mailchimp subscription error:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
} 