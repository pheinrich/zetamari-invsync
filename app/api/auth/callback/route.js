import { NextRequest, NextResponse } from 'next/server'
import { shopify } from '@/lib/shopify'

export async function GET( req )
{
  const callbackParams = Object.fromEntries( new URL( req.url ).searchParams )
  const session = await shopify.auth.callback({
    rawRequest: req,
    rawResponse: new Response(), // Dummy, unused in server context
    query: callbackParams,
  })

  console.log( "Shop authenticated:", session.shop )
  return NextResponse.redirect( '/success' )
}
