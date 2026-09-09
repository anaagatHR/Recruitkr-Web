import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Footer() {
  const topLocations = [
    { name: "Jaipur", slug: "jaipur" },
    { name: "Jodhpur", slug: "jodhpur" },
    { name: "Kota", slug: "kota" },
    { name: "Udaipur", slug: "udaipur" },
    { name: "Ajmer", slug: "ajmer" },
    { name: "Bhilwara", slug: "bhilwara" },
    { name: "Delhi NCR", slug: "delhi" },
  ];

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold tracking-tight">RecruitKr</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering regional talent with direct, verified employment opportunities across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-primary transition">All Live Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-primary transition">Companies</Link></li>
              <li><Link href="/about" className="hover:text-primary transition">About Us</Link></li>
            </ul>
          </div>

          {/* Dedicated Programmatic City Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" /> Top Locations
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {topLocations.map((loc) => (
                <li key={loc.slug}>
                  <Link
                    href={`/jobs/location/${loc.slug}`}
                    className="hover:text-primary transition"
                  >
                    Jobs in {loc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Recruiters */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/post-job" className="hover:text-primary transition">Post a Job</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition">Contact Sales</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RecruitKr. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
