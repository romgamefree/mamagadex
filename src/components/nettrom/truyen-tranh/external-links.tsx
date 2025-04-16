export default function ExternalLinks({
  links,
  mangaId,
}: {
  links: string[] | null;
  mangaId: string;
}) {
  const parsedLinks = [
    { name: "MangaDex", url: `https://mangadex.org/title/${mangaId}` },
    ...(links || []).map(url => ({ name: url, url }))
  ];

  return (
    <p className="pl-10 lg:pl-0">
      {parsedLinks.map((i, idx) => {
        if (!i) return null;
        return (
          <>
            {idx !== 0 && ", "}
            <a
              key={idx}
              href={i.url}
              target="_blank"
              className="text-web-title transition hover:text-web-titleLighter"
            >
              {i.name}
            </a>
          </>
        );
      })}
    </p>
  );
}
