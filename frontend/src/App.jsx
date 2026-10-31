import ApprovedFloodReports from "./components/ApprovedFloodReports";
import ApprovedHelpRequests from "./components/ApprovedHelpRequests";
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
import AdminHelpRequests from "./components/AdminHelpRequests";
import AdminFloodReports from "./components/AdminFloodReports";
import AdminContributions from "./components/AdminContributions";
import AdminVolunteers from "./components/AdminVolunteers";

const pages = {
  "/admin/volunteers": AdminVolunteers,
  "/admin/contributions": AdminContributions,
  "/admin/flood-reports": AdminFloodReports,
  "/admin/help-requests": AdminHelpRequests,
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
    <div className="flex min-h-dvh flex-col">
      <a id="page-top" className="skip-link" href="#main">{t("Skip to content")}</a>
      <Header />
      <div className={`flex-1 ${Page === AdminPage ? "flex flex-col [&>main]:flex-1" : ""}`}>
      {Page ? <Page /> : (
      <main id="main" className="homepage" tabIndex={-1}>
        <Hero />
        <div className="homepage-overview">
          <FloodMapPreview />
          <NearbyShelters />
          <CommunityActions />
        </div>
        <ApprovedFloodReports compact />
        <ApprovedHelpRequests compact />
        <ShelterNeeds compact />
        <SafetyGuidance />
        <Volunteers />
        <CommunityGallery />
        <p role="status" className="connection-status">{t(message)}</p>
      </main>
      )}
      </div>
      <Footer flush={Page === AdminPage} />
    </div>
  );
}

export default App;
