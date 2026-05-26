export default function Content() {
  return (
    <>
      <p>
        Payment Gateway Low Level Design is a senior-level problem asked at Razorpay, PayU, Stripe, and
        PayPal. It requires idempotency for safe retries, a pluggable payment provider strategy, fraud
        detection hooks, and webhook-based status notifications. This guide covers the complete Payment
        Gateway LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Payment Gateway LLD</h2>
      <p>
        Payment systems require defensive design that most problems do not. Interviewers want to see:
      </p>
      <ul>
        <li>Do you implement idempotency — preventing double-charge on network retry?</li>
        <li>Can you design a payment provider abstraction — swap Razorpay for Stripe with zero code changes?</li>
        <li>Do you use Chain of Responsibility for fraud detection, limit checks, and auth?</li>
        <li>Can you design payment state machine: INITIATED → PROCESSING → SUCCESS / FAILED / REFUNDED?</li>
        <li>Do you handle webhooks for asynchronous payment confirmation from the provider?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Initiate a payment — create a payment intent with amount, currency, and method</li>
        <li>Process payment via card, UPI, net banking, or wallet</li>
        <li>Idempotent payment processing — same request key never double-charges</li>
        <li>Refund a successful payment (full or partial)</li>
        <li>Send webhook notifications to merchants on payment success, failure, or refund</li>
        <li>Record every payment attempt and provider response for audit</li>
        <li>Support multiple payment providers (Razorpay, Stripe) with failover</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Payment processing must be idempotent — retries are safe</li>
        <li>No payment must be lost — at-least-once processing with deduplication</li>
        <li>Adding a new payment provider must not change existing code (OCP)</li>
        <li>Fraud checks must run before every payment without coupling to business logic</li>
      </ul>

      <h2>Core Entities — Payment Gateway LLD Class Design</h2>
      <ul>
        <li><strong>Payment</strong> — id, merchantId, amount, currency, method, status, idempotencyKey</li>
        <li><strong>PaymentMethod</strong> — type, card/UPI/wallet details (polymorphic)</li>
        <li><strong>Refund</strong> — id, paymentId, amount, reason, status, initiatedAt</li>
        <li><strong>PaymentProvider</strong> — interface; RazorpayProvider, StripeProvider implement it</li>
        <li><strong>PaymentHandler</strong> — abstract; Chain of Responsibility for fraud, limits, auth</li>
        <li><strong>WebhookService</strong> — dispatches events to merchant-configured webhook URLs</li>
        <li><strong>PaymentAuditLog</strong> — raw provider request/response for every attempt</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Payment
+-- id, merchantId: String
+-- amount: BigDecimal, currency: String
+-- method: PaymentMethod
+-- status: PaymentStatus (INITIATED/PROCESSING/SUCCESS/FAILED/REFUNDED)
+-- idempotencyKey: String (unique per merchant)
+-- providerPaymentId: String
+-- createdAt: LocalDateTime

PaymentMethod (abstract)
+-- type: MethodType (CARD/UPI/WALLET/NET_BANKING)
CardPayment    extends PaymentMethod -- cardNumber, expiry, cvv
UpiPayment     extends PaymentMethod -- vpa (virtual payment address)
WalletPayment  extends PaymentMethod -- walletType, walletAccountId

Refund
+-- id, paymentId: String
+-- amount: BigDecimal
+-- reason: String
+-- status: RefundStatus (INITIATED/SUCCESS/FAILED)

PaymentProvider (interface)
+-- charge(payment): ProviderResponse
+-- refund(paymentId, amount): ProviderResponse
+-- getProviderName(): String

RazorpayProvider implements PaymentProvider
StripeProvider   implements PaymentProvider

PaymentHandler (abstract, chain)
+-- setNext(handler): PaymentHandler
+-- handle(payment): PaymentResult

FraudCheckHandler  extends PaymentHandler
LimitCheckHandler  extends PaymentHandler
AuthCheckHandler   extends PaymentHandler`}</pre>

      <h2>Chain of Responsibility — Pre-Payment Checks</h2>
      <pre>{`public abstract class PaymentHandler {
    protected PaymentHandler next;

    public PaymentHandler setNext(PaymentHandler next) {
        this.next = next;
        return next; // enables chaining: fraud.setNext(limit).setNext(auth)
    }

    public abstract PaymentResult handle(Payment payment);

    protected PaymentResult proceed(Payment payment) {
        if (next != null) return next.handle(payment);
        return PaymentResult.proceed();
    }
}

public class FraudCheckHandler extends PaymentHandler {
    private final FraudService fraudService;

    @Override
    public PaymentResult handle(Payment payment) {
        FraudScore score = fraudService.evaluate(payment);
        if (score.isHighRisk()) {
            return PaymentResult.reject("Payment flagged as high-risk by fraud engine");
        }
        return proceed(payment);
    }
}

public class LimitCheckHandler extends PaymentHandler {
    private final MerchantService merchantService;

    @Override
    public PaymentResult handle(Payment payment) {
        Merchant merchant = merchantService.findById(payment.getMerchantId());
        if (payment.getAmount().compareTo(merchant.getTransactionLimit()) > 0) {
            return PaymentResult.reject("Amount exceeds merchant transaction limit");
        }
        return proceed(payment);
    }
}

public class AuthCheckHandler extends PaymentHandler {
    @Override
    public PaymentResult handle(Payment payment) {
        if (!payment.getMerchant().isActive()) {
            return PaymentResult.reject("Merchant account is inactive");
        }
        return proceed(payment);
    }
}`}</pre>

      <h2>Idempotent Payment Processing</h2>
      <pre>{`public class PaymentService {
    private final PaymentRepository paymentRepo;
    private final PaymentProvider primaryProvider;
    private final PaymentProvider fallbackProvider;
    private final PaymentHandler handlerChain;
    private final WebhookService webhookService;

    public Payment initiatePayment(PaymentRequest req) {
        // Idempotency check
        Optional<Payment> existing = paymentRepo.findByIdempotencyKey(
            req.getMerchantId(), req.getIdempotencyKey());
        if (existing.isPresent()) {
            return existing.get(); // Return the original result — safe to retry
        }

        Payment payment = new Payment(UUID.randomUUID().toString(),
            req.getMerchantId(), req.getAmount(), req.getCurrency(),
            req.getMethod(), PaymentStatus.INITIATED, req.getIdempotencyKey());
        paymentRepo.save(payment);
        return payment;
    }

    public Payment processPayment(String paymentId) {
        Payment payment = paymentRepo.findById(paymentId);
        if (payment.getStatus() != PaymentStatus.INITIATED)
            return payment; // Idempotent — already processed

        // Run pre-payment checks
        PaymentResult checkResult = handlerChain.handle(payment);
        if (!checkResult.isAllowed()) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(checkResult.getReason());
            paymentRepo.save(payment);
            webhookService.dispatch(payment, WebhookEvent.PAYMENT_FAILED);
            return payment;
        }

        payment.setStatus(PaymentStatus.PROCESSING);
        paymentRepo.save(payment);

        // Try primary provider, fall back if unavailable
        ProviderResponse response;
        try {
            response = primaryProvider.charge(payment);
        } catch (ProviderUnavailableException e) {
            response = fallbackProvider.charge(payment);
        }

        payment.setStatus(response.isSuccess() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        payment.setProviderPaymentId(response.getProviderPaymentId());
        paymentRepo.save(payment);

        WebhookEvent event = response.isSuccess() ? WebhookEvent.PAYMENT_SUCCESS : WebhookEvent.PAYMENT_FAILED;
        webhookService.dispatch(payment, event);
        return payment;
    }

    public Refund refundPayment(String paymentId, BigDecimal amount, String reason) {
        Payment payment = paymentRepo.findById(paymentId);
        if (payment.getStatus() != PaymentStatus.SUCCESS)
            throw new InvalidPaymentStateException("Only successful payments can be refunded");
        if (amount.compareTo(payment.getAmount()) > 0)
            throw new InvalidRefundAmountException("Refund cannot exceed original payment amount");

        ProviderResponse response = primaryProvider.refund(payment.getProviderPaymentId(), amount);
        Refund refund = new Refund(UUID.randomUUID().toString(), paymentId, amount, reason,
            response.isSuccess() ? RefundStatus.SUCCESS : RefundStatus.FAILED);
        refundRepo.save(refund);

        if (response.isSuccess()) {
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepo.save(payment);
            webhookService.dispatch(payment, WebhookEvent.PAYMENT_REFUNDED);
        }
        return refund;
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Idempotency key indexed on (merchantId, key):</strong> The same merchant can reuse key
          names across different merchants without collision. The composite index is unique per merchant,
          not globally. This matches how Stripe and Razorpay implement idempotency.
        </li>
        <li>
          <strong>Chain of Responsibility for pre-payment checks:</strong> Fraud, limit, and auth checks
          are independent and ordered. Each handler either rejects (short-circuits) or passes to the next.
          Adding a new check (e.g., velocity check) is a new handler — no changes to existing code.
        </li>
        <li>
          <strong>Provider abstraction with fallback:</strong> PaymentService does not know whether it is
          calling Razorpay or Stripe. On primary provider failure, it transparently falls back. Switching
          providers or adding new ones is a new implementation class only.
        </li>
        <li>
          <strong>Webhook dispatch after state save:</strong> Always persist payment state before firing
          webhooks. If the webhook call fails, the payment state is still correct. A retry job can re-
          dispatch failed webhooks from the saved state.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"What happens if the payment succeeds but the webhook fails?"</strong> — Use at-least-once
          webhook delivery. Store WebhookEvent in a delivery table with PENDING status. A background job
          retries PENDING events with exponential backoff. The merchant's endpoint must be idempotent.
        </li>
        <li>
          <strong>"How do you handle partial refunds?"</strong> — Track total refunded amount on Payment.
          Each refund adds to this total. Reject refund if (existingRefunds + newRefund) exceeds the
          original amount. Payment stays in PARTIALLY_REFUNDED state until fully refunded.
        </li>
        <li>
          <strong>"How do you prevent replay attacks on webhooks?"</strong> — Include a timestamp and
          HMAC signature in the webhook payload. The merchant verifies the signature using the shared
          secret and rejects requests older than 5 minutes.
        </li>
      </ul>

      <h2>FAQ — Payment Gateway Low Level Design</h2>

      <h3>What is idempotency in payment systems?</h3>
      <p>
        Idempotency means processing the same request multiple times produces the same result without side
        effects. In payments, the client sends an idempotency key with each request. If the server already
        processed a request with that key, it returns the cached result instead of charging again. This
        makes network retries safe.
      </p>

      <h3>What design patterns are used in Payment Gateway LLD?</h3>
      <p>
        The primary patterns are <strong>Chain of Responsibility</strong> (fraud, limit, auth checks),
        <strong>Strategy</strong> (PaymentProvider — Razorpay, Stripe), <strong>State Machine</strong>
        (payment lifecycle), and <strong>Observer</strong> (webhook events on status changes).
      </p>

      <h3>How do you handle payment provider failover?</h3>
      <p>
        Wrap the primary provider call in a try-catch for ProviderUnavailableException. On failure,
        delegate to the fallback provider with the same Payment object. Log which provider processed
        each payment in the audit trail. For production, use a circuit breaker (Resilience4j) to avoid
        hammering a failing provider.
      </p>

      <h3>How do you design a refund flow?</h3>
      <p>
        Validate that the payment is in SUCCESS state and the refund amount does not exceed the original.
        Create a Refund entity in INITIATED state. Call the provider's refund API with the original
        provider payment ID. On success, update Refund to SUCCESS and Payment to REFUNDED. Fire a
        PAYMENT_REFUNDED webhook to the merchant.
      </p>
    </>
  );
}
