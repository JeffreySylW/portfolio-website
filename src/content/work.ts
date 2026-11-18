// All copy for the 2D site: hero, work ledger, skills and the places pinned on the globe.
// Facts come from the resume and the previous space.ts; titles and dates follow the vault Rules.

export type PlaceId = "richmond" | "hampton";

export interface Place {
  label: string;
  lat: number;
  lon: number;
}

export const PLACES: Record<PlaceId, Place> = {
  richmond: { label: "Richmond, VA", lat: 37.5407, lon: -77.436 },
  hampton: { label: "Hampton, VA", lat: 37.0871, lon: -76.3803 },
};

export const PROFILE = {
  name: "Jeffrey Weaver",
  role: "Software engineer",
  location: "Richmond, VA",
  intro:
    "Computer Science, VCU 2026. I build things end to end: real-time data tools, full-stack apps, and live client work.",
  about: [
    "I'm a Computer Science graduate of Virginia Commonwealth University (May 2026), with a concentration in Software Engineering and a minor in Artificial Intelligence.",
    "I like building things end to end: real-time data tools, full-stack applications, and live client work. I write tests first and work directly with the people the software is for.",
  ],
  resumeHref: "/documents/Jeffrey-Weaver-Resume.pdf",
};

export interface Highlight {
  name: string;
  role: string;
  dates: string;
  /** YYYY-MM, matching `dates` (the system map places planets by these). */
  start: string;
  /** YYYY-MM; omitted while ongoing. */
  end?: string;
  summary: string;
}

export interface WorkEntry {
  id: string;
  kind: "job" | "education" | "project";
  org: string;
  role: string;
  dates: string;
  /** YYYY-MM, used to keep jobs newest first and to place the planet on the system map. */
  start: string;
  /** YYYY-MM; omitted while ongoing ("present"). */
  end?: string;
  summary: string;
  tools: string[];
  place?: PlaceId;
  photo?: { src: string; alt: string };
  /** Opens a deep view (the NASA card or the Bob case file). */
  deep?: "nasa" | "bob";
  link?: { href: string; label: string };
  highlights?: Highlight[];
}

export const WORK: WorkEntry[] = [
  {
    id: "bob",
    kind: "job",
    org: "Bob The Tech Guy",
    role: "Freelance Software Engineer",
    dates: "Aug 2026 – present",
    start: "2026-08",
    summary:
      "Engineered the software behind a real small-business site: a versioned JavaScript/CSS bundle on a live WordPress host, release safeguards, automated tests and a serverless AI chatbot.",
    tools: ["JavaScript", "CSS", "Cloudflare Workers", "Anthropic API", "WordPress", "REST API", "Git"],
    place: "richmond",
    photo: { src: "/images/bob/after-home-hero.webp", alt: "Bob The Tech Guy home page after the rebuild" },
    deep: "bob",
  },
  {
    id: "nasa",
    kind: "job",
    org: "NASA Langley Research Center",
    role: "Software Engineering Intern, Amentum",
    dates: "May 2025 – Aug 2025",
    start: "2025-05",
    end: "2025-08",
    summary:
      "Built a MATLAB-based GUI to replace and extend a LabVIEW tool for real-time UDP data from wind-tunnel test sensors. It connects to the ARTIE server and displays 42 tags event-driven, through a dropdown on each of its 22 value slots.",
    tools: ["MATLAB", "Python", "UDP", "Git"],
    place: "hampton",
    photo: { src: "/images/tours/national-transonic-facility.webp", alt: "The National Transonic Facility wind tunnel at NASA Langley" },
    deep: "nasa",
  },
  {
    id: "vcu",
    kind: "education",
    org: "Virginia Commonwealth University",
    role: "B.S. Computer Science, Software Engineering concentration, AI minor",
    dates: "Aug 2022 – May 2026",
    start: "2022-08",
    end: "2026-05",
    summary: "Graduated Cum Laude. Dean's List for four semesters. NSBE member.",
    tools: ["Data Structures", "Software Analysis & Testing", "Operating Systems"],
    place: "richmond",
    highlights: [
      {
        name: "Computer Science Teaching Assistant",
        role: "VCU College of Engineering",
        dates: "Aug 2024 – May 2026",
        start: "2024-08",
        end: "2026-05",
        summary:
          "TA for Introduction to Data Structures (CMSC 256, Java) and Computers and Programming (CMSC 210, Python). Ran office-hours debugging and grading, and mentored 150+ students; lab and test scores rose 20%.",
      },
      {
        name: "DoD ASPIRE Capstone",
        role: "LiDAR & Camera Sensor Data Fusion Researcher, U.S. Army",
        dates: "Aug 2024 – May 2025",
        start: "2024-08",
        end: "2025-05",
        summary:
          "Developed a multi-modal deep learning system for pedestrian detection, reaching 85% accuracy, with a custom preprocessing pipeline for fusing sensor inputs. Ran the project as two-week Agile sprints with daily stand-ups, hitting every milestone on schedule.",
      },
    ],
  },
  {
    id: "sports-analytics",
    kind: "project",
    org: "Sports Analytics Platform",
    role: "Personal project",
    dates: "Aug 2024 – Dec 2025",
    start: "2024-08",
    end: "2025-12",
    summary:
      "Full-stack sports analytics application with live odds comparison and player statistic tracking across multiple sports, built on a real-time data pipeline integrating the Sportradar and Odds APIs.",
    tools: ["Next.js", "React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Redis"],
    link: { href: "https://github.com/JeffreySylW/SportsAnalsytApp", label: "View the repository" },
  },
];

export const SKILLS: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["Java", "JavaScript", "TypeScript", "Python", "C", "SQL", "MATLAB"] },
  { label: "Web", items: ["React", "Next.js", "Node.js", "Express", "HTML/CSS", "Tailwind CSS", "WordPress", "REST APIs"] },
  { label: "Tools and practices", items: ["Git/GitHub", "Docker", "Postman", "Selenium", "Figma", "TDD", "Agile/Scrum"] },
];

export const CONTACT = [
  { label: "GitHub", value: "github.com/JeffreySylW", href: "https://github.com/JeffreySylW" },
  { label: "LinkedIn", value: "linkedin.com/in/jeffsylweaver", href: "https://linkedin.com/in/jeffsylweaver" },
  { label: "Email", value: "jeff.sylw@gmail.com", href: "mailto:jeff.sylw@gmail.com" },
  { label: "Phone", value: "(804) 895-8445", href: "tel:+18048958445" },
];
