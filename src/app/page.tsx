import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { Education } from "@/components/Education";
import { Skills } from "@/components/Skills";
import { Resume } from "@/components/Resume";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="@container overflow-x-clip">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Education />
        <Skills />
        <Resume />
        <Contact />
      </main>
    </>
  );
}
