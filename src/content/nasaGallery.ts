// Words and pictures for the NASA deep dive. Copy comes from the old mission-log card.

export interface GalleryImage {
  src: string;
  alt: string;
  name: string;
  detail: string;
  width: number;
  height: number;
}

export const PIPELINE = [
  { label: "SENSORS", detail: "Wind tunnel pressure, temperature, and Mach readings as analog signals." },
  { label: "DAS", detail: "Data Acquisition System digitizes signals into the Current Value Table." },
  { label: "CONNECTOR", detail: "Packages data as a one-way UDP stream across the secure data diode." },
  { label: "ARTIE SERVER", detail: "Central hub distributing live data via UDP Unicast and OPC UA." },
  { label: "CLIENT GUI", detail: "Test engineers monitor live tunnel health in real time.", mine: true },
];

export const FIX = {
  before: {
    label: "BEFORE // LABVIEW",
    value: "10",
    unit: "fixed tag/value slots",
    detail: "Hardcoded for posixtime, sequence, and tags 1\u20138 \u2014 no room for the other 34 tags in the packet.",
  },
  after: {
    label: "BUILT // MATLAB",
    value: "22",
    unit: "dynamic slots, 42 tags",
    detail: "Every slot gets a dropdown across all 42 tags, updating its value field live on selection.",
  },
};

export const SIDE_QUEST = [
  "Built a system combining live video with real-time test data. Two cameras on the test section fed a hardware Multiview, combining both angles into a single split-screen display.",
  "A dedicated Linux system read sensor data \u2014 pressure, temperature, Mach number \u2014 and overlaid it as text tags directly onto the video feed. The combined stream went to a Mac Mini, recording a video log for every test run.",
  "Remote Desktop streamed the main display, letting anyone on the lab network monitor the experiment live from their own workstation.",
];

export const QUOTE =
  "Software engineering is also systems engineering \u2014 building effective software takes a real understanding of the hardware it runs on, not just the code.";

export const GALLERY: GalleryImage[] = [
  { src: "/images/tours/wind-tunnel-14x22.jpg", alt: "Empty test section of the 14x22 subsonic wind tunnel", name: "14x22 Subsonic Wind Tunnel", detail: "The massive tunnel used to test everything from aircraft landings to Mars helicopters.", width: 263, height: 181 },
  { src: "/images/tours/the-gantry.jpg", alt: "Group of interns in hard hats beneath the Gantry at NASA Langley", name: "The Gantry", detail: "Witnessed a helicopter crash-test in person, and toured the inside.", width: 278, height: 181 },
  { src: "/images/tours/transonic-dynamics-tunnel.jpg", alt: "Large cylindrical Transonic Dynamics Tunnel structure", name: "Transonic Dynamics Tunnel", detail: "A unique heavy-gas tunnel that tests the limits of aircraft structures to keep them from breaking apart in flight.", width: 278, height: 181 },
  { src: "/images/tours/unitary-plan-wind-tunnel.jpg", alt: "Group indoors at the Unitary Plan Wind Tunnel with aircraft models on the wall", name: "Unitary Plan Wind Tunnel", detail: "100,000+ horsepower and giant compressors drive the supersonic conditions used to test America's most advanced aircraft.", width: 277, height: 181 },
  { src: "/images/tours/national-transonic-facility.jpg", alt: "Group standing inside a large pipe at the National Transonic Facility", name: "National Transonic Facility", detail: "The world's largest cryogenic, high-pressure, closed-circuit wind tunnel.", width: 236, height: 162 },
  { src: "/images/tours/scramjet.jpg", alt: "Group indoors with a SCRAMJET test article on display", name: "SCRAMJET", detail: "Saw and learned about a supersonic combustion ramjet test article.", width: 249, height: 162 },
  { src: "/images/tours/eight-foot-high-temp-tunnel.jpg", alt: "Group atop the sphere of the 8-Foot High Temperature Tunnel", name: "8-Foot High Temperature Tunnel", detail: "A hypersonic wind tunnel that creates extreme heat and Mach 7 speeds.", width: 249, height: 162 },
  { src: "/images/tours/flight-simulator.jpg", alt: "Group inside the full-dome flight simulator", name: "Flight Simulator", detail: "Simulated landing a plane inside the full-dome visual simulator.", width: 248, height: 162 },
  { src: "/images/tours/compressor-station.jpg", alt: "Group outdoors among the piping at the Compressor Station", name: "Compressor Station", detail: "How each facility on center gets its compressed air for testing.", width: 249, height: 162 },
  { src: "/images/internship/broadcast-control-room.jpg", alt: "Server rack running the wind tunnel surveillance system", name: "Surveillance Rack", detail: "The hardware behind the wind tunnel surveillance system, live.", width: 1179, height: 1578 },
  { src: "/images/internship/wind-tunnel-model-display.jpg", alt: "Archival scale model of an early Langley wind tunnel on display", name: "Legacy Hardware", detail: "Archival scale model of an early Langley tunnel.", width: 4032, height: 3024 },
];
