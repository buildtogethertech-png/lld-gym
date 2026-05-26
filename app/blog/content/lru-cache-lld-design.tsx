export default function Content() {
  return (
    <>
      <p>LRU Cache Low Level Design is one of the most frequently asked problems in software engineering interviews at Google, Microsoft, Amazon, and startups. It tests both your data structure knowledge (HashMap + Doubly Linked List for O(1) operations) and your OOP design skills. This complete LRU cache LLD guide covers the full solution with Java code, class diagram, TTL support, and thread safety.</p>

      <h2>Why Interviewers Ask LRU Cache LLD</h2>
      <p>LRU Cache bridges algorithms and system design. Interviewers use it to test:</p>
      <ul>
        <li>Do you know why a HashMap alone is not enough — it has no ordering?</li>
        <li>Can you combine two data structures to achieve O(1) get and put?</li>
        <li>Do you think about thread safety for concurrent access?</li>
        <li>Can you extend it with TTL support or an LFU variant?</li>
        <li>Do you encapsulate internals properly with a private Node class?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>get(key): return value if present and move key to most-recently-used position, else return -1</li>
        <li>put(key, value): insert or update. If at capacity, evict the least recently used entry first</li>
        <li>Capacity is fixed at construction time</li>
        <li>Both get and put must run in O(1) time</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Thread-safe: concurrent get/put must not corrupt cache state</li>
        <li>Optional: TTL — entries expire after a configurable duration</li>
        <li>Optional: eviction listener — callback when an entry is evicted</li>
      </ul>

      <h2>Why HashMap + Doubly Linked List?</h2>
      <p>A HashMap gives O(1) lookup but no ordering. A Queue gives ordering but O(n) lookup. Combining them: the map stores node references for O(1) lookup, and the doubly linked list gives O(1) move-to-front and O(1) remove-from-tail via direct pointer manipulation. This is the key insight interviewers want to hear.</p>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`LRUCache
+-- capacity: int
+-- map: HashMap<Integer, Node>
+-- head: Node  (dummy, most-recent end)
+-- tail: Node  (dummy, least-recent end)
+-- get(key): int
+-- put(key, value): void
+-- moveToFront(node): void
+-- addToFront(node): void
+-- removeNode(node): void
+-- evictLRU(): void

Node (private inner class)
+-- key: int
+-- val: int
+-- prev: Node
+-- next: Node`}</pre>

      <h2>LRU Cache Implementation — Java</h2>
      <pre>{`public class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head; // dummy, most-recent side
    private final Node tail; // dummy, least-recent side

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        moveToFront(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.val = value;
            moveToFront(node);
        } else {
            if (map.size() == capacity) evictLRU();
            Node node = new Node(key, value);
            map.put(key, node);
            addToFront(node);
        }
    }

    private void moveToFront(Node node) { removeNode(node); addToFront(node); }

    private void addToFront(Node node) {
        node.next = head.next; node.prev = head;
        head.next.prev = node; head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void evictLRU() {
        Node lru = tail.prev;
        removeNode(lru);
        map.remove(lru.key);
    }

    private static class Node {
        int key, val; Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }
}`}</pre>

      <h2>Thread-Safe LRU Cache</h2>
      <pre>{`public class ThreadSafeLRUCache {
    private final LRUCache cache;
    private final ReentrantLock lock = new ReentrantLock();

    public ThreadSafeLRUCache(int capacity) { this.cache = new LRUCache(capacity); }

    public int get(int key) {
        lock.lock();
        try { return cache.get(key); } finally { lock.unlock(); }
    }

    public void put(int key, int value) {
        lock.lock();
        try { cache.put(key, value); } finally { lock.unlock(); }
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li><strong>Dummy head and tail nodes:</strong> Sentinel nodes eliminate null checks in addToFront and removeNode, making the code cleaner and less error-prone.</li>
        <li><strong>Store key in Node:</strong> When evicting the LRU node you need to remove it from the map. Storing the key in Node lets you do map.remove(lru.key) without a reverse lookup.</li>
        <li><strong>Write lock for get:</strong> get modifies list order (moves node to front), so it cannot use a read lock. Using a read lock for get is a common interview mistake.</li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li><strong>"How would you implement an LFU cache?"</strong> — Use two maps: key-to-node and frequency-to-doubly-linked-list, plus a minFreq counter. All operations O(1).</li>
        <li><strong>"Can you use LinkedHashMap?"</strong> — Yes. Extend LinkedHashMap with accessOrder=true and override removeEldestEntry. Interviewers want the manual implementation to test data structure understanding.</li>
        <li><strong>"How do you add TTL?"</strong> — Add an expiry timestamp to Node. In get, check expiry before returning. If expired, remove and return -1. Run a background sweeper thread for cleanup.</li>
      </ul>

      <h2>FAQ — LRU Cache Low Level Design</h2>

      <h3>Why is HashMap + Doubly Linked List used for LRU cache?</h3>
      <p>HashMap gives O(1) key lookup. Doubly Linked List gives O(1) insertion at front and removal from any position using direct node references stored in the map. Together they achieve O(1) get and put. A singly linked list would need O(n) to find the previous node for removal.</p>

      <h3>What is the time complexity of LRU cache operations?</h3>
      <p>Both get and put are O(1) average. HashMap lookup is O(1) average. Linked list operations (addToFront, removeNode, evictLRU) are O(1) because we have direct node references — no traversal needed.</p>

      <h3>How is LRU cache used in real systems?</h3>
      <p>Database query caches, DNS caches, CPU instruction caches, CDN edge caches, and browser caches all use LRU or variants. Redis implements LRU and LFU eviction policies. Java's LinkedHashMap is a built-in LRU used in application-level caching.</p>
    </>
  );
}
