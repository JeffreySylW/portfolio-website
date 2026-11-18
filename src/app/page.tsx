import { Hero } from "@/components/site/Hero";
import { WorkLedger, Skills } from "@/components/site/WorkLedger";
import { ResumeSection, ContactSection } from "@/components/site/ResumeContact";
import { DeepViews } from "@/components/site/DeepViews";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <WorkLedger />
        <Skills />
        <ResumeSection />
        <ContactSection />
      </main>
      <DeepViews />
    </>
  );
}
