export default function Hello() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
        Hello from create-profound-next
      </h1>
      <p style={{ color: "#666", margin: 0 }}>
        Edit{" "}
        <code
          style={{
            background: "#f4f4f4",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          src/app/page.tsx
        </code>{" "}
        to get started.
      </p>
    </div>
  );
}
