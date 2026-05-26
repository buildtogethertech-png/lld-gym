export default function Content() {
  return (
    <>
      <p>
        Social Media Feed (Twitter / Instagram) Low Level Design is an advanced problem asked in senior
        SDE interviews at Meta, Twitter, LinkedIn, and ShareChat. It covers post creation, follow
        relationships, feed generation (fan-out strategies), trending hashtags, and the Observer pattern for
        real-time updates. This guide covers the complete Social Media Feed LLD with Java code, class
        diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Social Media Feed LLD</h2>
      <p>
        The feed problem is a design pattern showcase with a real algorithmic challenge. Interviewers want
        to see:
      </p>
      <ul>
        <li>Can you explain fan-out on write vs fan-out on read for feed generation?</li>
        <li>Do you use Observer pattern for real-time notification on new posts?</li>
        <li>Can you model the follow relationship without a social graph framework?</li>
        <li>Do you handle celebrity accounts differently (hybrid fan-out)?</li>
        <li>Can you design trending hashtags using a sliding window counter?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can create posts (text, image, video) with optional hashtags</li>
        <li>Users can follow and unfollow other users</li>
        <li>Home feed shows recent posts from followed users, reverse chronological</li>
        <li>Users can like and comment on posts</li>
        <li>Trending hashtags — top 10 most used in the last hour</li>
        <li>User profile feed — all posts by a specific user</li>
        <li>Followers get a real-time notification when someone they follow posts</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Feed load must be under 200ms for a user with 1000 followees</li>
        <li>A post by a celebrity (10M followers) must propagate to feeds within 60 seconds</li>
        <li>Trending hashtags must update in near real-time (5-minute lag acceptable)</li>
        <li>Feed must handle paginated reads (cursor-based, 20 posts per page)</li>
      </ul>

      <h2>Core Entities — Social Media Feed LLD Class Design</h2>
      <ul>
        <li><strong>User</strong> — id, username, displayName, followerCount, followeeCount</li>
        <li><strong>Post</strong> — id, authorId, content, mediaUrls, hashtags, likeCount, createdAt</li>
        <li><strong>Follow</strong> — followerId, followeeId, createdAt</li>
        <li><strong>FeedItem</strong> — userId, postId, score (for ranking), addedAt</li>
        <li><strong>Like</strong> — userId, postId, createdAt</li>
        <li><strong>Comment</strong> — id, postId, authorId, content, createdAt</li>
        <li><strong>HashtagCount</strong> — hashtag, window, count (for trending)</li>
        <li><strong>FeedService</strong> — getFeed, addToFeeds (fan-out)</li>
        <li><strong>TrendingService</strong> — count hashtag use, return top-N</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`User
+-- id, username, bio: String
+-- followerCount, followeeCount: int
+-- isVerified: boolean

Post
+-- id, authorId: String
+-- content: String
+-- mediaUrls: List<String>
+-- hashtags: List<String>
+-- likeCount, commentCount: int
+-- createdAt: LocalDateTime

Follow
+-- followerId, followeeId: String
+-- createdAt: LocalDateTime

FeedItem
+-- userId, postId: String
+-- score: double  (for ranking)
+-- addedAt: LocalDateTime

FeedService
+-- getFeed(userId, cursor, limit): List<Post>
+-- onNewPost(post): void  // fan-out

TrendingService
+-- recordHashtags(hashtags): void
+-- getTopN(n, windowMinutes): List<String>

PostService
+-- createPost(request, userId): Post
+-- likePost(postId, userId): void
+-- addComment(postId, userId, content): Comment`}</pre>

      <h2>Fan-Out on Write — Feed Generation</h2>
      <p>
        Fan-out on write: when a user posts, immediately push the post to all their followers' feed caches.
        Fast reads (O(1) cache hit), but expensive writes for celebrity accounts with millions of followers.
      </p>
      <pre>{`public class FeedService {
    private final FollowRepository followRepo;
    private final FeedCacheService feedCache; // Redis sorted set per user
    private static final int MAX_FEED_SIZE = 1000; // trim to 1000 posts per user
    private static final int CELEBRITY_THRESHOLD = 100_000; // followers

    public void onNewPost(Post post) {
        User author = userRepo.findById(post.getAuthorId());

        if (author.getFollowerCount() < CELEBRITY_THRESHOLD) {
            // Fan-out on write: push to all followers' feeds
            fanOutToFollowers(post);
        } else {
            // Celebrity: skip fan-out, let followers pull on read
            // Store post in celebrity's own feed only
            feedCache.addPost(post.getAuthorId(), post.getId(), post.getCreatedAt().toEpochSecond(ZoneOffset.UTC));
        }
    }

    private void fanOutToFollowers(Post post) {
        List<String> followerIds = followRepo.getFollowerIds(post.getAuthorId());
        double score = post.getCreatedAt().toEpochSecond(ZoneOffset.UTC);

        // Batch in chunks to avoid blocking
        Lists.partition(followerIds, 500).forEach(batch -> {
            for (String followerId : batch) {
                feedCache.addPost(followerId, post.getId(), score);
                feedCache.trim(followerId, MAX_FEED_SIZE); // keep feed bounded
            }
        });
    }

    // Hybrid read for celebrity accounts
    public List<Post> getFeed(String userId, String cursor, int limit) {
        // Get cached feed (fan-out posts)
        List<String> postIds = feedCache.getPostIds(userId, cursor, limit);

        // Merge in celebrity posts not fan-outed
        List<String> followedCelebs = followRepo.getFollowedCelebrities(userId);
        List<Post> celebPosts = followedCelebs.stream()
            .flatMap(celebId -> feedCache.getPostIds(celebId, cursor, limit * 2).stream())
            .map(postRepo::findById)
            .collect(Collectors.toList());

        // Merge and sort by score (timestamp)
        List<Post> allPosts = new ArrayList<>(postRepo.findAllByIds(postIds));
        allPosts.addAll(celebPosts);
        allPosts.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        return allPosts.subList(0, Math.min(limit, allPosts.size()));
    }
}`}</pre>

      <h2>Trending Hashtags — Sliding Window Counter</h2>
      <pre>{`public class TrendingService {
    // hashtag -> sorted set of timestamps (for sliding window)
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> tagTimestamps = new ConcurrentHashMap<>();

    public void recordHashtags(List<String> hashtags) {
        long now = System.currentTimeMillis();
        for (String tag : hashtags) {
            tagTimestamps.computeIfAbsent(tag, k -> new ConcurrentLinkedDeque<>()).addLast(now);
        }
    }

    public List<String> getTopN(int n, int windowMinutes) {
        long cutoff = System.currentTimeMillis() - windowMinutes * 60_000L;

        return tagTimestamps.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                e -> {
                    // Count entries within window (evict expired entries)
                    e.getValue().removeIf(t -> t < cutoff);
                    return e.getValue().size();
                }
            ))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(n)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Fan-out on write for normal users:</strong> Pre-compute feeds at write time so reads are
          O(1) cache hits. Works well for users with under 100K followers. The write overhead is acceptable
          for typical social graphs.
        </li>
        <li>
          <strong>Hybrid fan-out for celebrities:</strong> Fan-out to 10M feeds synchronously is too slow.
          For celebrity posts, skip fan-out. On feed read, merge the user's cached feed with recent posts
          from any celebrities they follow. This is the exact strategy used by Twitter.
        </li>
        <li>
          <strong>Redis sorted set with timestamp as score:</strong> Feed items are stored in a sorted set
          with Unix timestamp as the score. getFeed is a ZREVRANGE (reverse chronological) with cursor-
          based pagination — no full scan.
        </li>
        <li>
          <strong>Sliding window for trending:</strong> A deque of timestamps per hashtag. On query, evict
          entries older than the window and count the remainder. This avoids storing a separate counter that
          could drift under concurrent increments.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you rank feed posts beyond reverse chronological?"</strong> — Add an engagement
          score to FeedItem: likeCount * weightLike + commentCount * weightComment + recency * weightTime.
          Store score as the sorted set score in Redis. Update on likes and comments.
        </li>
        <li>
          <strong>"How do you handle a user unfollowing someone?"</strong> — Remove all posts by that user
          from the unfollower's feed cache lazily (on next feed load, filter out unfollowed users) or
          eagerly (background job removes their postIds). Lazy is simpler; eager keeps the cache clean.
        </li>
        <li>
          <strong>"How do you implement pagination for the feed?"</strong> — Use cursor-based pagination:
          the cursor is the score (timestamp) of the last seen item. ZREVRANGEBYSCORE in Redis returns
          items with score less than the cursor. No OFFSET — O(log n) per page.
        </li>
      </ul>

      <h2>FAQ — Social Media Feed Low Level Design</h2>

      <h3>What is fan-out on write vs fan-out on read?</h3>
      <p>
        Fan-out on write: push a new post to all followers' feed caches at write time. Fast reads,
        expensive writes. Fan-out on read: do not push; when a user requests their feed, query all
        followees and merge. Slow reads (N queries for N followees), cheap writes. Hybrid: fan-out on
        write for regular users, fan-out on read for celebrity followees only.
      </p>

      <h3>How do you design trending hashtags?</h3>
      <p>
        Maintain a sliding window counter per hashtag. On post creation, record a timestamp for each
        hashtag. On trending query, count timestamps within the last N minutes. Sort by count descending
        and return top 10. For scale, use Redis with EXPIRE keys or a stream-processing framework like
        Kafka Streams for real-time aggregation.
      </p>

      <h3>What design patterns are used in Social Media Feed LLD?</h3>
      <p>
        The primary patterns are <strong>Observer</strong> (followers notified on new post),
        <strong>Strategy</strong> (fan-out strategy — write-through vs read-time merge for celebrities),
        and <strong>Repository</strong> (FeedCacheService backed by Redis, PostRepository backed by DB).
      </p>

      <h3>How do you handle a user with 10 million followers posting?</h3>
      <p>
        Skip the synchronous fan-out. Store the post in the author's own feed only. When any follower loads
        their feed, merge the cached fan-out feed with recent posts from followed celebrities. This hybrid
        approach (used by Twitter's Flock system) keeps both write latency and read latency bounded.
      </p>
    </>
  );
}
