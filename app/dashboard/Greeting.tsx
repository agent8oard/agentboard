"use client";

export function Greeting({ name }: { name: string }) {
  const h = new Date().getHours();
  const salutation = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return <>{salutation}, {name}</>;
}
