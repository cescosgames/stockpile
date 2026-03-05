import { useState } from "react";
import { useStore } from "./hooks/useStore";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import AnimalList from "./components/AnimalList";
import FeedList from "./components/FeedList";
import Checklist from "./components/Checklist";
import type { Tab } from "./types";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const store = useStore();

  return (
    <Layout active={tab} onTabChange={setTab}>
      {tab === "dashboard" && (
        <Dashboard
          animals={store.animals}
          feedItems={store.feedItems}
          feedingTasks={store.feedingTasks}
          checkedState={store.checkedState}
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
          setChecked={store.setChecked}
          setFeedingTasks={store.setFeedingTasks}
        />
      )}
    </Layout>
  );
}
