export default function Content() {
  return (
    <>
      <p>Designing a social media feed like Twitter or Instagram is an advanced LLD problem that tests fan-out strategies, notification systems, and feed ranking. It's asked in senior SDE interviews at Meta, Twitter, and Indian product companies.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>User</strong> — profile, follower/following counts</li>
        <li><strong>Post</strong> — content, media, author, timestamp, hashtags</li>
        <li><strong>Follow</strong> — follower → following relationship</li>
        <li><strong>Feed</strong> — ordered list of posts for a user</li>
        <li><strong>Like / Comment</strong> — engagement on a post</li>
        <li><strong>Hashtag</strong> — maps to trending topics</li>
        <li><strong>Notification</strong> — like, comment, follow events</li>
      </ul>
      <h2>Fan-Out Strategy — The Core Design Decision</h2>
      <p>Two approaches, and you should discuss both in an interview:</p>
      <pre>{`// Fan-out on WRITE: when user posts, push to all followers' feed caches
class FeedService {
  onNewPost(post: Post) {
    const followers = this.followRepo.getFollowers(post.authorId);
    followers.forEach(followerId => {
      this.feedCache.prepend(followerId, post.id); // O(followers) on write
    });
  }
  getFeed(userId: string): Post[] {
    return this.feedCache.get(userId, 100); // O(1) on read
  }
}

// Fan-out on READ: compute feed when requested (better for celebrities)
class LazyFeedService {
  getFeed(userId: string): Post[] {
    const following = this.followRepo.getFollowing(userId);
    return this.postRepo.getRecentFrom(following, limit: 100);
  }
}`}</pre>
      <p><strong>Interview answer:</strong> Hybrid — fan-out on write for normal users; fan-out on read for accounts with millions of followers.</p>
      <h2>Notification System with Observer</h2>
      <pre>{`class Post {
  private observers: PostObserver[] = [];
  addObserver(o: PostObserver) { this.observers.push(o); }

  like(user: User) {
    this.likes.push(user);
    this.observers.forEach(o => o.onLike(this, user));
  }
}
class NotificationObserver implements PostObserver {
  onLike(post: Post, liker: User) {
    if (post.author.id !== liker.id)
      this.notifService.send(post.author, \`\${liker.name} liked your post\`);
  }
}`}</pre>
      <h2>Feed Ranking Strategy</h2>
      <pre>{`interface FeedRankingStrategy { rank(posts: Post[], user: User): Post[]; }
class ChronologicalRanking implements FeedRankingStrategy {
  rank(posts, user) { return posts.sort((a,b) => b.createdAt - a.createdAt); }
}
class EngagementRanking implements FeedRankingStrategy {
  rank(posts, user) {
    return posts.sort((a,b) => (b.likes + b.comments*2) - (a.likes + a.comments*2));
  }
}`}</pre>
    </>
  );
}
