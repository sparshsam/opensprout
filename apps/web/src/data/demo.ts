export type CareType = "water" | "fertilize" | "prune" | "repot";

export type Plant = {
  id: string;
  name: string;
  species: string;
  room: string;
  light: string;
  status: "thriving" | "stable" | "watch";
  nextCare: string;
  careType: CareType;
  image: string;
  notes: string;
};

export const plants: Plant[] = [
  {
    id: "monstera",
    name: "Mina",
    species: "Monstera deliciosa",
    room: "Living room",
    light: "Bright indirect",
    status: "thriving",
    nextCare: "Today",
    careType: "water",
    image: "/plant-monstera.svg",
    notes: "New fenestration on the newest leaf. Rotate after watering.",
  },
  {
    id: "pothos",
    name: "Jade Trail",
    species: "Epipremnum aureum",
    room: "Kitchen shelf",
    light: "Medium",
    status: "stable",
    nextCare: "Tomorrow",
    careType: "fertilize",
    image: "/plant-pothos.svg",
    notes: "Trim two long vines and start a propagation jar.",
  },
  {
    id: "calathea",
    name: "Orbit",
    species: "Calathea orbifolia",
    room: "Bedroom",
    light: "Filtered",
    status: "watch",
    nextCare: "Fri",
    careType: "water",
    image: "/plant-calathea.svg",
    notes: "Watch leaf edges. Humidity dipped after the window was open.",
  },
];

export const reminders = [
  { id: "r1", plant: "Mina", task: "Water", time: "9:00 AM", status: "Due" },
  { id: "r2", plant: "Orbit", task: "Inspect leaves", time: "5:30 PM", status: "Today" },
  { id: "r3", plant: "Jade Trail", task: "Fertilize", time: "Tomorrow", status: "Next" },
];

export const journalEntries = [
  { title: "New leaf unfurled", plant: "Mina", date: "May 24", tone: "Growth" },
  { title: "Soil stayed damp longer", plant: "Orbit", date: "May 22", tone: "Watch" },
  { title: "Repotted into terracotta", plant: "Jade Trail", date: "May 18", tone: "Care" },
];
