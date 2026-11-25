import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import SplashScreen from "./components/SplashScreen";
import AuthGate from "./components/AuthGate";
import Topbar from "./components/Topbar";
import BadgeDock from "./components/BadgeDock";
import DashboardView from "./components/DashboardView";
import CampusMapView from "./components/CampusMapView";
import ChronosView from "./components/ChronosView";
import NeuralCalView from "./components/NeuralCalView";
import ExamTermView from "./components/ExamTermView";
import TermBookView from "./components/TermBookView";
import MySlotsView from "./components/MySlotsView";
import VaultView from "./components/VaultView";
import RedditView from "./components/RedditView";
import ProctorChatView from "./components/ProctorChatView";
import AdminView from "./components/AdminView";

function Shell() {
  const { showSplash, finishSplash, user, activeView } = useApp();

  if (showSplash) {
    return <SplashScreen onComplete={finishSplash} />;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <>
      <Topbar />
      <main className="max-w-[1180px] mx-auto px-3 sm:px-5 py-5 pb-24 relative z-10">
        {activeView === "home" && <DashboardView />}
        {activeView === "map" && <CampusMapView />}
        {activeView === "tt" && <ChronosView />}
        {activeView === "cal" && <NeuralCalView />}
        {activeView === "exam" && <ExamTermView />}
        {activeView === "book" && <TermBookView />}
        {activeView === "mybk" && <MySlotsView />}
        {activeView === "vault" && <VaultView />}
        {activeView === "reddit" && <RedditView />}
        {activeView === "proctor" && <ProctorChatView />}
        {activeView === "admin" && <AdminView />}
      </main>
      <BadgeDock />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="bg-blobs">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
      </div>
      <Shell />
    </AppProvider>
  );
}
