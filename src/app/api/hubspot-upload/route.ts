import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const objectType = searchParams.get('objectType')

  if (!objectType) {
    return NextResponse.json({ error: 'Object type is required' }, { status: 400 })
  }

  let properties;
  try {
    properties = await request.json()
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const hubspotApiKey = process.env.HUBSPOT_API_KEY
  if (!hubspotApiKey) {
    console.error('HubSpot API key is not configured');
    return NextResponse.json({ error: 'HubSpot API key is not configured' }, { status: 500 })
  }

  try {
    console.log('Sending request to HubSpot API:', JSON.stringify({ inputs: properties }));
    const response = await fetch(`https://api.hubapi.com/crm/v3/properties/${objectType}/batch/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hubspotApiKey}`,
      },
      body: JSON.stringify({ inputs: properties }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('HubSpot API error:', result)
      return NextResponse.json({ error: result.message || 'Failed to upload properties to HubSpot' }, { status: response.status })
    }

    console.log('Successful response from HubSpot:', result);
    return NextResponse.json({ numPropertiesCreated: result.results?.length || 0 })
  } catch (error) {
    console.error('Error uploading to HubSpot:', error)
    return NextResponse.json({ error: 'An unexpected error occurred while uploading properties to HubSpot' }, { status: 500 })
  }
}

