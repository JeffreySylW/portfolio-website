export type BodyKind = "planet" | "station" | "module" | "star";

export interface SpaceBody {
  id: string;
  kind: BodyKind;
  name: string;
  subtitle: string;
  dates?: string;
  summary: string;
  tools: string[];
  parent?: string;
  color: string;
  look: "gas" | "rock" | "station" | "module" | "star";
  orbitRadius: number;
  startAngleDeg: number;
  size: number;
}

export const SUN = {
  name: "Jeffrey Weaver",
  title: "Software Engineer, Richmond, VA",
  intro: [
    "I'm a Computer Science graduate of Virginia Commonwealth University (May 2026), with a concentration in Software Engineering and a minor in Artificial Intelligence.",
    "I like building things end to end: real-time data tools, full-stack applications, and live client work. I write tests first and work directly with the people the software is for.",
  ],
};

export const BODIES: SpaceBody[] = [
  {
    id: "nasa",
    kind: "planet",
    name: "NASA Langley Research Center",
    subtitle: "Software Engineering Intern, Amentum",
    dates: "MAY 2025 – AUG 2025",
    summary:
      "Built a MATLAB-based GUI to replace and extend a LabVIEW tool for real-time UDP data from wind-tunnel test sensors. It connects to the ARTIE server and displays 42 tags event-driven, through a dropdown on each of its 22 value slots.",
    tools: ["MATLAB", "Python", "UDP", "Git"],
    color: "#8fd3ff",
    look: "gas",
    orbitRadius: 6,
    startAngleDeg: 20,
    size: 0.9,
  },
  {
    id: "bob",
    kind: "planet",
    name: "Bob The Tech Guy",
    subtitle: "Freelance Web Developer",
    dates: "AUG 2026 – PRESENT",
    summary:
      "Redesigned the WordPress site for a small-business client relocating his computer-repair business to Chesterfield, VA, built to earn phone calls and compete with other local repair shops.",
    tools: ["HTML", "CSS", "JavaScript", "WordPress", "REST API", "Git"],
    color: "#ffb199",
    look: "rock",
    orbitRadius: 10,
    startAngleDeg: 200,
    size: 0.95,
  },
  {
    id: "education",
    look: "station",
    kind: "station",
    name: "Virginia Commonwealth University",
    subtitle: "B.S. Computer Science, Software Engineering concentration, AI minor",
    dates: "AUG 2022 – MAY 2026",
    summary:
      "Graduated Cum Laude. Dean's List for four semesters. NSBE member.",
    tools: ["Data Structures", "Software Analysis & Testing", "Operating Systems"],
    color: "#c9d6e8",
    orbitRadius: 2.5,
    startAngleDeg: 60,
    size: 0.5,
  },
  {
    id: "aspire",
    look: "module",
    kind: "module",
    name: "DoD ASPIRE Capstone",
    subtitle: "LiDAR & Camera Sensor Data Fusion Researcher, U.S. Army",
    dates: "AUG 2024 – MAY 2025",
    summary:
      "Developed a multi-modal deep learning system for pedestrian detection, reaching 85% accuracy, with a custom preprocessing pipeline for fusing sensor inputs. Ran the project as two-week Agile sprints with daily stand-ups, hitting every milestone on schedule.",
    tools: ["PyTorch", "EfficientNet", "Python", "Agile/Scrum"],
    parent: "education",
    color: "#81c784",
    orbitRadius: 1.1,
    startAngleDeg: 0,
    size: 0.2,
  },
  {
    id: "ta",
    look: "module",
    kind: "module",
    name: "Computer Science Teaching Assistant",
    subtitle: "VCU College of Engineering",
    dates: "AUG 2024 – MAY 2026",
    summary:
      "TA for Introduction to Data Structures (CMSC 256, Java) and Computers and Programming (CMSC 210, Python). Ran office-hours debugging and grading, and mentored 150+ students; lab and test scores rose 20%.",
    tools: ["Java", "Python", "Data Structures", "Mentorship"],
    parent: "education",
    color: "#e57373",
    orbitRadius: 1.1,
    startAngleDeg: 180,
    size: 0.2,
  },
  {
    id: "skills-languages",
    look: "star",
    kind: "star",
    name: "Languages",
    subtitle: "Skills",
    summary: "Java, JavaScript, TypeScript, Python, C/C++, SQL, MATLAB.",
    tools: ["Java", "JavaScript", "TypeScript", "Python", "C/C++", "SQL", "MATLAB"],
    color: "#fff3c4",
    orbitRadius: 14,
    startAngleDeg: 40,
    size: 0.12,
  },
  {
    id: "skills-web",
    look: "star",
    kind: "star",
    name: "Web",
    subtitle: "Skills",
    summary: "React, Next.js, Node.js, Express, HTML/CSS, Tailwind CSS, WordPress, REST APIs.",
    tools: ["React", "Next.js", "Node.js", "Express", "HTML/CSS", "Tailwind CSS", "WordPress", "REST APIs"],
    color: "#cdf0ff",
    orbitRadius: 15,
    startAngleDeg: 130,
    size: 0.12,
  },
  {
    id: "skills-tools",
    look: "star",
    kind: "star",
    name: "Tools and practices",
    subtitle: "Skills",
    summary: "Git/GitHub, Docker, Postman, Selenium, Figma, TDD, Agile/Scrum.",
    tools: ["Git/GitHub", "Docker", "Postman", "Selenium", "Figma", "TDD", "Agile/Scrum"],
    color: "#ffd6e7",
    orbitRadius: 16,
    startAngleDeg: 250,
    size: 0.12,
  },
  {
    id: "sports-analytics",
    look: "star",
    kind: "star",
    name: "Sports Analytics Platform",
    subtitle: "Project, AUG 2024 – DEC 2025",
    summary:
      "Full-stack sports analytics application with live odds comparison and player statistic tracking across multiple sports, built on a real-time data pipeline integrating the Sportradar and Odds APIs.",
    tools: ["Next.js", "React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Redis"],
    color: "#ffffff",
    orbitRadius: 17,
    startAngleDeg: 330,
    size: 0.14,
  },
];

export const TIMELINE: string[] = ["bob", "education", "aspire", "ta", "nasa"];
