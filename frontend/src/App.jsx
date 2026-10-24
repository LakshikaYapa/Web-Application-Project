import { useEffect, useState } from "react";

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black px-6">
      <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
        Flood<span className="text-teal-400">Guard</span>
      </h1>

      <p role="status" className="text-center text-sm text-slate-400">
        {message}
      </p>
    </main>
  );
}

export default App;