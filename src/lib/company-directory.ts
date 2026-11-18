export type CompanyCategory = "Global technology" | "India technology" | "Enterprise software";

export type CompanyRecord = {
  name: string;
  category: CompanyCategory;
  careersUrl: string;
  focus: string;
  prepAreas: string[];
  officialInterviewUrl?: string;
  officialInterviewLabel?: string;
};

export const companyDirectory: CompanyRecord[] = [
  { name: "Google", category: "Global technology", careersUrl: "https://careers.google.com/", focus: "Search, cloud, AI and product engineering", prepAreas: ["Data structures and algorithms", "Problem solving and communication", "Role-specific technical depth"], officialInterviewUrl: "https://blog.google/company-news/inside-google/life-at-google/google-engineer-shares-her-technical-interview-tips/", officialInterviewLabel: "Google engineer interview tips (published March 2022; historical guidance)" },
  { name: "Microsoft", category: "Global technology", careersUrl: "https://careers.microsoft.com/", focus: "Cloud, developer tools, productivity and AI", prepAreas: ["Technical fundamentals and problem solving", "Role-related examples and work samples", "Collaboration and growth mindset"], officialInterviewUrl: "https://careers.microsoft.com/v2/global/en/hiring-tips", officialInterviewLabel: "Microsoft official hiring and interview guidance" },
  { name: "Amazon", category: "Global technology", careersUrl: "https://www.amazon.jobs/", focus: "Commerce, cloud and large-scale services", prepAreas: ["Data structures and coding", "System design for relevant roles", "Behavioural examples with clear evidence"], officialInterviewUrl: "https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics", officialInterviewLabel: "Amazon official software development interview topics" },
  { name: "Meta", category: "Global technology", careersUrl: "https://www.metacareers.com/", focus: "Social platforms, infrastructure and AI", prepAreas: ["Coding and problem solving", "Product and systems thinking", "Communication and collaboration"] },
  { name: "Apple", category: "Global technology", careersUrl: "https://jobs.apple.com/", focus: "Hardware, software and services", prepAreas: ["Role-specific engineering fundamentals", "Debugging and practical problem solving", "Product quality and collaboration"] },
  { name: "Netflix", category: "Global technology", careersUrl: "https://jobs.netflix.com/", focus: "Streaming, media technology and platform engineering", prepAreas: ["Role-specific technical depth", "System design and reliability", "Clear ownership and decision-making examples"] },
  { name: "NVIDIA", category: "Global technology", careersUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/", focus: "Accelerated computing, graphics and AI", prepAreas: ["Programming and computer science fundamentals", "Specialist depth for the target team", "Performance and systems reasoning"] },
  { name: "Adobe", category: "Global technology", careersUrl: "https://careers.adobe.com/", focus: "Creative, document and digital experience software", prepAreas: ["Coding and software engineering fundamentals", "Product and customer problem solving", "Role-specific technical depth"] },
  { name: "Salesforce", category: "Enterprise software", careersUrl: "https://careers.salesforce.com/", focus: "CRM, enterprise cloud and platform products", prepAreas: ["Programming and API fundamentals", "Data modelling and system design", "Customer and team communication"] },
  { name: "Oracle", category: "Enterprise software", careersUrl: "https://careers.oracle.com/", focus: "Databases, cloud infrastructure and enterprise software", prepAreas: ["Database and SQL fundamentals", "Backend and distributed systems", "Role-specific coding practice"] },
  { name: "IBM", category: "Enterprise software", careersUrl: "https://www.ibm.com/careers", focus: "Enterprise technology, consulting and hybrid cloud", prepAreas: ["Core computer science", "Practical problem solving", "Communication and role-related scenarios"] },
  { name: "Cisco", category: "Enterprise software", careersUrl: "https://jobs.cisco.com/", focus: "Networking, security and infrastructure", prepAreas: ["Networking and operating systems", "Programming and troubleshooting", "Security and system fundamentals"] },
  { name: "Atlassian", category: "Global technology", careersUrl: "https://www.atlassian.com/company/careers", focus: "Developer collaboration and team productivity", prepAreas: ["Coding and problem solving", "Collaboration and product thinking", "System design for relevant roles"] },
  { name: "Uber", category: "Global technology", careersUrl: "https://www.uber.com/us/en/careers/", focus: "Mobility, logistics and marketplace systems", prepAreas: ["Algorithms and data structures", "Distributed systems and APIs", "Product and operational trade-offs"] },
  { name: "Tata Consultancy Services", category: "India technology", careersUrl: "https://www.tcs.com/careers", focus: "IT services, consulting and enterprise delivery", prepAreas: ["Programming fundamentals", "SQL and core CS", "Communication and project explanations"] },
  { name: "Infosys", category: "India technology", careersUrl: "https://www.infosys.com/careers/", focus: "IT services, consulting and digital engineering", prepAreas: ["Programming and aptitude fundamentals", "SQL and core CS", "Communication and project explanations"] },
  { name: "Wipro", category: "India technology", careersUrl: "https://careers.wipro.com/", focus: "Technology services and consulting", prepAreas: ["Programming fundamentals", "Problem solving and SQL", "Communication and project explanations"] },
  { name: "Zoho", category: "India technology", careersUrl: "https://www.zoho.com/careers/", focus: "Business software and cloud applications", prepAreas: ["Programming and data structures", "Practical coding and debugging", "Product thinking and communication"] },
  { name: "Accenture", category: "India technology", careersUrl: "https://www.accenture.com/us-en/careers", focus: "Technology consulting and digital transformation", prepAreas: ["Programming and technical fundamentals", "Problem solving and role scenarios", "Communication and collaboration"] },
];

export const companyRoles = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Data Engineer",
  "Data Scientist",
  "DevOps / Platform Engineer",
  "Mobile Engineer",
  "QA / Test Engineer",
  "Security Engineer",
  "Product Manager",
];
