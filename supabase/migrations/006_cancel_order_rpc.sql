-- Migration: 006_cancel_order_rpc.sql
-- Atomic cancel_order RPC: sets order status to cancelled and restores variant stock

CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Cancel the order (only if not already cancelled or delivered)
  UPDATE orders
  SET
    status            = 'cancelled',
    status_updated_at = now(),
    updated_at        = now()
  WHERE id = p_order_id
    AND status NOT IN ('cancelled', 'delivered');

  -- Restore stock for every order item
  FOR v_item IN
    SELECT variant_id, quantity
    FROM order_items
    WHERE order_id = p_order_id
  LOOP
    UPDATE variants
    SET
      stock      = stock + v_item.quantity,
      updated_at = now()
    WHERE id = v_item.variant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
