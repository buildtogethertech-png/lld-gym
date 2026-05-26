export default function Content() {
  return (
    <>
      <p>
        Inventory Management System Low Level Design is a core problem asked at Amazon, Flipkart, and
        Walmart. It covers stock reservation, multi-warehouse transfers, audit trail, and auto-reorder.
        This guide covers the complete Inventory Management LLD with Java code, class diagram, and
        interview FAQ.
      </p>

      <h2>Why Interviewers Ask Inventory Management LLD</h2>
      <p>
        Inventory systems must handle concurrent stock updates without corruption. Interviewers want to see:
      </p>
      <ul>
        <li>Can you model stock reservation (soft lock before purchase) vs actual deduction?</li>
        <li>Do you use Command pattern to create an auditable history of every stock change?</li>
        <li>Can you handle multi-warehouse operations — transfers and allocation strategies?</li>
        <li>Do you use Observer pattern to trigger auto-reorder when stock falls below threshold?</li>
        <li>Can you prevent overselling with optimistic locking or atomic operations?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Track stock quantity per product per warehouse</li>
        <li>Reserve stock for an order (soft lock) — prevents overselling during checkout</li>
        <li>Confirm reservation on payment — permanently deducts stock</li>
        <li>Cancel reservation — releases the soft lock</li>
        <li>Transfer stock between warehouses</li>
        <li>Auto-reorder when stock falls below the reorder point</li>
        <li>Audit trail — every stock change is logged with who did it and why</li>
        <li>Admin can adjust stock manually (receive new shipment, write-off damaged goods)</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Stock updates must be atomic — concurrent order placements must not oversell</li>
        <li>Audit trail must be immutable — no record can be deleted or modified</li>
        <li>Adding a new stock change type (e.g., DAMAGED_WRITE_OFF) must not change existing code</li>
        <li>Auto-reorder must trigger within 1 minute of stock dropping below threshold</li>
      </ul>

      <h2>Core Entities — Inventory Management LLD Class Design</h2>
      <ul>
        <li><strong>Product</strong> — id, name, sku, category, reorderPoint, reorderQuantity</li>
        <li><strong>Warehouse</strong> — id, name, location, capacity</li>
        <li><strong>InventoryItem</strong> — product, warehouse, quantityOnHand, quantityReserved</li>
        <li><strong>StockReservation</strong> — id, orderId, product, warehouse, quantity, status, expiresAt</li>
        <li><strong>StockMovement</strong> — Command; encapsulates a stock change with reason and metadata</li>
        <li><strong>AuditLog</strong> — immutable record of every StockMovement</li>
        <li><strong>ReorderObserver</strong> — notified when stock falls below reorderPoint</li>
        <li><strong>InventoryService</strong> — reserve, confirm, cancel, transfer, adjust</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Product
+-- id, name, sku: String
+-- reorderPoint: int  (trigger auto-reorder below this)
+-- reorderQuantity: int

Warehouse
+-- id, name, location: String

InventoryItem
+-- product: Product, warehouse: Warehouse
+-- quantityOnHand: int    (physical stock)
+-- quantityReserved: int  (soft-locked for pending orders)
+-- quantityAvailable(): int  // onHand - reserved

StockReservation
+-- id, orderId: String
+-- product: Product, warehouse: Warehouse
+-- quantity: int
+-- status: ReservationStatus (ACTIVE/CONFIRMED/CANCELLED/EXPIRED)
+-- createdAt, expiresAt: LocalDateTime

StockMovement (Command)
+-- execute(): void
+-- undo(): void   (for rollback scenarios)

AuditLog
+-- id, timestamp: LocalDateTime
+-- productId, warehouseId: String
+-- movementType: MovementType
+-- quantityChange: int
+-- referenceId: String  (orderId, transferId, etc.)
+-- performedBy: String`}</pre>

      <h2>Command Pattern — Stock Movements</h2>
      <pre>{`public interface StockMovement {
    void execute();
    MovementType getType();
}

// Inbound: new stock received
public class StockReceiveMovement implements StockMovement {
    private final InventoryItem item;
    private final int quantity;
    private final String referenceId; // purchase order ID

    @Override
    public void execute() {
        item.setQuantityOnHand(item.getQuantityOnHand() + quantity);
    }

    @Override
    public MovementType getType() { return MovementType.RECEIVED; }
}

// Outbound: confirmed order deduction
public class StockDeductMovement implements StockMovement {
    private final InventoryItem item;
    private final int quantity;
    private final String orderId;

    @Override
    public void execute() {
        if (item.getQuantityOnHand() < quantity)
            throw new InsufficientStockException(item.getProduct().getSku());
        item.setQuantityOnHand(item.getQuantityOnHand() - quantity);
        item.setQuantityReserved(item.getQuantityReserved() - quantity); // release reservation
    }

    @Override
    public MovementType getType() { return MovementType.SOLD; }
}

// Transfer between warehouses
public class StockTransferMovement implements StockMovement {
    private final InventoryItem source;
    private final InventoryItem destination;
    private final int quantity;

    @Override
    public void execute() {
        if (source.getQuantityAvailable() < quantity)
            throw new InsufficientStockException("Source warehouse cannot fulfill transfer");
        source.setQuantityOnHand(source.getQuantityOnHand() - quantity);
        destination.setQuantityOnHand(destination.getQuantityOnHand() + quantity);
    }

    @Override
    public MovementType getType() { return MovementType.TRANSFERRED; }
}`}</pre>

      <h2>InventoryService — Reservation and Confirmation</h2>
      <pre>{`public class InventoryService {
    private final InventoryItemRepository itemRepo;
    private final ReservationRepository reservationRepo;
    private final AuditLogRepository auditLogRepo;
    private final List<InventoryObserver> observers = new ArrayList<>();

    public void addObserver(InventoryObserver observer) { observers.add(observer); }

    public StockReservation reserve(String orderId, String productId, String warehouseId, int quantity) {
        InventoryItem item = itemRepo.findByProductAndWarehouse(productId, warehouseId);
        synchronized (item) {
            if (item.getQuantityAvailable() < quantity)
                throw new InsufficientStockException("Not enough available stock");
            item.setQuantityReserved(item.getQuantityReserved() + quantity);
            itemRepo.save(item);
        }

        StockReservation reservation = new StockReservation(UUID.randomUUID().toString(),
            orderId, item.getProduct(), item.getWarehouse(), quantity,
            ReservationStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now().plusMinutes(30));
        return reservationRepo.save(reservation);
    }

    public void confirmReservation(String reservationId) {
        StockReservation res = reservationRepo.findById(reservationId);
        if (res.getStatus() != ReservationStatus.ACTIVE || res.isExpired())
            throw new InvalidReservationException("Reservation is not active");

        InventoryItem item = itemRepo.findByProductAndWarehouse(
            res.getProduct().getId(), res.getWarehouse().getId());

        StockDeductMovement movement = new StockDeductMovement(item, res.getQuantity(), res.getOrderId());
        executeAndAudit(movement, item, res.getOrderId());

        res.setStatus(ReservationStatus.CONFIRMED);
        reservationRepo.save(res);

        notifyObservers(item);
    }

    public void cancelReservation(String reservationId) {
        StockReservation res = reservationRepo.findById(reservationId);
        if (res.getStatus() == ReservationStatus.CONFIRMED)
            throw new InvalidReservationException("Confirmed reservations cannot be cancelled");

        InventoryItem item = itemRepo.findByProductAndWarehouse(
            res.getProduct().getId(), res.getWarehouse().getId());
        item.setQuantityReserved(item.getQuantityReserved() - res.getQuantity());
        itemRepo.save(item);

        res.setStatus(ReservationStatus.CANCELLED);
        reservationRepo.save(res);
    }

    private void executeAndAudit(StockMovement movement, InventoryItem item, String referenceId) {
        movement.execute();
        itemRepo.save(item);
        auditLogRepo.save(new AuditLog(UUID.randomUUID().toString(), LocalDateTime.now(),
            item.getProduct().getId(), item.getWarehouse().getId(),
            movement.getType(), -item.getQuantityOnHand(), referenceId, getCurrentUser()));
    }

    private void notifyObservers(InventoryItem item) {
        if (item.getQuantityOnHand() <= item.getProduct().getReorderPoint()) {
            observers.forEach(obs -> obs.onLowStock(item));
        }
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Reserve (soft lock) before deduct:</strong> quantityReserved tracks stock committed to
          pending orders. quantityAvailable = onHand - reserved. This prevents overselling during the
          window between checkout and payment confirmation.
        </li>
        <li>
          <strong>Command pattern for all stock movements:</strong> Every change — receive, sell, transfer,
          write-off — is a Command. The audit log records the command type, not just the quantity delta.
          This makes the history human-readable and supports undo for admin corrections.
        </li>
        <li>
          <strong>Synchronized on InventoryItem:</strong> Concurrent order reservations for the same product
          in the same warehouse race on the availability check. Synchronizing on the specific item object
          prevents double-allocation without a global lock.
        </li>
        <li>
          <strong>Observer for auto-reorder:</strong> AutoReorderObserver calls the purchase management
          system when stock drops below reorderPoint. This decouples inventory from procurement — adding
          an email alert is a new observer class only.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle expired reservations?"</strong> — A scheduled job runs every minute
          and finds ACTIVE reservations where expiresAt is in the past. For each, it cancels the
          reservation and releases the quantityReserved back to the item. Alternatively, expire lazily
          on the next availability check.
        </li>
        <li>
          <strong>"How do you choose which warehouse fulfills an order?"</strong> — Add a
          WarehouseAllocationStrategy (Strategy pattern): NearestWarehouse (Haversine from delivery
          address), HighestStock (maximize utilization), or RoundRobin. InventoryService calls the
          strategy to pick the warehouse before reserving.
        </li>
        <li>
          <strong>"How do you handle stock discrepancies from physical counts?"</strong> — Admin triggers
          a StockAdjustMovement with the counted quantity and the reason (CYCLE_COUNT). The movement
          sets quantityOnHand to the audited value and logs the delta. The audit trail shows the
          discrepancy and who resolved it.
        </li>
      </ul>

      <h2>FAQ — Inventory Management System Low Level Design</h2>

      <h3>What design patterns are used in Inventory Management LLD?</h3>
      <p>
        The primary patterns are <strong>Command</strong> (StockMovement — Receive, Deduct, Transfer),
        <strong>Observer</strong> (AutoReorderObserver on low stock), and <strong>Strategy</strong>
        (warehouse allocation). The Command pattern is the most important — it makes the audit trail a
        natural byproduct of business operations.
      </p>

      <h3>What is the difference between reserved stock and on-hand stock?</h3>
      <p>
        On-hand stock is the physical quantity in the warehouse. Reserved stock is the portion of on-hand
        stock committed to pending orders but not yet shipped. Available stock = on-hand minus reserved.
        Users can only order from available stock. This prevents overselling during the checkout-to-payment
        window.
      </p>

      <h3>How do you prevent overselling in an inventory system?</h3>
      <p>
        Synchronize the availability check and reservation increment as a single atomic operation. In the
        database, use SELECT FOR UPDATE to lock the row, check availability, and update quantityReserved
        in one transaction. The Java-level synchronized block is for in-process concurrency; the DB lock
        handles multi-node deployments.
      </p>

      <h3>How do you design an audit trail for inventory changes?</h3>
      <p>
        Every StockMovement writes an immutable AuditLog entry with: timestamp, product, warehouse,
        movement type, quantity change, reference ID (orderId or transferId), and the user who initiated
        it. AuditLog records are insert-only — no update or delete operations are permitted. This gives a
        complete, tamper-evident history.
      </p>
    </>
  );
}
