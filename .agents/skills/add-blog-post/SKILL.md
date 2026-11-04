---
name: add-blog-post
description: Add a blog post to this AstroWind-derived Dodai template.
---

# Add a blog post

Read `../add-blog-post.md`, `CONTEXT.md`, and `AGENTS.md` before editing.

- Put posts in `src/data/post/` as `.md` or `.mdx`.
- Include the required frontmatter from `src/content.config.ts` and do not invent client facts.
- Use `~/` asset references when local image optimization is intended.
- Confirm whether `apps.blog.isEnabled` is enabled for the current client before assuming the post is routed.
- Run `npm run check` and `npm run build` after adding or changing a post.
