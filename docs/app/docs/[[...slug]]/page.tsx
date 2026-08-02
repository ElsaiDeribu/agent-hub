import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        {page.data.title}
      </h1>
      {page.data.description ? (
        <p className="mb-8 text-lg text-muted-foreground">
          {page.data.description}
        </p>
      ) : null}
      <article className="max-w-none">
        <MDX components={getMDXComponents()} />
      </article>
    </>
  );
}

// Returns each MDX doc slug so Next can prebuild those static pages at build time.
export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
