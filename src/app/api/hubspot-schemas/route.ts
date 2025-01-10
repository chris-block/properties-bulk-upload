import { NextResponse } from 'next/server'

export async function GET() {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY
  if (!hubspotApiKey) {
    console.error('HubSpot API key is not configured');
    return NextResponse.json({ error: 'HubSpot API key is not configured' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.hubapi.com/crm-object-schemas/v3/schemas', {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json()

    if (!response.ok) {
      console.error('HubSpot API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch schemas from HubSpot' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching schemas from HubSpot:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching schemas from HubSpot' },
      { status: 500 }
    )
  }
}

