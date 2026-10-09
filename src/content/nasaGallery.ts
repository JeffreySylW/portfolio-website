// Words and pictures for the NASA deep dive. Copy comes from the old mission-log card.

export interface GalleryImage {
  src: string;
  alt: string;
  name: string;
  detail: string;
  width: number;
  height: number;
}

export interface Section {
  heading: string;
  paragraphs: string[];
}

export const SECTIONS: Section[] = [
  {
    heading: "Overview",
    paragraphs: [
      "I spent summer 2025 as a Software Engineering Intern in the FODS department at NASA Langley Research Center, working with wind-tunnel test data and the software engineers who monitor it.",
    ],
  },
  {
    heading: "My main project",
    paragraphs: [
      "I built a GUI for ARTIE (ASCII real-time data export): a MATLAB-based client to replace or enhance the LabVIEW tool for the real-time UDP data stream.",
      "MATLAB is more powerful (math and analysis toolboxes), easier to maintain long term, more versatile for deployment and integration with other languages, and presents data more dynamically with a more customizable display. LabVIEW is solely a graphical programming environment and does not use code in the traditional sense, which made porting the existing functionality over difficult.",
    ],
  },
  {
    heading: "How it works",
    paragraphs: [
      "Sensors in the wind tunnel capture pressure, temperature and more as analog signals, and the data acquisition system (DAS) converts them to digital.",
      "The Connector packages the data and sends it as a one-way UDP stream across the secure network boundary (a data diode). The ARTIE Server is the central hub, making live data available through UDP Unicast and OPC UA.",
      "My client GUI connects to the ARTIE server and subscribes to the channels, so test engineers can monitor the test in real time.",
    ],
  },
  {
    heading: "Problems and solutions",
    paragraphs: [
      "Problem: the original LabVIEW GUI had only about 10 tag/value slots, reserved for POSIX time, sequence number and tags 1-8, with no room for modularity. The UDP packet has roughly 42 individual tags and values.",
      "Solution: the MATLAB GUI has about 22 tag/value slots. That is not enough for all 42 on its own, but each slot has a dropdown, so the user can select any of the 42 tags and its value field updates dynamically.",
    ],
  },
  {
    heading: "Side quest 1: wind tunnel surveillance system",
    paragraphs: [
      "Goal: a system combining live video with real-time test data in the lab room. Two cameras on the test section, at different angles, feed a hardware multiview (split-screen display).",
      "A dedicated Linux system reads sensor data (pressure, temperature, Mach number; for the demo, date and time) and overlays it on the video as text tags. A Mac Mini is the dedicated recording station, storing a video log per test run in multiple formats.",
      "Remote Desktop streams the main display, so anyone on the lab network can watch the experiment from their workstation.",
    ],
  },
  {
    heading: "Side quest 2: cable labelling",
    paragraphs: [
      "The equipment rack wiring had grown complex, and tracing one cable across the lab was slow, especially for permanent staff.",
      "I labelled Ethernet and power cables at both ends, each end naming what it connects to. That creates a map of the physical network that makes troubleshooting faster and reduces the risk of unplugging something critical.",
    ],
  },
  {
    heading: "Makerspace",
    paragraphs: [
      "My first-ever 3D print gave me a warning, and it was a learning experience.",
      "Thanks to Ian, I learned the entire 3D printing workflow. This included hands-on experience with the printers, from getting the STL file, to loading different types of filament to troubleshooting prints to minimize errors and ensure a successful result.",
    ],
  },
  {
    heading: "What I learned",
    paragraphs: [
      "MATLAB: I picked it up quickly thanks to its OOP similarity to Java and C++, and built a fully functional GUI using .fig files.",
      "Network architecture: I researched the Unicast data diode network, secure data flow and the need for client interfaces.",
      "Real-time data pipelines: I experimented with packet listeners, then connected, unpacked and parsed live UDP packets for seamless GUI updates.",
      "UI/UX understanding. Key skills: GUI development (MATLAB), UDP networking, real-time data parsing, interfacing with secure networks, UI/UX development.",
    ],
  },
  {
    heading: "Takeaway",
    paragraphs: [
      "Software engineering is also part systems engineering. Building effective software is more than writing code; it requires understanding the hardware elements the software works with.",
    ],
  },
];

export const GALLERY: GalleryImage[] = [
  { src: "/images/tours/wind-tunnel-14x22.jpg", alt: "Empty test section of the 14x22 subsonic wind tunnel", name: "14x22 Subsonic Wind Tunnel", detail: "14 x 22 subsonic wind tunnel.", width: 263, height: 181 },
  { src: "/images/tours/the-gantry.jpg", alt: "Group of interns in hard hats beneath the Gantry at NASA Langley", name: "The Gantry", detail: "Witnessed a helicopter crash test in person and saw the inside of the tunnel. Used to test everything from aircraft landings to Mars helicopters.", width: 278, height: 181 },
  { src: "/images/tours/transonic-dynamics-tunnel.jpg", alt: "Large cylindrical Transonic Dynamics Tunnel structure", name: "Transonic Dynamics Tunnel", detail: "Transonic Dynamics Tunnel.", width: 278, height: 181 },
  { src: "/images/tours/unitary-plan-wind-tunnel.jpg", alt: "Group indoors at the Unitary Plan Wind Tunnel with aircraft models on the wall", name: "Unitary Plan Wind Tunnel", detail: "A hypersonic tunnel creating extreme heat and Mach 7 speeds.", width: 277, height: 181 },
  { src: "/images/tours/national-transonic-facility.jpg", alt: "Group standing inside a large pipe at the National Transonic Facility", name: "National Transonic Facility", detail: "A heavy-gas tunnel that tests the limits of aircraft structures to prevent them breaking apart in flight, with 100,000+ horsepower compressors.", width: 236, height: 162 },
  { src: "/images/tours/scramjet.jpg", alt: "Group indoors with a SCRAMJET test article on display", name: "SCRAMJET", detail: "A supersonic combustion ramjet.", width: 249, height: 162 },
  { src: "/images/tours/eight-foot-high-temp-tunnel.jpg", alt: "Group atop the sphere of the 8-Foot High Temperature Tunnel", name: "8-Foot High Temperature Tunnel", detail: "8 Foot High Temperature Tunnel.", width: 249, height: 162 },
  { src: "/images/tours/flight-simulator.jpg", alt: "Group inside the full-dome flight simulator", name: "Flight Simulator", detail: "Simulated landing a plane.", width: 248, height: 162 },
  { src: "/images/tours/compressor-station.jpg", alt: "Group outdoors among the piping at the Compressor Station", name: "Compressor Station", detail: "How each facility gets compressed air for tests.", width: 249, height: 162 },
  { src: "/images/internship/broadcast-control-room.jpg", alt: "Server rack running the wind tunnel surveillance system", name: "Surveillance Rack", detail: "The hardware behind the wind tunnel surveillance system, live.", width: 1179, height: 1578 },
  { src: "/images/internship/wind-tunnel-model-display.jpg", alt: "Group photo of interns at NASA Langley", name: "Legacy Hardware", detail: "Interns at NASA Langley", width: 4032, height: 3024 },
];
