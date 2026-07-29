import React from "react";

/** Project Cerberus seal (official branding, circular crop of the emblem art). */
export default function Seal({ className }) {
  return (
    <img
      className={`seal-img ${className || ""}`}
      src="assets/brand/cerberus.jpg"
      alt="Project Cerberus"
      draggable={false}
    />
  );
}
