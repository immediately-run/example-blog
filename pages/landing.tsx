import { Include } from "@immediately-run/sdk/components/Include";
import { Link } from "@immediately-run/sdk/components/MDXComponents";
import { useMetadataQuery, useFileMetadata, useMounts, requestEdit } from "@immediately-run/sdk";
import { useCallback, useMemo, useState } from "react";

declare const module: any;

export type Metadata = Record<string, any>;
export type FilesMetadata = Record<string, Metadata>;

export const ArticleCard = ({ path }: { path: string }) => {
  const metadata = useFileMetadata(path);
  const mounts = useMounts();

  // Check if workspace is writable
  const isWritable = useMemo(() => {
    const worktree = mounts.find((m: any) => m.type === "worktree");
    // Default to read-only if we are unauthenticated or if it's explicitly 'ro'
    if (!worktree) return false;
    return worktree.mode !== "ro";
  }, [mounts]);

  const handleEditClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Strip leading '/app/' to get repo-relative path required by requestEdit
      const relPath = path.startsWith("/app/") ? path.substring(5) : path;
      await requestEdit({ path: relPath });
    } catch (err: any) {
      console.error("Failed to request edit:", err);
    }
  };

  return (
    metadata && (
      <article className="post-card">
        <div className="post-meta">
          {metadata.tags && metadata.tags.length > 0 && (
            <span className="tag">{metadata.tags.join(", ")}</span>
          )}
          {metadata.date && <span>{metadata.date}</span>}
          {metadata.readtime && <span>{metadata.readtime}</span>}
          {isWritable && (
            <button
              onClick={handleEditClick}
              className="btn-primary"
              style={{
                marginLeft: "auto",
                padding: "0.2rem 0.6rem",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              edit ✎
            </button>
          )}
        </div>
        <h2>{metadata.title ?? path}.</h2>
        {metadata.excerpt && <p>{metadata.excerpt}</p>}
        <Link href={path} className="read-more">Read More →</Link>
      </article>
    )
  );
};

const getQueryArray = (queryResponse: any): any[] => {
  if (!queryResponse) return [];
  if (Array.isArray(queryResponse)) return queryResponse;
  if ("result" in queryResponse && Array.isArray(queryResponse.result)) {
    return queryResponse.result;
  }
  return [];
};

export const ArticlesList = ({
  searchQuery,
  selectedTag,
  onTagsLoaded,
}: {
  searchQuery: string;
  selectedTag: string | null;
  onTagsLoaded: (tags: string[]) => void;
}) => {
  // Query all MDX entries in the entries directory
  const queryFn = useCallback(
    (filesMetadata: FilesMetadata) =>
      Object.keys(filesMetadata).filter(
        (path) => path.startsWith("/app/pages/entries/") && path.endsWith(".mdx")
      ),
    [],
  );
  
  const pathsResult = useMetadataQuery(queryFn);
  const paths = getQueryArray(pathsResult);

  // Query unique tags across all entries
  const tagsQueryFn = useCallback(
    (filesMetadata: FilesMetadata) => {
      const tagsSet = new Set<string>();
      Object.entries(filesMetadata).forEach(([path, meta]) => {
        if (path.startsWith("/app/pages/entries/") && meta && Array.isArray(meta.tags)) {
          meta.tags.forEach((t) => tagsSet.add(t));
        }
      });
      return Array.from(tagsSet).sort();
    },
    [],
  );

  const allTagsResult = useMetadataQuery(tagsQueryFn);
  const allTags = getQueryArray(allTagsResult);
  useMemo(() => {
    if (allTags && allTags.length > 0) {
      onTagsLoaded(allTags);
    }
  }, [allTags, onTagsLoaded]);

  // Query filtered paths
  const filteredPathsQueryFn = useCallback(
    (filesMetadata: FilesMetadata) => {
      return Object.entries(filesMetadata)
        .filter(([path, meta]) => {
          if (!path.startsWith("/app/pages/entries/") || !path.endsWith(".mdx")) {
            return false;
          }
          if (!meta) return false;

          // Tag filter
          if (selectedTag && (!Array.isArray(meta.tags) || !meta.tags.includes(selectedTag))) {
            return false;
          }

          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const titleMatch = meta.title?.toLowerCase().includes(query);
            const excerptMatch = meta.excerpt?.toLowerCase().includes(query);
            const tagsMatch = meta.tags?.some((t: string) => t.toLowerCase().includes(query));
            if (!titleMatch && !excerptMatch && !tagsMatch) {
              return false;
            }
          }

          return true;
        })
        .map(([path]) => path);
    },
    [searchQuery, selectedTag]
  );

  const filteredPathsResult = useMetadataQuery(filteredPathsQueryFn);
  const filteredPaths = getQueryArray(filteredPathsResult);

  const cards = useMemo(() => {
    if (!filteredPaths || filteredPaths.length === 0) {
      return <div className="no-results">No entries found matching your criteria.</div>;
    }
    return filteredPaths.map((path) => <ArticleCard key={path} path={path} />);
  }, [filteredPaths]);

  return <section className="posts-grid" style={{ gridColumn: 1 }}>{cards}</section>;
};

const Homepage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const handleTagsLoaded = useCallback((tags: string[]) => {
    setAvailableTags(tags);
  }, []);

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "3rem",
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Search Input Box */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              color: "var(--ink)",
              padding: "0.8rem 1.2rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="btn-primary"
              style={{ padding: "0.8rem 1.2rem" }}
            >
              clear filter
            </button>
          )}
        </div>

        <ArticlesList
          searchQuery={searchQuery}
          selectedTag={selectedTag}
          onTagsLoaded={handleTagsLoaded}
        />
      </div>

      <aside className="sidebar">
        <h3>Popular Posts</h3>
        <Include filename="/app/pages/popular_posts.mdx" baseModule={module} />

        <h3 style={{ marginTop: "3rem" }}>Categories</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          {availableTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <span
                key={tag}
                className="tag"
                onClick={() => handleTagClick(tag)}
                style={{
                  cursor: "pointer",
                  background: isSelected ? "var(--accent)" : "var(--panel-border)",
                  color: isSelected ? "white" : "var(--ink)",
                  borderColor: isSelected ? "var(--accent)" : "var(--panel-border)",
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </aside>
    </main>
  );
};

export default Homepage;
