export function Avatar({
  name,
  color = "#64748b",
  size = 28,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const parts = name.trim().split(" ");
  const init = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {init.toUpperCase()}
    </span>
  );
}
