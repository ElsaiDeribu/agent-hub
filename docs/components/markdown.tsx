"use client";

import Link from "next/link";
import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownProps = Options & {
  className?: string;
};

export function Markdown({ className, ...other }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        components={components}
        {...other}
      />
    </div>
  );
}

const components: Components = {
  img: ({ alt, src, title, ...props }) => (
    <img alt={alt ?? ""} src={src} title={title} {...props} />
  ),
  a: ({ href = "", children, ...props }) => {
    const isHttp = href.startsWith("http");

    if (isHttp) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }

    return <Link href={href} {...props}>{children}</Link>;
  },
};
