export function DefaultErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", color: "#2b2b2b", marginBottom: "0.75rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#6b6b6b", maxWidth: "28rem" }}>
        We hit an unexpected error. Please refresh the page or call us at +91 9216400005.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "1.5rem",
          borderRadius: "999px",
          background: "#2b2b2b",
          color: "#fff",
          padding: "0.65rem 1.75rem",
          fontSize: "0.75rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          border: "none",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}
