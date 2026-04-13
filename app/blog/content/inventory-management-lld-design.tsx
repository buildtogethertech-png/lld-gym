export default function Content() {
  return (
    <>
      <p>The Inventory Management System is a common LLD problem at Amazon, Flipkart, and e-commerce companies. It tests the Command pattern for auditable operations, Observer for reorder triggers, and careful handling of stock reservation to prevent overselling.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Product</strong> — SKU, name, category</li>
        <li><strong>Warehouse</strong> — location, stock per product</li>
        <li><strong>Stock</strong> — warehouse + product + available + reserved quantities</li>
        <li><strong>Reservation</strong> — temporary hold on stock for an order</li>
        <li><strong>AuditLog</strong> — immutable record of every stock change</li>
        <li><strong>ReorderConfig</strong> — threshold and reorder quantity per product</li>
      </ul>
      <h2>Stock Reservation Flow</h2>
      <pre>{`class StockService {
  // Step 1: Reserve on order placement
  reserve(productId: string, warehouseId: string, qty: number, orderId: string): Reservation {
    const stock = this.stockRepo.get(productId, warehouseId);
    if (stock.available < qty) throw new Error("Insufficient stock");
    stock.available -= qty;
    stock.reserved += qty;
    const reservation = new Reservation(orderId, productId, qty, Date.now() + 30*60*1000);
    this.reservationRepo.save(reservation);
    this.auditLog.record("RESERVE", productId, qty, orderId);
    return reservation;
  }

  // Step 2a: Commit when order confirmed
  commit(reservationId: string) {
    const res = this.reservationRepo.get(reservationId);
    const stock = this.stockRepo.get(res.productId, res.warehouseId);
    stock.reserved -= res.qty; // Reservation → actual deduction
    this.auditLog.record("COMMIT", res.productId, res.qty, res.orderId);
    this.checkReorder(stock);
  }

  // Step 2b: Release when order cancelled
  release(reservationId: string) {
    const res = this.reservationRepo.get(reservationId);
    const stock = this.stockRepo.get(res.productId, res.warehouseId);
    stock.available += res.qty;
    stock.reserved -= res.qty;
    this.auditLog.record("RELEASE", res.productId, res.qty, res.orderId);
  }
}`}</pre>
      <h2>Observer for Auto-Reorder</h2>
      <pre>{`private checkReorder(stock: Stock) {
  const config = this.reorderConfig.get(stock.productId);
  if (config && stock.available <= config.reorderThreshold) {
    const qty = config.maxStock - stock.available;
    this.eventBus.publish(new LowStockEvent(stock.productId, stock.warehouseId, qty));
  }
}

class ProcurementService implements EventHandler<LowStockEvent> {
  handle(event: LowStockEvent) {
    this.purchaseOrderService.createOrder(event.productId, event.qty);
    this.notifyTeam(\`Low stock alert: \${event.productId}\`);
  }
}`}</pre>
      <h2>Command Pattern for Operations</h2>
      <pre>{`interface InventoryCommand { execute(): void; undo(): void; }
class ReserveCommand implements InventoryCommand {
  execute() { this.stockService.reserve(this.productId, this.warehouseId, this.qty, this.orderId); }
  undo()    { this.stockService.release(this.reservationId); }
}`}</pre>
    </>
  );
}
