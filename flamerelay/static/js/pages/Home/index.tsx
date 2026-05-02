import { useEffect, useState } from 'react';

import { Cta } from './Cta';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { JourneyPreview } from './JourneyPreview';
import { Stats, StatsBanner } from './StatsBanner';
import { GlobePin } from './SpinningGlobe';

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pins, setPins] = useState<GlobePin[]>([]);

  useEffect(() => {
    fetch('/api/stats/')
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/globe-pins/')
      .then((r) => r.json())
      .then((data: { pins: GlobePin[] }) => setPins(data.pins))
      .catch(() => {});
  }, []);

  return (
    <main>
      <Hero />
      <JourneyPreview />
      <StatsBanner stats={stats} pins={pins} />
      <HowItWorks />
      <Cta />
    </main>
  );
}
