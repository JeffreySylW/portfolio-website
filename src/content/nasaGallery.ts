// Words and pictures for the NASA deep dive. Copy comes from the old mission-log card.

export type GalleryGroup = "surveillance" | "makerspace" | "tours";

export interface GalleryImage {
  src: string;
  alt: string;
  name: string;
  detail: string;
  width: number;
  height: number;
  group: GalleryGroup;
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
  { group: "surveillance", src: "/images/internship/broadcast-control-room.jpg", alt: "Jeff and a fellow intern beside the equipment rack that runs the wind tunnel surveillance system", name: "Surveillance System Rack", detail: "Our goal was to build a system that combined live video with real-time test data.", width: 1179, height: 1578 },
  { group: "surveillance", src: "/images/surveillance/lab-room-cameras.webp", alt: "A camera feed of the lab room, with two interns giving a thumbs up", name: "Lab Room Cameras", detail: "We started by positioning two cameras on the test section for different angles.", width: 1000, height: 615 },
  { group: "surveillance", src: "/images/surveillance/demo.webp", alt: "Two surveillance screens of the lab room with date, time and TAG Screen 3 overlaid as text tags", name: "Surveillance Demo", detail: "Demoing wind tunnel surveillance systems in the lab room.", width: 900, height: 1076 },
  { group: "makerspace", src: "/images/makerspace/room.webp", alt: "Larkworks Makerspace workshop with desks, tool cabinets and the Larkworks sign on the wall", name: "Larkworks Makerspace", detail: "Thanks to Ian, I learned the entire 3D printing workflow.", width: 1000, height: 500 },
  { group: "makerspace", src: "/images/makerspace/drone-lab.webp", alt: "Drones and a robot dog on display in the makerspace, with a poster behind them", name: "Makerspace Demo Area", detail: "Drones and a robot dog on display.", width: 1000, height: 500 },
  { group: "makerspace", src: "/images/makerspace/printers.webp", alt: "Rows of 3D printers on shelves in the makerspace", name: "3D Printers", detail: "Hands-on experience with the printers, from loading different types of filament to troubleshooting prints.", width: 1000, height: 500 },
  { group: "makerspace", src: "/images/makerspace/slicer.webp", alt: "Slicer software on a monitor showing a 3D model on the print bed", name: "Slicer Software", detail: "Getting the STL file ready to print.", width: 1000, height: 720 },
  { group: "makerspace", src: "/images/makerspace/first-print.webp", alt: "A hand holding the finished white 3D-printed Hollow Knight figurine", name: "First Ever 3D Print!", detail: "Got a warning. It's okay though, it was a \"learning experience\".", width: 1000, height: 816 },
  { group: "tours", src: "/images/tours/wind-tunnel-14x22.webp", alt: "Empty test section of the 14x22 subsonic wind tunnel", name: "14 x 22 Subsonic Wind Tunnel", detail: "Saw the massive tunnel used to test everything from aircraft landings to Mars helicopters!", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/the-gantry.webp", alt: "Group of interns in hard hats beneath the Gantry at NASA Langley", name: "The Gantry", detail: "Witnessed a helicopter crash-test in person, and the inside!", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/transonic-dynamics-tunnel.webp", alt: "Large cylindrical Transonic Dynamics Tunnel structure", name: "Transonic Dynamics Tunnel", detail: "Saw how this unique heavy-gas tunnel tests the limits of aircraft structures to prevent them from breaking apart in flight.", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/unitary-plan-wind-tunnel.webp", alt: "Group indoors at the Unitary Plan Wind Tunnel with aircraft models on the wall", name: "Unitary Plan Wind Tunnel", detail: "Learned how its massive 100,000+ horsepower & giant compressors drive system creates supersonic conditions for testing America's most advanced aircraft.", width: 1200, height: 900 },
  { group: "tours", src: "/images/tours/national-transonic-facility.webp", alt: "Group standing inside a large pipe at the National Transonic Facility", name: "National Transonic Facility", detail: "Saw the world's largest cryogenic, high pressure, closed circuit wind tunnel!", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/scramjet.webp", alt: "Group indoors with a SCRAMJET test article on display", name: "SCRAMJET", detail: "Saw and learned about a supersonic combustion ramjet!", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/eight-foot-high-temp-tunnel.webp", alt: "Group atop the sphere of the 8-Foot High Temperature Tunnel", name: "8 Foot High Temperature Tunnel", detail: "Witnessed a hypersonic wind tunnel that creates extreme heat and Mach 7 speeds!", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/flight-simulator.webp", alt: "Group inside the full-dome flight simulator", name: "Flight Simulator", detail: "Simulated landing a plane.", width: 1000, height: 680 },
  { group: "tours", src: "/images/tours/compressor-station.webp", alt: "Group outdoors among the piping at the Compressor Station", name: "Compressor Station", detail: "Witnessed the process of how each facility on center gets their compressed air for tests!", width: 1000, height: 680 },
];

export const inGroup = (group: GalleryGroup): GalleryImage[] => GALLERY.filter((g) => g.group === group);
