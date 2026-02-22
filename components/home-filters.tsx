"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function HomeFilters() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [city, setCity] = useState(params.get("city") ?? "");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [languages, setLanguages] = useState(params.get("languages") ?? "");
  const [services, setServices] = useState(params.get("services") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams();
      if (city) next.set("city", city);
      if (min) next.set("min", min);
      if (max) next.set("max", max);
      if (languages) next.set("languages", languages);
      if (services) next.set("services", services);
      if (sort && sort !== "newest") next.set("sort", sort);
      router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [city, min, max, languages, services, sort, pathname, router]);

  return (
    <div className="mb-6 grid gap-3 rounded-xl border border-line bg-slate/70 p-4 md:grid-cols-6">
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="bw-input md:col-span-2" />
      <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="bw-input" />
      <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="bw-input" />
      <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Languages" className="bw-input" />
      <input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Services" className="bw-input" />
      <select value={sort} onChange={(e) => setSort(e.target.value)} className="bw-input md:col-span-2">
        <option value="newest">Newest</option>
        <option value="lowest">Lowest price</option>
        <option value="highest">Highest price</option>
        <option value="verified">Recently verified</option>
      </select>
    </div>
  );
}
