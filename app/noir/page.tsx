"use client";

import { useMemo, useState } from "react";

type NoirState = "landing" | "setup" | "matching" | "room" | "ended";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

function CountryChip({ onClick, selectedCountry }: { onClick: () => void; selectedCountry: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition hover:border-[#FF2E63]/40 hover:bg-white/[0.08]"
    >
      {selectedCountry}
    </button>
  );
}

function CountrySheet({
  open,
  selectedCountry,
  onClose,
  onSelect
}: {
  open: boolean;
  selectedCountry: string;
  onClose: () => void;
  onSelect: (country: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => country.toLowerCase().includes(query));
  }, [search]);

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close country sheet"
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-black/95 p-5 backdrop-blur transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/20" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search country"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
        <div className="mt-4 max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {filteredCountries.map((country) => {
            const isSelected = country === selectedCountry;
            return (
              <button
                key={country}
                type="button"
                onClick={() => {
                  onSelect(country);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/[0.05]"
              >
                <span>{country}</span>
                <span className={`text-xs ${isSelected ? "text-[#FF2E63]" : "text-white/35"}`}>{isSelected ? "Selected" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ControlButton({
  label,
  accent,
  pending,
  onClick
}: {
  label: string;
  accent?: boolean;
  pending?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 w-14 rounded-full border bg-white/[0.05] text-[10px] transition-all hover:border-[#FF2E63]/50 hover:shadow-[0_0_20px_rgba(255,46,99,0.25)] ${accent ? "border-[#FF2E63]/40 text-[#FF2E63]" : pending ? "border-white/20 text-white/70" : "border-white/10 text-white"}`}
    >
      {label}
    </button>
  );
}

export default function NoirPage() {
  const [state, setState] = useState<NoirState>("landing");
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [friendPending, setFriendPending] = useState(false);

  return (
    <main className="relative min-h-screen bg-black text-white">
      {(state === "landing" || state === "room") && (
        <div className="absolute left-4 top-4 z-20">
          <CountryChip selectedCountry={selectedCountry} onClick={() => setIsCountrySheetOpen(true)} />
        </div>
      )}

      {state === "landing" && (
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">NOIR</p>
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">Enter the unknown.</h1>
          <p className="mt-4 text-base text-white/50">Random encounters. Minimal. Private.</p>
          <button
            type="button"
            onClick={() => setState("setup")}
            className="mt-10 rounded-full border border-[#FF2E63]/40 bg-[#FF2E63]/10 px-8 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(255,46,99,0.25)] transition-all duration-300 hover:bg-[#FF2E63]/20"
          >
            Start Encounter
          </button>
        </section>
      )}

      {state === "setup" && (
        <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10">
          <div className="relative h-[46vh] overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_0_40px_rgba(255,46,99,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,46,99,0.18),rgba(0,0,0,0)_62%)]" />
            <div className="relative flex h-full items-center justify-center text-sm text-white/45">Camera Preview Placeholder</div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] px-5">
            <div className="flex items-center justify-between border-b border-white/5 py-4 text-sm text-white">
              <span>Camera</span>
              <span className="text-white/60">Ready</span>
            </div>
            <div className="flex items-center justify-between py-4 text-sm text-white">
              <span>Microphone</span>
              <span className="text-white/60">Ready</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setState("matching")}
            className="mt-8 self-center rounded-full border border-[#FF2E63]/40 bg-[#FF2E63]/10 px-8 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(255,46,99,0.25)] transition-all duration-300 hover:bg-[#FF2E63]/20"
          >
            Continue
          </button>
        </section>
      )}

      {state === "matching" && (
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#FF2E63]/40 border-t-[#FF2E63]" />
          <p className="mt-6 text-lg text-white">Searching...</p>
          <p className="mt-2 text-sm text-white/50">Finding someone in {selectedCountry}</p>
          <button
            type="button"
            onClick={() => setState("setup")}
            className="mt-8 text-sm text-white/60 transition hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setState("room")}
            className="mt-4 rounded-full border border-[#FF2E63]/40 bg-[#FF2E63]/10 px-5 py-2 text-sm shadow-[0_0_20px_rgba(255,46,99,0.2)] transition hover:bg-[#FF2E63]/20"
          >
            Simulate Match
          </button>
        </section>
      )}

      {state === "room" && (
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
          <div className="grid grid-cols-3 items-center">
            <div className="justify-self-start pl-20 sm:pl-24">
              <CountryChip selectedCountry={selectedCountry} onClick={() => setIsCountrySheetOpen(true)} />
            </div>
            <p className="justify-self-center text-sm tracking-[0.2em] text-white/80">00:47</p>
            <button
              type="button"
              className="justify-self-end rounded-full border border-white/10 bg-white/[0.05] p-3 text-white transition hover:border-[#FF2E63]/40 hover:shadow-[0_0_20px_rgba(255,46,99,0.2)]"
              aria-label="Settings"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M10 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16.2 10a1 1 0 0 0 .8-1l-.8-.2a6.8 6.8 0 0 0-.5-1.3l.5-.7a1 1 0 0 0-.2-1.2l-.7-.7a1 1 0 0 0-1.2-.2l-.7.5a6.8 6.8 0 0 0-1.3-.5L12 3.8a1 1 0 0 0-1-.8H9a1 1 0 0 0-1 .8l-.2.8a6.8 6.8 0 0 0-1.3.5l-.7-.5a1 1 0 0 0-1.2.2l-.7.7a1 1 0 0 0-.2 1.2l.5.7c-.2.4-.4.8-.5 1.3l-.8.2a1 1 0 0 0-.8 1v1a1 1 0 0 0 .8 1l.8.2c.1.5.3.9.5 1.3l-.5.7a1 1 0 0 0 .2 1.2l.7.7a1 1 0 0 0 1.2.2l.7-.5c.4.2.8.4 1.3.5l.2.8a1 1 0 0 0 1 .8h1a1 1 0 0 0 1-.8l.2-.8c.5-.1.9-.3 1.3-.5l.7.5a1 1 0 0 0 1.2-.2l.7-.7a1 1 0 0 0 .2-1.2l-.5-.7c.2-.4.4-.8.5-1.3l.8-.2a1 1 0 0 0 .8-1v-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="relative mt-4 flex-1 overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_0_45px_rgba(255,46,99,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,46,99,0.14),rgba(0,0,0,0)_65%)]" />
            <div className="relative flex h-full min-h-[56vh] items-center justify-center text-white/45">Remote Video Placeholder</div>
            <div className="absolute bottom-4 right-4 h-28 w-20 rounded-2xl border border-white/15 bg-black/60 shadow-[0_0_25px_rgba(255,46,99,0.14)] backdrop-blur">
              <div className="flex h-full items-center justify-center text-[10px] text-white/50">You</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <ControlButton label="Skip" accent onClick={() => setState("ended")} />
            <ControlButton label="Mute" />
            <ControlButton label="Camera" />
            <ControlButton
              label={friendPending ? "Pending" : "Friend"}
              pending={friendPending}
              onClick={() => setFriendPending(true)}
            />
            <ControlButton label="Report" />
          </div>
        </section>
      )}

      {state === "ended" && (
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h2 className="text-3xl font-semibold text-white">Session Ended</h2>
          <button
            type="button"
            onClick={() => {
              setFriendPending(false);
              setState("matching");
            }}
            className="mt-8 rounded-full border border-[#FF2E63]/40 bg-[#FF2E63]/10 px-8 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(255,46,99,0.25)] transition-all duration-300 hover:bg-[#FF2E63]/20"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => {
              setFriendPending(false);
              setState("landing");
            }}
            className="mt-4 text-sm text-white/60 transition hover:text-white"
          >
            Back to Noir
          </button>
        </section>
      )}

      <CountrySheet
        open={isCountrySheetOpen}
        selectedCountry={selectedCountry}
        onClose={() => setIsCountrySheetOpen(false)}
        onSelect={setSelectedCountry}
      />
    </main>
  );
}
