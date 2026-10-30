import { useLanguage } from "./i18n/useLanguage";
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
import HelpRequestPage from "./components/HelpRequestPage";
import MyHelpRequests from "./components/MyHelpRequests";
import VolunteerPage from "./components/VolunteerPage";
import FunderPage from "./components/FunderPage";
import MyContributions from "./components/MyContributions";
import FloodReportPage from "./components/FloodReportPage";
import AddShelterPage from "./components/AddShelterPage";
import ShelterDirectory from "./components/ShelterDirectory";
import AdminPage from "./components/AdminPage";
import AdminShelters from "./components/AdminShelters";

const pages = {
  "/admin/shelters": AdminShelters,
  "/admin": AdminPage,
  "/shelters": ShelterDirectory,
  "/add-shelter": AddShelterPage,
  "/report-flood": FloodReportPage,
  "/volunteer": VolunteerPage,
  "/funder": FunderPage,
  "/my-contributions": MyContributions,
  "/my-requests": MyHelpRequests,
  "/request-help": HelpRequestPage,
};

function App() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("Connecting to backend...");
  const Page = pages[window.location.pathname.replace(/\/$/, "")];

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
      <a id="page-top" className="skip-link" href="#main">{t("Skip to content")}</a>
      <Header />
      {Page ? <Page /> : (
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
        <p role="status" className="connection-status">{t(message)}</p>
      </main>
      )}
      <Footer />
    </>
  );
}

export default App;
