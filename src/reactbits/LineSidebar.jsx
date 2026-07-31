import { useEffect, useRef, useState } from "react";

/**
 * Line sidebar in the reactbits.dev style (the original is a Pro component,
 * so this is an original offline implementation): a slim vertical rail with
 * one node per app; hovering reveals labels, open apps glow.
 */
export default function LineSidebar({ items = [], onSelect, title = "" }) {
  const [hovered, setHovered] = useState(false);
  const railRef = useRef(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    rail.addEventListener("pointerenter", enter);
    rail.addEventListener("pointerleave", leave);
    return () => {
      rail.removeEventListener("pointerenter", enter);
      rail.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={railRef} className={`line-sidebar ${hovered ? "open" : ""}`}>
      {title && <div className="line-sidebar-title">{title}</div>}
      <div className="line-sidebar-rail" />
      <div className="line-sidebar-items">
        {items.map((item) => (
          <button
            key={item.id}
            className={`line-sidebar-item ${item.active ? "active" : ""} ${item.folder ? "folder" : ""}`}
            onClick={() => onSelect?.(item.id)}
            title={item.label}
          >
            <span className="line-sidebar-node" />
            <span className="line-sidebar-label">{item.folder ? `[${item.label}]` : item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
