import { useEffect, useState } from "react";
import Header from "./components/Header";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();

        setMessage(data.message);
      } catch (error) {
        if (error.name !== "AbortError") {
          setMessage("Cannot connect to backend.");
        }
      }
    }

    checkBackend();

    return () => controller.abort();
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="homepage-placeholder" tabIndex={-1}>
        <p role="status" className="connection-status">{message}</p>
      </main>
    </>
  );
}

export default App;
