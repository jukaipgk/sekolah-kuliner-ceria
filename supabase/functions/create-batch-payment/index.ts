
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Create batch payment function called");
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { orderIds, batchId, totalAmount } = await req.json();
    console.log("Batch payment request:", { orderIds, batchId, totalAmount, userId: user.id });

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("Invalid order IDs provided");
    }

    if (!batchId || !totalAmount) {
      throw new Error("Batch ID and total amount are required");
    }

    // Verify all orders belong to the user and are pending payment
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('*')
      .in('id', orderIds)
      .eq('user_id', user.id)
      .eq('payment_status', 'pending');

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log("Found orders:", orders?.length || 0, "out of", orderIds.length, "requested");
    
    if (!orders || orders.length === 0) {
      throw new Error("No eligible orders found for batch payment");
    }

    // Check if some orders are missing
    const foundOrderIds = orders.map(order => order.id);
    const missingOrderIds = orderIds.filter(id => !foundOrderIds.includes(id));
    
    if (missingOrderIds.length > 0) {
      console.log("Missing or ineligible orders:", missingOrderIds);
      // Instead of throwing error, proceed with available orders
      console.log("Proceeding with available orders only");
    }

    // Validate total amount with found orders
    const calculatedTotal = orders.reduce((sum, order) => sum + order.total_amount, 0);
    console.log("Calculated total:", calculatedTotal, "Expected total:", totalAmount);
    
    // Use calculated total from actual orders instead of provided total
    const actualTotal = calculatedTotal;

    // Create Midtrans order ID with proper length validation
    // Midtrans order_id max length is 50 characters
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 6);
    const midtransOrderId = `BATCH_${timestamp}_${randomSuffix}`.substr(0, 50);
    
    console.log("Creating Midtrans batch payment with order ID:", midtransOrderId);

    // Create batch payment with Midtrans
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!midtransServerKey) {
      throw new Error("Midtrans server key not configured");
    }

    // Prepare Midtrans request payload
    const midtransPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(actualTotal)
      },
      customer_details: {
        email: user.email,
        first_name: user.user_metadata?.full_name || "Customer"
      },
      item_details: orders.map((order, index) => ({
        id: order.id.substr(0, 50), // Ensure item ID doesn't exceed Midtrans limits
        price: Math.round(order.total_amount),
        quantity: 1,
        name: `Pesanan ${order.child_name || `#${index + 1}`}`.substr(0, 50)
      })),
      callbacks: {
        finish: `${req.headers.get("origin")}/orders`
      }
    };

    console.log("Midtrans payload:", JSON.stringify(midtransPayload, null, 2));

    // Call Midtrans Snap API
    const midtransResponse = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${btoa(midtransServerKey + ":")}`
      },
      body: JSON.stringify(midtransPayload)
    });

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error("Midtrans API error:", errorText);
      throw new Error(`Midtrans API error: ${midtransResponse.status} - ${errorText}`);
    }

    const midtransData = await midtransResponse.json();
    console.log("Midtrans response:", midtransData);

    if (!midtransData.token) {
      throw new Error("No snap token received from Midtrans");
    }

    // Use service role key for database updates
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update only the found orders with Midtrans data
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({
        midtrans_order_id: midtransOrderId,
        snap_token: midtransData.token,
        updated_at: new Date().toISOString()
      })
      .in('id', foundOrderIds);

    if (updateError) {
      console.error("Error updating orders:", updateError);
      throw new Error("Failed to update orders with payment information");
    }

    // Create batch_orders entries for found orders only
    const batchOrdersData = foundOrderIds.map(orderId => ({
      batch_id: batchId,
      order_id: orderId
    }));

    const { error: batchError } = await supabaseService
      .from('batch_orders')
      .insert(batchOrdersData);

    if (batchError) {
      console.error("Error creating batch orders:", batchError);
      // This is not critical, we can still proceed with payment
    }

    console.log("Batch payment created successfully");

    return new Response(JSON.stringify({
      success: true,
      snap_token: midtransData.token,
      order_id: midtransOrderId,
      batch_id: batchId,
      total_amount: actualTotal,
      processed_orders: foundOrderIds.length,
      total_requested: orderIds.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Batch payment error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
