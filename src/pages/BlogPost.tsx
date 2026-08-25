import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import { LeafIcon } from "../components/icons";
import { POSTS } from "../lib/blogPosts";
import NotFound from "./NotFound";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      const meta = document.querySelector('meta[name="description"]');
      meta?.setAttribute("content", post.description);
    }
  }, [post]);

  if (!post) return <NotFound />;

  const others = POSTS.filter((p) => p.slug !== post.slug);

  return (
    <div className="app landing">
      <header className="app-header app-header--landing">
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links nav-links--landing" aria-label="Menu">
            <Link to="/blog" className="nav-link">
              Blog
            </Link>
            <Link to="/" className="btn btn--ghost btn--sm">
              Back
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <article className="privacy blog-post">
          <div className="privacy-head">
            <span className="head-eyebrow">
              <LeafIcon size={13} />
              {post.tag} · {post.readMinutes} min
            </span>
            <h1>{post.title}</h1>
            <p className="privacy-lead">{fmtDate(post.date)}</p>
          </div>

          <div className="blog-body">
            {post.body.map((b, i) =>
              b.h ? (
                <h2 key={i}>{b.h}</h2>
              ) : (
                <p key={i}>{b.p}</p>
              ),
            )}
          </div>

          <div className="blog-cta spot-card">
            <h2>One small step a day — free forever</h2>
            <p>
              A gentle journal with warm replies. No streaks, no guilt, no
              grades.
            </p>
            <Link to="/auth?mode=up" className="btn btn--primary">
              Start free
            </Link>
          </div>

          <div className="blog-more">
            <h2>Keep reading</h2>
            {others.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="blog-card spot-card"
              >
                <span className="blog-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <span className="blog-meta">
                  {fmtDate(p.date)} · {p.readMinutes} min read
                </span>
              </Link>
            ))}
          </div>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
