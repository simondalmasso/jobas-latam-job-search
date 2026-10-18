import { fetchRemoteLanders, buildFeed } from "../src/sources.js";

const jobs = await fetchRemoteLanders();
const summary = {
  source: "Remote Landers",
  httpAdapter: "completed",
  returnedAfterJobasFilters: jobs.length,
  sourceDeclaredContractCount: jobs.filter(job => job.engagementType === "contract" && job.engagementEvidence === "source").length,
  missingPublicationDate: jobs.filter(job => !job.publishedAt).length,
  locationNeedsReview: jobs.filter(job => job.argentina?.score < 80).length,
  knownCompensation: jobs.filter(job => job.pay?.monthlyMin != null || job.pay?.monthlyMax != null).length,
  sample: jobs.slice(0, 5).map(({title, company, location, publishedAt, engagementType, engagementEvidence, pay, url, argentina}) => ({
    title, company, location, publishedAt, engagementType, engagementEvidence,
    publishedPay: pay?.raw, monthlyEstimate: pay?.monthlyMin == null ? null : pay.monthlyMin,
    argentinaEligibility: argentina?.label, listingUrl: url
  }))
};
console.log(JSON.stringify(summary, null, 2));
if (!jobs.length || jobs.some(job => job.engagementType !== "contract" || job.engagementEvidence !== "source" || !job.url?.startsWith("https://remotelanders.com/remote-jobs/"))) {
  console.error("LIVE_SOURCE_ACCEPTANCE=FAIL");
  process.exitCode = 1;
} else {
  console.log("LIVE_SOURCE_ACCEPTANCE=PASS");
}

if (process.argv.includes("--full-feed")) {
  const feed = await buildFeed(320);
  const relevant = feed.jobs.filter(job => ["freelance", "contract", "gig"].includes(job.engagementType));
  const remoteLanders = relevant.filter(job => job.source === "remotelanders");
  console.log(JSON.stringify({
    fullFeedCount: feed.jobsCount,
    sourceHealth: feed.health.map(source => ({source: source.source, state: source.state, jobs: source.jobs})),
    freelanceContractGigInFeed: relevant.length,
    sourceDeclaredTypes: relevant.filter(job => job.engagementEvidence === "source").length,
    argentinaCompatibleFreelanceCandidates: relevant.filter(job => job.argentina.score >= 80).length,
    eligibilityNeedsReview: relevant.filter(job => job.argentina.score > 10 && job.argentina.score < 80).length,
    jobicyWithPublishedCompensation: feed.jobs.filter(job => job.source === "jobicy" && (job.pay?.monthlyMin != null || job.pay?.monthlyMax != null)).length,
    jobicyContractOrFreelance: feed.jobs.filter(job => job.source === "jobicy" && ["freelance","contract","gig"].includes(job.engagementType)).length,
    remoteLandersInFeed: remoteLanders.length,
    remoteLandersArgentinaCompatible: remoteLanders.filter(job => job.argentina.score >= 80).length,
    remoteLandersEligibilityUncertain: remoteLanders.filter(job => job.argentina.score > 10 && job.argentina.score < 80).length,
    sample: relevant.slice(0, 12).map(job => ({
      source: job.source, title: job.title, company: job.company, type: job.engagementType,
      evidence: job.engagementEvidence, location: job.location, eligibility: job.argentina.label,
      publishedAt: job.publishedAt, qualityScore: job.qualityScore
    }))
  }, null, 2));
  console.log("FULL_FEED_AUDIT=PASS");
}
