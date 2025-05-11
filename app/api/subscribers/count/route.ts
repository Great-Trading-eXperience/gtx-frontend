import { MAILCHIMP } from "@/constants/contract/contract-address"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mailchimp API configuration
    const API_KEY = MAILCHIMP.API_KEY
    const AUDIENCE_ID = MAILCHIMP.AUDIENCE_ID
    const API_SERVER = MAILCHIMP.API_SERVER

    if (!API_KEY || !AUDIENCE_ID || !API_SERVER) {
      throw new Error("Mailchimp configuration is missing")
    }

    const url = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members?offset=0`

    // Make API request to Mailchimp
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${API_KEY}`,
      },
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.detail || "Failed to get subscriber count")
    }

    // Return the total number of subscribers
    return NextResponse.json({ 
      count: responseData.total_items || 0,
      success: true 
    }, { status: 200 })
  } catch (error: any) {
    console.error("Mailchimp subscriber count error:", error)
    return NextResponse.json({ 
      error: error.message || "Something went wrong",
      count: 0
    }, { status: 500 })
  }
} 