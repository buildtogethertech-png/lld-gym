export default function Content() {
  return (
    <>
      <p>The LRU Cache is one of the most commonly asked LLD/data-structure problems at FAANG companies. It combines a HashMap and Doubly Linked List for O(1) operations, and tests your understanding of cache eviction, TTL, and thread safety. Here's the complete design.</p>
      <h2>Core Requirements</h2>
      <ul>
        <li>get(key): O(1) — return value or null</li>
        <li>put(key, value): O(1) — insert; evict LRU entry if at capacity</li>
        <li>TTL per entry — auto-evict expired entries</li>
        <li>Thread-safe operations</li>
        <li>Cache statistics: hits, misses, evictions</li>
      </ul>
      <h2>Core Data Structures</h2>
      <pre>{`class CacheNode<K, V> {
  key: K; value: V;
  expiresAt: number | null;  // epoch ms; null = no expiry
  prev: CacheNode<K,V> | null = null;
  next: CacheNode<K,V> | null = null;
}

class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, CacheNode<K,V>>();
  private head: CacheNode<K,V>; // Most recently used
  private tail: CacheNode<K,V>; // Least recently used
  private hits = 0; misses = 0; evictions = 0;
}`}</pre>
      <h2>Get and Put — O(1) Operations</h2>
      <pre>{`get(key: K): V | null {
  const node = this.map.get(key);
  if (!node) { this.misses++; return null; }
  if (this.isExpired(node)) { this.evict(node); this.misses++; return null; }
  this.moveToFront(node); // Mark as recently used
  this.hits++;
  return node.value;
}

put(key: K, value: V, ttlSeconds?: number): void {
  if (this.map.has(key)) {
    const node = this.map.get(key)!;
    node.value = value;
    node.expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.moveToFront(node);
    return;
  }
  if (this.map.size >= this.capacity) this.evictLRU();
  const node = new CacheNode(key, value, ttlSeconds);
  this.map.set(key, node);
  this.addToFront(node);
}

private evictLRU(): void {
  const lru = this.tail.prev!;
  this.removeNode(lru);
  this.map.delete(lru.key);
  this.evictions++;
}`}</pre>
      <h2>Strategy Pattern for Eviction Policy</h2>
      <pre>{`interface EvictionPolicy<K,V> { evict(cache: Map<K, CacheNode<K,V>>): K; }
class LRUPolicy<K,V>  implements EvictionPolicy<K,V> { ... }
class LFUPolicy<K,V>  implements EvictionPolicy<K,V> { ... }
class FIFOPolicy<K,V> implements EvictionPolicy<K,V> { ... }`}</pre>
      <h2>Thread Safety</h2>
      <p>In Java: use ReentrantReadWriteLock — reads can be concurrent, writes are exclusive. In JavaScript (single-threaded): no locking needed, but in distributed systems use Redis with Lua scripts for atomic operations.</p>
      <h2>Common Questions</h2>
      <ul>
        <li>"How is TTL handled?" → Check expiry on every get(); background thread sweeps expired entries</li>
        <li>"How to add LFU?" → Strategy pattern — swap EvictionPolicy without touching cache logic</li>
        <li>"How to make it distributed?" → Use Redis; LRU is Redis's built-in eviction policy</li>
      </ul>
    </>
  );
}
