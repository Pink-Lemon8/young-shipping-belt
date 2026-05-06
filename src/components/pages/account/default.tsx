"use client";
export default function AccountDefault({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  return <section className="relative">{children}</section>;
}
