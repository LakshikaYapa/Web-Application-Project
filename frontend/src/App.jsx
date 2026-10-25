import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import FloodMapPreview from "./components/FloodMapPreview";
import NearbyShelters from "./components/NearbyShelters";
import CommunityActions from "./components/CommunityActions";
import Volunteers from "./components/Volunteers";
import CommunityGallery from "./components/CommunityGallery";
import ShelterNeeds from "./components/ShelterNeeds";
import SafetyGuidance from "./components/SafetyGuidance";
import Footer from "./components/Footer";

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
      <a id="page-top" className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="homepage" tabIndex={-1}>
        <Hero />
        <div className="homepage-overview">
          <FloodMapPreview />
          <NearbyShelters />
          <CommunityActions />
        </div>
        <Volunteers />
        <CommunityGallery />
        <ShelterNeeds />
        <SafetyGuidance />
        <p role="status" className="connection-status">{message}</p>
      </main>
      <Footer />
    </>
  );
}

export default App;
