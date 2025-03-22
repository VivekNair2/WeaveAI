import { Background } from '../components/Background';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { UseCases } from '../components/UseCases';
import { CallToAction } from '../components/CallToAction';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white bg-opacity-80">
      <Background />
      <Hero />
      <Features />
      <UseCases />
      <CallToAction />
    </div>
  );
}