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
      pbOnline={store.pbOnline}
      syncMode={settings.syncMode}
    >
      <div className={tab === "dashboard" ? "" : "hidden"}>
        <Dashboard
          animals={store.animals}
          feedItems={store.feedItems}
          feedingTasks={store.feedingTasks}
          checkedState={store.checkedState}
          timezone={settings.timezone}
          notes={store.notes}
          setNotes={store.setNotes}
        />
      </div>
      <div className={tab === "animals" ? "" : "hidden"}>
        <AnimalList animals={store.animals} setAnimals={store.setAnimals} />
      </div>
      <div className={tab === "feed" ? "" : "hidden"}>
        <FeedList feedItems={store.feedItems} feedingTasks={store.feedingTasks} setFeedItems={store.setFeedItems} />
      </div>
      <div className={tab === "checklist" ? "" : "hidden"}>
        <Checklist
          feedingTasks={store.feedingTasks}
          weeklyTasks={store.weeklyTasks}
          feedItems={store.feedItems}
          animals={store.animals}
          checkedState={store.checkedState}
          timezone={settings.timezone}
          setChecked={store.setChecked}
          setFeedingTasks={store.setFeedingTasks}
          setWeeklyTasks={store.setWeeklyTasks}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          animals={store.animals}
          onSave={setSettings}
          onImportAnimals={store.setAnimals}
          onWipe={store.wipeData}
          onClose={() => setShowSettings(false)}
        />
      )}
    </Layout>
  );
}
