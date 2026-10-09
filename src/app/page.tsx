import { Nav } from "@/components/Nav";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Contact } from "@/components/Contact";
import SpaceScene from "@/components/space/SpaceScene";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="bg-paper text-ink">
        <SpaceScene />
        <Projects />
        <Resume />
        <Contact />
      </main>
    </>
  );
}
