import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { RouterLink } from '@/routes/components';
import ReactMarkdown, { type Options, type Components } from 'react-markdown';

// ----------------------------------------------------------------------

export type MarkdownProps = Options & {
  className?: string;
};

// ----------------------------------------------------------------------

export default function Markdown({ className, ...other }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[rehypeRaw]}
        components={components}
        {...other}
      />
    </div>
  );
}

// ----------------------------------------------------------------------

const components: Components = {
  img: ({ node: _node, alt, ...props }) => <img alt={alt ?? ''} {...props} />,
  a: ({ node: _node, href = '', children, ...props }) => {
    const isHttp = href.includes('http');

    if (isHttp) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink href={href} {...props}>
        {children}
      </RouterLink>
    );
  },
};
