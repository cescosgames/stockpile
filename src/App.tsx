import { useState } from "react";
import { useStore } from "./hooks/useStore";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import AnimalList from "./components/AnimalList";
import FeedList from "./components/FeedList";
import Checklist from "./components/Checklist";
import SettingsModal from "./components/SettingsModal";
import type { Tab } from "./types";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const store = useStore();
  const { settings, setSettings } = store;

  return (
    <Layout
      active={tab}
      farmName={settings.farmName}
      timezone={settings.timezone}
      onTabChange={setTab}
      onOpenSettings={() => setShowSettings(true)}
    >
      {tab === "dashboard" && (
        <Dashboard
          animals={store.animals}
          feedItems={store.feedItems}
          feedingTasks={store.feedingTasks}
          checkedState={store.checkedState}
          timezone={settings.timezone}
        />
      )}
      {tab === "animals" && (
        <AnimalList animals={store.animals} setAnimals={store.setAnimals} />
      )}
      {tab === "feed" && (
        <FeedList feedItems={store.feedItems} feedingTasks={store.feedingTasks} setFeedItems={store.setFeedItems} />
      )}
      {tab === "checklist" && (
        <Checklist
          feedingTasks={store.feedingTasks}
          feedItems={store.feedItems}
          checkedState={store.checkedState}
          timezone={settings.timezone}
          setChecked={store.setChecked}
          setFeedingTasks={store.setFeedingTasks}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </Layout>
  );
}
