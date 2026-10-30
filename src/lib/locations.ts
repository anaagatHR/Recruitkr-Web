/**
 * The portal currently lists jobs mostly in Jaipur; the backend stores a
 * neighborhood (e.g. "Mansarovar") in `location`, not a city name. So we treat
 * Jaipur as the home city: its landing page lists every job, and JobPosting
 * structured data resolves to Jaipur, Rajasthan. Add a real `city` field later
 * to generalize beyond this.
 */
export const HOME_CITY = "Jaipur";
export const HOME_REGION = "Rajasthan";

export type City = {
  slug: string;
  name: string;
  /** H1 / title phrase; defaults to "Jobs in <name>". */
  heading?: string;
  region: string;
  /** Lower-case substrings matched against a job's `location`. */
  match: string[];
  /** Genuine per-city copy. Swapping only the city name reads as a doorway page. */
  intro: string[];
  sectors: string[];
  nearby: string[];
};

/**
 * Cities with a "/jobs-in-<slug>" landing page. That URL is the canonical
 * pattern (it matches real search demand); /jobs/location/<slug> 301s to it.
 * A slug not listed here 404s.
 */
export const CITIES: City[] = [
  {
    slug: "jaipur",
    name: "Jaipur",
    region: "Rajasthan",
    match: ["jaipur"],
    intro: [
      "Jaipur is RecruitKr's home market and where most of our live openings are. Rajasthan's capital has grown well beyond tourism: IT and ITES companies run from Mahindra World City and Sitapura, the gems, jewellery and handicraft export trade employs thousands, and new retail, healthcare and education businesses open across Mansarovar, Malviya Nagar, Vaishali Nagar and Jagatpura every year.",
      "Employers here hire freshers and experienced staff alike, from telecallers, sales executives and accountants to software developers, hotel staff and store managers. Our Jaipur recruitment team meets most candidates in person, which is why so many local employers use RecruitKr for their regular hiring.",
    ],
    sectors: ["IT and ITES", "Gems and jewellery", "Hospitality and tourism", "Retail", "Education", "Healthcare"],
    nearby: ["ajmer", "kota", "udaipur", "jodhpur", "delhi"],
  },
  {
    slug: "jodhpur",
    name: "Jodhpur",
    region: "Rajasthan",
    match: ["jodhpur"],
    intro: [
      "Jodhpur's economy is built on its export trade. Handicraft and wooden furniture exporters in the Boranada and Basni industrial areas ship to buyers worldwide, and the city is one of India's main centres for guar gum processing. Heritage hotels and tourism add steady demand for hospitality staff.",
      "Institutions such as IIT Jodhpur and AIIMS Jodhpur have also brought education and healthcare jobs. Typical openings include production supervisors, export documentation and merchandising staff, accountants, front-office executives and sales roles.",
    ],
    sectors: ["Handicraft and furniture exports", "Guar gum and agro-processing", "Hospitality", "Textiles", "Healthcare", "Education"],
    nearby: ["jaipur", "udaipur", "ajmer", "bhilwara"],
  },
  {
    slug: "kota",
    name: "Kota",
    region: "Rajasthan",
    match: ["kota"],
    intro: [
      "Kota is best known as India's coaching capital, and education drives a large part of its job market: faculty and academic coordinators, counsellors, front-desk and admissions staff, hostel and mess management, and the many service businesses that support a large student population.",
      "Kota is also an industrial city, with thermal and hydro power generation, chemical and fertiliser plants, and the Kota stone and Kota Doria textile trades. That creates steady demand for plant technicians, ITI and diploma holders, supervisors and administrative staff.",
    ],
    sectors: ["Education and coaching", "Power generation", "Chemicals and fertilisers", "Kota stone", "Hostels and student services"],
    nearby: ["jaipur", "bhilwara", "ajmer", "udaipur"],
  },
  {
    slug: "udaipur",
    name: "Udaipur",
    region: "Rajasthan",
    match: ["udaipur"],
    intro: [
      "Udaipur, the City of Lakes, has one of the strongest hospitality job markets in India for its size. Luxury resorts, palace hotels, restaurants and travel companies hire chefs, front-office executives, guest-relations staff and housekeeping teams throughout the year, with extra demand during the tourist and wedding seasons.",
      "Beyond tourism, Udaipur is a centre for mining and minerals, including zinc and marble, and for marble processing. A growing number of IT, BPO and education businesses also hire freshers and graduates locally.",
    ],
    sectors: ["Luxury hospitality", "Travel and tourism", "Mining and minerals", "Marble processing", "Education"],
    nearby: ["jaipur", "jodhpur", "ajmer", "bhilwara"],
  },
  {
    slug: "ajmer",
    name: "Ajmer",
    region: "Rajasthan",
    match: ["ajmer", "kishangarh"],
    intro: [
      "Ajmer combines education, pilgrimage tourism and industry. Its well-known schools and colleges employ teachers and administrative staff, and visitors to the Dargah Sharif and nearby Pushkar support hotels, travel and retail businesses.",
      "Nearby Kishangarh hosts one of Asia's largest marble and granite markets, which hires sales, logistics, accounts and site staff. Railway workshops, retail chains and healthcare providers add further openings for skilled and semi-skilled candidates.",
    ],
    sectors: ["Education", "Marble and granite (Kishangarh)", "Pilgrimage tourism", "Retail", "Healthcare"],
    nearby: ["jaipur", "bhilwara", "kota", "jodhpur"],
  },
  {
    slug: "bhilwara",
    name: "Bhilwara",
    region: "Rajasthan",
    match: ["bhilwara"],
    intro: [
      "Bhilwara is often called the Textile City of India. Spinning mills, weaving units and processing houses make it one of the country's largest producers of synthetic yarn and suiting fabric, and the industry hires continuously for machine operators, shift supervisors, quality inspectors, maintenance technicians and merchandisers.",
      "Mining and the businesses that serve the textile cluster, such as transport, packaging and accounting, add more openings. Many roles suit ITI and diploma holders and experienced shop-floor staff.",
    ],
    sectors: ["Textiles and spinning", "Weaving and processing", "Mining", "Logistics", "Accounts and back office"],
    nearby: ["jaipur", "ajmer", "kota", "udaipur"],
  },
  {
    slug: "delhi",
    name: "Delhi NCR",
    region: "Delhi",
    match: ["delhi", "new delhi"],
    intro: [
      "Delhi NCR is India's largest services job market. Corporate offices, retail chains, hospitals, hotels, logistics hubs and thousands of small businesses hire for sales, customer support, accounts, administration and operations roles every week.",
      "Candidates in Delhi often compare offers from several companies at once, so employers who move quickly win. RecruitKr helps businesses in Delhi shortlist screened candidates fast, and helps candidates from Rajasthan and nearby states find roles in the capital.",
    ],
    sectors: ["Corporate services", "Retail", "Healthcare", "Hospitality", "Logistics", "Startups"],
    nearby: ["gurugram", "noida", "jaipur"],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    region: "Maharashtra",
    match: ["mumbai", "navi mumbai", "thane"],
    intro: [
      "Mumbai is India's financial capital. Banks, insurers, broking and wealth-management firms make BFSI the city's biggest white-collar employer, with constant demand for relationship managers, operations executives, sales officers and accountants.",
      "Media and entertainment, ports and logistics, pharmaceuticals and organised retail add a wide range of other roles. Salaries are among the highest in India, and employers look for candidates who can commit to the city's commute and pace.",
    ],
    sectors: ["Banking and financial services", "Insurance", "Media and entertainment", "Ports and logistics", "Pharmaceuticals"],
    nearby: ["pune", "delhi", "bengaluru"],
  },
  {
    slug: "pune",
    name: "Pune",
    region: "Maharashtra",
    match: ["pune", "pimpri", "chinchwad", "chakan"],
    intro: [
      "Pune pairs a large automotive and engineering manufacturing base in Chakan, Pimpri-Chinchwad and Ranjangaon with major IT parks in Hinjewadi and Kharadi. Manufacturers hire graduate engineer trainees, diploma holders, quality and production staff, while IT and shared-services companies hire developers, testers and support staff.",
      "With many universities and colleges, Pune is also one of India's biggest fresher job markets, especially for engineering and management graduates.",
    ],
    sectors: ["Automotive manufacturing", "Engineering", "IT services", "Shared services", "Education"],
    nearby: ["mumbai", "hyderabad", "bengaluru"],
  },
  {
    slug: "noida",
    name: "Noida",
    region: "Uttar Pradesh",
    match: ["noida"],
    intro: [
      "Noida and Greater Noida host a large cluster of IT and ITES companies, BPOs and data centres, alongside India's biggest concentration of mobile phone and electronics manufacturing. That mix means steady hiring for customer support executives, technical support, software roles and assembly-line operators.",
      "Media houses, education institutions and a fast-growing residential population also create jobs in sales, retail and administration.",
    ],
    sectors: ["IT and ITES", "BPO and customer support", "Electronics manufacturing", "Media", "Education"],
    nearby: ["delhi", "gurugram", "jaipur"],
  },
  {
    slug: "gurugram",
    name: "Gurugram",
    region: "Haryana",
    match: ["gurugram", "gurgaon", "manesar"],
    intro: [
      "Gurugram is home to the India headquarters of hundreds of multinational companies, along with consulting firms, BPO and KPO operations, and startups. Corporate roles in HR, finance, sales and operations are in high demand.",
      "The Manesar belt adds one of India's largest automobile and auto-components manufacturing clusters, which hires engineers, technicians and supervisors. Real estate, hospitality and premium retail complete the market.",
    ],
    sectors: ["Corporate headquarters", "BPO and KPO", "Automobile manufacturing", "Consulting", "Real estate"],
    nearby: ["delhi", "noida", "jaipur"],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    region: "Telangana",
    match: ["hyderabad", "secunderabad"],
    intro: [
      "Hyderabad's HITEC City and Gachibowli corridor is one of India's largest technology hubs, with IT services companies and global capability centres hiring developers, analysts and support teams at scale.",
      "The city is also India's pharmaceutical and life-sciences capital, centred on Genome Valley, and a major base for banking and financial operations. Pharma production, quality control and sales roles are a large share of local openings.",
    ],
    sectors: ["IT and global capability centres", "Pharmaceuticals", "Life sciences", "Financial operations"],
    nearby: ["bengaluru", "pune", "mumbai"],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    region: "West Bengal",
    match: ["kolkata", "howrah"],
    intro: [
      "Kolkata is the commercial centre of eastern India. FMCG and consumer-goods companies run their regional distribution from here, and banking, insurance and IT companies in Salt Lake Sector V hire for operations, sales and support roles.",
      "Traditional industries such as jute, engineering and port-based logistics still employ large numbers of supervisors, accountants and operations staff, giving the city a broad mix of opportunities.",
    ],
    sectors: ["FMCG distribution", "Banking and insurance", "IT services", "Engineering", "Port logistics"],
    nearby: ["delhi", "hyderabad", "mumbai"],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    region: "Karnataka",
    match: ["bengaluru", "bangalore"],
    intro: [
      "Bengaluru is India's technology capital. Product startups, IT services firms and global capability centres hire software engineers, data and product professionals, and the sales, support and operations teams that grow with them.",
      "Aerospace, biotechnology and electronics design add specialist roles, and the city's startup ecosystem means many jobs offer fast growth for candidates willing to take on wide responsibilities early.",
    ],
    sectors: ["Software and product startups", "Global capability centres", "Aerospace", "Biotechnology", "Electronics design"],
    nearby: ["hyderabad", "pune", "mumbai"],
  },
  {
    slug: "remote",
    name: "Remote",
    heading: "Remote and Work From Home Jobs",
    region: "India",
    match: ["remote", "work from home", "wfh"],
    intro: [
      "Remote jobs let you work for employers anywhere in India without relocating. The most common remote roles are customer support and telecalling, content writing, digital marketing, software development, data entry and inside sales.",
      "Genuine remote employers never ask for a registration fee, security deposit or payment for a laptop or training kit. Every remote opening on RecruitKr comes from an employer we work with, and applying is always free.",
    ],
    sectors: ["Customer support", "Software development", "Digital marketing", "Content writing", "Inside sales"],
    nearby: ["bengaluru", "hyderabad", "jaipur"],
  },
];

/**
 * A city page is indexed (and listed in sitemap.xml) only with at least this
 * many open roles; below it the page is mostly shared boilerplate.
 */
export const MIN_INDEXABLE_CITY_ROLES = 3;

export const getCity = (slug: string) => CITIES.find((city) => city.slug === slug.toLowerCase());

export const cityHeading = (city: City) => city.heading ?? `Jobs in ${city.name}`;

export const cityPath = (slug: string) => `/jobs-in-${slug}`;

/**
 * Jobs for a city landing page. The home city (Jaipur) returns every on-site
 * job, since `location` holds a neighborhood rather than the city name. Other
 * cities match by substring; "remote" also matches the work mode.
 */
export const matchCity = <T extends { location: string; workMode?: string }>(jobs: T[], city: City): T[] => {
  if (city.slug === "remote") {
    return jobs.filter((job) => job.workMode === "Remote" || city.match.some((m) => job.location.toLowerCase().includes(m)));
  }
  if (city.name === HOME_CITY) return jobs.filter((job) => job.workMode !== "Remote");
  return jobs.filter((job) => city.match.some((m) => job.location.toLowerCase().includes(m)));
};
