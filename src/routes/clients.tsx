"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Globe2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "@/lib/navigation";
import { clientIndustries, clientShowcase } from "@/data/clients";
import styles from "./clients.module.css";

export default function ClientsPage() {
  const [industry, setIndustry] = useState("All companies");
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const list = clientShowcase.filter(
    (client) =>
      (industry === "All companies" || client.industry === industry) &&
      `${client.name} ${client.domain} ${client.industry} ${client.services.join(" ")}`
        .toLowerCase()
        .includes(search),
  );
  const featured = clientShowcase[0]!;
  function resetFilters() {
    setIndustry("All companies");
    setQuery("");
  }

  return (
    <div className={styles["page"]}>
      <section className={styles["hero"]} aria-labelledby="clients-title">
        <div className={`${styles["container"]} ${styles["heroGrid"]}`}>
          <div className={styles["heroCopy"]}>
            <span className={styles["eyebrow"]}>
              <span /> THE PEOPLE WE BUILD FOR
            </span>
            <h1 id="clients-title">
              Our top clients.
              <br />
              <span>Built to stand out.</span>
            </h1>
            <p>
              Ambitious brands. Thoughtful digital experiences. Meet the companies behind the
              websites, platforms and stores we bring to life.
            </p>
            <div className={styles["heroActions"]}>
              <a href="#all-companies" className={styles["primaryButton"]}>
                Explore our clients <ArrowDown size={17} aria-hidden="true" />
              </a>
              <Link to="/contact" className={styles["textLink"]}>
                Let’s build together <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <dl className={styles["stats"]}>
              <div>
                <dt>{String(clientShowcase.length).padStart(2, "0")}</dt>
                <dd>Client brands</dd>
              </div>
              <div>
                <dt>{String(clientIndustries.length).padStart(2, "0")}</dt>
                <dd>Industries represented</dd>
              </div>
              <div className={styles["statNote"]}>
                <dt className="sr-only">Our approach</dt>
                <Globe2 size={23} aria-hidden="true" />
                <dd>
                  Different industries.
                  <br />
                  One digital partner.
                </dd>
              </div>
            </dl>
          </div>
          <div className={styles["heroVisual"]}>
            <div className={styles["visualLabel"]}>
              <Sparkles size={15} aria-hidden="true" /> BRANDS IN FOCUS{" "}
              <span>01 / {String(clientShowcase.length).padStart(2, "0")}</span>
            </div>
            <div className={styles["spotlight"]}>
              <img src={featured.image} alt="" width={800} height={600} fetchPriority="high" />
              <div className={styles["spotlightOverlay"]}>
                <span className={styles["spotlightTag"]}>{featured.industry}</span>
                <h2>{featured.name}</h2>
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${featured.name} (opens in a new tab)`}
                >
                  Explore the brand <ArrowUpRight size={19} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className={styles["visualFooter"]}>
              <span className={styles["miniMonogram"]}>CM</span>
              <div>
                <strong>creatormoves365.ai</strong>
                <span>Ideas, powered by technology.</span>
              </div>
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <div className={styles["visualCaption"]}>REAL ESTATE · COMMERCE · AI · CREATORS</div>
          </div>
        </div>
      </section>

      <section
        id="all-companies"
        className={`${styles["directory"]} ${styles["container"]}`}
        aria-labelledby="directory-title"
      >
        <div className={styles["sectionTop"]}>
          <div>
            <span className={styles["eyebrow"]}>OUR CLIENT DIRECTORY</span>
            <h2 id="directory-title">
              Every brand. <span>One place.</span>
            </h2>
            <p>Discover all our listed companies and find your next inspiration.</p>
          </div>
          <span className={styles["totalBadge"]}>
            <Building2 size={15} aria-hidden="true" /> {clientShowcase.length} companies
          </span>
        </div>
        <div className={styles["tools"]}>
          <div className={styles["search"]}>
            <Search size={18} aria-hidden="true" />
            <label htmlFor="company-search" className="sr-only">
              Search companies
            </label>
            <input
              id="company-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a company, industry or service…"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className={styles["filters"]} role="group" aria-label="Filter companies by industry">
            {["All companies", ...clientIndustries].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={industry === item}
                onClick={() => setIndustry(item)}
              >
                {item}
                {item === "All companies" ? <span>{clientShowcase.length}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className={styles["resultsLine"]}>
          <p role="status" aria-live="polite">
            Showing <strong>{list.length}</strong> of {clientShowcase.length} companies
          </p>
          {query || industry !== "All companies" ? (
            <button type="button" onClick={resetFilters}>
              Reset filters <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <span>
              Explore a brand. Visit their world. <ArrowDown size={13} aria-hidden="true" />
            </span>
          )}
        </div>
        <div className={styles["cards"]}>
          {list.map((client) => (
            <article className={styles["card"]} key={client.domain}>
              <div className={styles["cardImage"]}>
                <img src={client.image} alt="" loading="lazy" width={640} height={400} />
                <span className={styles["industryBadge"]}>{client.industry}</span>
                <span className={styles["monogram"]} aria-hidden="true">
                  {client.initials}
                </span>
              </div>
              <div className={styles["cardBody"]}>
                <h3>{client.name}</h3>
                <p>{client.description}</p>
                <ul className={styles["services"]} aria-label="Project focus">
                  {client.services.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
                <a
                  href={client.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${client.name} (opens in a new tab)`}
                >
                  <span>{client.domain}</span>
                  <span className={styles["visitArrow"]}>
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
        {list.length === 0 ? (
          <div className={styles["empty"]}>
            <Search size={30} aria-hidden="true" />
            <h3>No companies found</h3>
            <p>Try another name or explore all industries.</p>
            <button type="button" onClick={resetFilters}>
              Show all companies <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>

      <section
        className={`${styles["container"]} ${styles["ctaSection"]}`}
        aria-labelledby="clients-cta-title"
      >
        <div className={styles["cta"]}>
          <div>
            <span className={styles["eyebrow"]}>YOUR NEXT CHAPTER</span>
            <h2 id="clients-cta-title">
              Your brand could
              <br />
              be next.
            </h2>
            <p>
              A new website, a smarter platform, a store ready to grow.
              <br className="hidden sm:block" /> Let’s turn your next idea into something people
              remember.
            </p>
          </div>
          <div className={styles["ctaActions"]}>
            <Link to="/contact" className={styles["primaryButton"]}>
              Start your project <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
            <Link to="/portfolio" className={styles["ctaSecondary"]}>
              Explore our work <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
