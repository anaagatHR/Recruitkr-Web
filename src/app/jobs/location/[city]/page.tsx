export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: any;
}) {
  const resolvedParams = await Promise.resolve(params);
  const city = resolvedParams?.city || "Location";

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: "28px" }}>Jobs in {city}</h1>
      <p style={{ color: "#666", marginTop: "10px" }}>
        We are onboarding live employers in this location.
      </p>
      <a
        href="/jobs"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none"
        }}
      >
        View all live jobs
      </a>
    </div>
  );
}
