export default function Content() {
  return (
    <>
      <p>Designing a Payment Gateway is a core LLD topic at Razorpay, PayU, PhonePe, Paytm, and any fintech company. It requires understanding idempotency, multi-method payment processing, fraud detection, and webhook reliability. Here's a complete design.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Payment</strong> — idempotencyKey, amount, currency, status, method</li>
        <li><strong>Transaction</strong> — maps to a payment provider's transaction</li>
        <li><strong>PaymentMethod</strong> — Card, UPI, NetBanking, Wallet</li>
        <li><strong>Refund</strong> — references original Payment, amount, reason</li>
        <li><strong>Webhook</strong> — event type, payload, delivery status</li>
        <li><strong>FraudCheck</strong> — result of fraud detection pipeline</li>
      </ul>
      <h2>Idempotency — Most Critical Concept</h2>
      <pre>{`class PaymentService {
  processPayment(request: PaymentRequest): Payment {
    // Check if this idempotency key was already processed
    const existing = this.paymentRepo.findByIdempotencyKey(request.idempotencyKey);
    if (existing) return existing; // Return same result, don't charge again

    const payment = new Payment(request);
    this.paymentRepo.save(payment);

    // Process through fraud checks and payment provider
    const fraudResult = this.fraudPipeline.check(request);
    if (fraudResult.rejected) {
      payment.fail("FRAUD_DETECTED");
      return payment;
    }

    const result = this.getProvider(request.method).charge(payment);
    payment.updateFromProviderResult(result);
    this.webhookService.dispatch(payment);
    return payment;
  }
}`}</pre>
      <h2>Strategy for Payment Methods</h2>
      <pre>{`interface PaymentProvider {
  charge(payment: Payment): ProviderResult;
  refund(transaction: Transaction, amount: number): RefundResult;
}
class RazorpayCardProvider implements PaymentProvider { ... }
class UPIProvider            implements PaymentProvider { ... }
class WalletProvider         implements PaymentProvider { ... }`}</pre>
      <h2>Chain of Responsibility for Fraud Detection</h2>
      <pre>{`abstract class FraudCheck {
  protected next: FraudCheck | null = null;
  setNext(c: FraudCheck) { this.next = c; return c; }
  abstract check(req: PaymentRequest): FraudResult;
}
class VelocityCheck extends FraudCheck {
  check(req) {
    const recent = this.txRepo.countInLastHour(req.userId);
    if (recent > 10) return FraudResult.reject("TOO_MANY_ATTEMPTS");
    return this.next?.check(req) ?? FraudResult.pass();
  }
}
class AmountAnomalyCheck extends FraudCheck { ... }
class GeoMismatchCheck   extends FraudCheck { ... }`}</pre>
      <h2>Webhook Reliability</h2>
      <pre>{`class WebhookService {
  dispatch(payment: Payment) {
    const event = new WebhookEvent("payment.captured", payment);
    const merchants = this.merchantRepo.getSubscribed(payment.merchantId);
    merchants.forEach(m => this.deliverWithRetry(m.webhookUrl, event));
  }
  private async deliverWithRetry(url: string, event: WebhookEvent, attempt = 0) {
    const success = await this.httpClient.post(url, event);
    if (!success && attempt < 5)
      setTimeout(() => this.deliverWithRetry(url, event, attempt + 1),
        Math.pow(2, attempt) * 1000);
  }
}`}</pre>
    </>
  );
}
