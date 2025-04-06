import { LATEST_API_VERSION } from '@shopify/shopify-api'

export async function shopifyAdminRequest( shop, accessToken, query, variables = {} )
{
  const url = `https://${shop}/admin/api/${LATEST_API_VERSION}/graphql.json`

  console.log( `----- url = ${url} -----` )

  const res = await fetch( url,
  {
    method: 'POST',
    headers:
    {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify( {query, variables} ),
  })

  if( !res.ok )
  {
    const text = await res.text()
    console.log( `----- res.text() = ${text} -----` )

    throw new Error( `Shopify API error: ${res.status} - ${text}` )
  }

  const json = await res.json()
  console.dir( json, {depth: null} )

  if( json.errors )
  {
    console.error( 'GraphQL errors:', json.errors )
    throw new Error( 'Shopify GraphQL errors' )
  }

  console.log( '----- -----' )

  return json
}
