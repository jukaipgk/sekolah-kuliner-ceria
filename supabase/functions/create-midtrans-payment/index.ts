
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderId, amount, customerDetails } = await req.json()

    // Note: This is a basic implementation. In production, you would need:
    // 1. Actual Midtrans Server Key
    // 2. Proper error handling
    // 3. Webhook handling for payment status updates
    
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) {
      throw new Error('Midtrans server key not configured')
    }

    const transactionId = `ORDER-${orderId}-${Date.now()}`
    
    // Create Midtrans Snap transaction
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: transactionId,
          gross_amount: amount
        },
        customer_details: customerDetails,
        credit_card: {
          secure: true
        }
      })
    })

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text()
      console.error('Midtrans API Error:', errorText)
      throw new Error('Failed to create payment link')
    }

    const midtransData = await midtransResponse.json()

    console.log('Payment link created:', {
      orderId,
      transactionId,
      paymentUrl: midtransData.redirect_url
    })

    return new Response(
      JSON.stringify({
        transaction_id: transactionId,
        payment_url: midtransData.redirect_url,
        token: midtransData.token
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
