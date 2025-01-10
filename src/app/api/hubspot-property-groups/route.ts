import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const objectType = searchParams.get('objectType')

  if (!objectType) {
    return NextResponse.json({ error: 'Object type is required' }, { status: 400 })
  }

  const hubspotApiKey = process.env.HUBSPOT_API_KEY
  if (!hubspotApiKey) {
    console.error('HubSpot API key is not configured');
    return NextResponse.json({ error: 'HubSpot API key is not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/properties/${objectType}/groups`, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json()

    if (!response.ok) {
      console.error('HubSpot API error:', data);
      return NextResponse.json(
        { error: data.message || `Failed to fetch property groups for ${objectType} from HubSpot` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching property groups for ${objectType} from HubSpot:`, error);
    return NextResponse.json(
      { error: `An unexpected error occurred while fetching property groups for ${objectType} from HubSpot` },
      { status: 500 }
    )
  }
}

