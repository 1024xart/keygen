type Kind = "disk" | "text" | "paint" | "computer";

export default function PixelIcon({
  kind,
  color = "#7069cf",
}: {
  kind: Kind;
  color?: string;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {kind === "disk" ? (
        <>
          <path d="M4 3h22l3 3v23H3V4h1" fill="#111" />
          <path d="M4 4h21l3 3v21H4z" fill={color} />
          <path d="M6 4h17v10H6z" fill="#c9c9d2" />
          <path d="M17 5h4v7h-4z" fill="#353441" />
          <path d="M7 18h18v10H7z" fill="#d8d8df" />
          <path d="M10 21h12v1H10zm0 3h9v1h-9z" fill="#646272" />
          <path d="M4 4h2v24H4zm2 0h18v1H6z" fill="#ffffff50" />
        </>
      ) : kind === "text" ? (
        <>
          <path d="M7 2h14l6 6v22H6V3h1z" fill="#121212" />
          <path d="M7 3h13v6h6v20H7z" fill="#d8d6ce" />
          <path d="M20 3v6h6z" fill="#96959d" />
          <path
            d="M10 12h13v1H10zm0 4h13v1H10zm0 4h10v1H10zm0 4h12v1H10z"
            fill="#59575c"
          />
        </>
      ) : kind === "paint" ? (
        <>
          <path d="M4 7h24v22H4z" fill="#111" />
          <path d="M5 8h22v20H5z" fill="#ceccd5" />
          <path d="M7 11h18v14H7z" fill="#39303c" />
          <path d="m8 23 6-9 4 5 3-3 4 7z" fill="#7771ac" />
          <path d="m20 5 3-3 3 3-3 3-2 9-5 5-3-3 5-5z" fill="#e8c18a" />
          <path d="m13 19 3 3-7 4z" fill="#b6a8f1" />
        </>
      ) : (
        <>
          <path d="M3 3h26v20H3zM1 26h30v4H1z" fill="#92909b" />
          <path d="M5 5h22v15H5z" fill="#141024" />
          <path d="M8 8h4v2H8zm0 4h9v2H8zm3 9h10v5H11z" fill="#c3b5e5" />
          <path d="M3 27h26v1H3z" fill="#eee" />
        </>
      )}
    </svg>
  );
}
