# JOBAS freelance discovery and integration audit

**Observed:** 2026-10-17  
**Scope:** source code and public API behavior; candidate branch only  
**Published release remains:** v1.1.2

## What is integrated in the candidate

JOBAS has a scheduled feed pipeline. It does not invoke a general-purpose research agent on every page view.

The automatic adapters are WeRemoto, Freehire, Carryer Tech, Remote OK, Remotive, Himalayas, Jobicy, We Work Remotely and **Remote Landers (contract-only)**. Remote Landers exposes a public read-only API at https://api.remotelanders.workers.dev/api/jobs. The contract adapter was tested against the live API on 2026-10-17; it returned HTTP 200 and 100 records from a 164-record contract result set before JOBAS's own eligibility/risk filters. The provider documents that it is suitable for aggregators, requires visible attribution, and requires every imported item to link to its own Remote Landers listing page. JOBAS preserves that URL rather than inventing or substituting an employer application URL.

The daily scheduled refresh now runs nine automatic source adapters, one more than the previous eight; de/Recruiters is deliberately excluded from automatic ingestion. No new npm dependency, browser runtime, AI model, account backend, or search API credential is added. The new UI filter is client-side against the already-loaded feed, so toggling it does not issue another Worker request. The engagementType field distinguishes freelance, contract, gig, employment and unknown; engagementEvidence distinguishes source-declared types from heuristic estimates. Undeclared location remains uncertain rather than being treated as Argentina-compatible.

Himalayas's source mapping now carries provider-declared location restrictions and employmentType, and epoch-second publication dates are converted correctly to ISO timestamps. Explicit country restrictions take precedence over conflicting location keywords in a title or description. Jobicy now maps the live salaryMin, salaryMax and salaryPeriod fields rather than obsolete annualSalaryMin/annualSalaryMax fields. Hourly ranges written as $100–200 / hr are normalized for display while preserving the original salary string.

The candidate adds:
- A **Freelance / contratos / tareas** browser filter.
- Source-vs-inferred type labels on matching cards.
- Required visible Remote Landers attribution.
- Read-only MCP tool **list_freelance_opportunities**, plus engagement_type filtering for general list/search/rank tools.
- Manual discovery links to de/Recruiters, Workana, Upwork, Freelancer.com, Contra, PeoplePerHour, Guru, micro1, Outlier, CrowdGen, OneForma, RWS TrainAI and TELUS Digital AI Community.

In the latest live feed build checked on 2026-10-17, 52 of 320 records were classified as freelance/contract/gig: 27 had source-declared engagement types and 25 were heuristic estimates. Of those 52, 39 passed the current Argentina-compatibility score threshold and 13 remain uncertain. This is a classification snapshot, not a claim that every item is suitable or still open. The manual links are only outbound navigation. JOBAS does not ingest, validate or claim freshness for jobs shown by those third-party pages.

## Requested tools: actual integration status

"Referenced in a catalog" is not equivalent to "running in the feed". The current code has no dependency imports or invocation for the following research/crawling frameworks.

| Tool / project | Status in JOBAS candidate | Decision |
|---|---|---|
| Firecrawl | Existing MCP catalog reference, classified as external/heavy; not an active crawler | Do not install in the Worker |
| Crawl4AI | Existing MCP catalog reference, external/heavy | Keep external |
| Scrapling | Existing MCP catalog reference, external/heavy | Keep external |
| Browser Use | Existing MCP catalog reference, external/heavy | Keep external |
| Microsoft Playwright | Existing MCP catalog reference, external/heavy; browser binaries are not part of JOBAS runtime | Use only for external testing if needed |
| GPT Researcher | Not integrated | Research framework, not a job feed |
| Deer Flow | Not integrated | Research-agent framework, not a job feed |
| Scrapy | Not integrated | Python crawler runtime |
| STORM | Not integrated | Research/synthesis framework |
| SpiderFoot | Not integrated | OSINT framework, not a job feed |
| GoogleScraper | Not integrated | Search scraping, not a source API |
| Agent-Reach | Not integrated | External discovery tooling; not a Worker source |
| Open SEO MCP Skills | Not integrated | SEO skills do not provide job listings |
| Cloudflare Web Search API (also the destination of the supplied t.co link) | Not integrated | Requires AI Gateway credits or a provider API key and is billed per request; intentionally not enabled |
| dev-to-publish | Not integrated | Publishing automation, unrelated to finding jobs |
| last30days-skill | Not integrated | External research skill, not a feed adapter |
| WolframResearch/skills | Not integrated | Computational skills, not a job source |
| OADOI | Not integrated | Open-access DOI metadata, not freelance opportunities |
| Companion-Inc/Feynman | Not integrated | No runtime reference found; not needed for feed discovery |
| CrUX Vis | Not integrated | Web performance visualization, not a job source |
| LangChain open_deep_research | Not integrated | Research agent framework |
| NVIDIA DeepResearcher | Not integrated | Research agent framework |
| Alibaba DeepResearch | Not integrated | Research agent framework |
| InternLM MindSearch | Not integrated | Search-agent framework |
| Open WebUI | Not integrated | Separate chat UI, not a feed adapter |
| ScrapeCreators social-media-research-skills | Not integrated | External research skills |
| local-deep-research | Not integrated | External research framework |

The Cloudflare Web Search API is deliberately not wired in: Cloudflare's official documentation says calls go through AI Gateway and require loaded credits or a provider key. This project has no authorization to add recurring search spend. See [Cloudflare Web Search API prerequisites](https://developers.cloudflare.com/web-search/how-to-use/) and [pricing/billing description](https://developers.cloudflare.com/web-search/about/).

## Limitations and safety

- The automatic new source is a **contract feed**, not a universal freelancer marketplace feed. Contract work is not always equivalent to a short freelance gig.
- Workana, Upwork, Freelancer.com, Contra and other marketplace links require manual searching; there is no claim that their listings are imported. de/Recruiters is included as a regional tech-recruiter link because its jobs page includes Argentina/LATAM opportunities, but it is not a freelance-only marketplace. Its [published terms](https://www.derecruiters.com/terms) prohibit scraping, overloading, probing and circumvention, so JOBAS links to it for manual browsing only and does not ingest its listings.
- Remote Landers records with location "Not stated" stay labelled "A verificar"; the API does not disclose the employer application URL, so JOBAS links to the Remote Landers listing as required.
- The current curated-local dataset's records expired on 2026-10-15. JOBAS correctly excludes them until their source listings are reverified; no verification dates were advanced to make the local radar appear populated.
- A posting date, source trust signal or accessible URL does not prove the vacancy remains open. Users must confirm availability, location eligibility, pay terms and application instructions at the source.
- No automatic proposals, applications, emails, messages or account actions are performed.
- No AI API, crawler service or new recurring paid provider is enabled.

## Verification commands

Run from the repository root:

```bash
npm ci
npm run verify
```

The candidate adds deterministic tests for engagement classification, epoch timestamps, salary normalization, the Remote Landers mapping, browser filter/attribution and the read-only MCP endpoint. Live provider checks should be run separately from mocks because provider availability can change.
