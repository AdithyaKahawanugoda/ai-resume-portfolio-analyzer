export const JOB_ROLES = [
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Mobile Developer",
  "Cloud Architect",
  "Security Engineer",
  "Product Manager",
] as const;

export type JobRole = (typeof JOB_ROLES)[number];
