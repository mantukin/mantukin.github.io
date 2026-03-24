import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const USERNAME = process.env.GITHUB_STATS_USER || "mantukin";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_STATS_TOKEN || process.env.GH_TOKEN || "";
const OUTPUT_FILE = path.resolve(process.cwd(), "js", "generated-github-stats.js");

if (!TOKEN) {
  throw new Error("Missing GITHUB_TOKEN or GITHUB_STATS_TOKEN for GitHub stats generation.");
}

async function githubGraphQL(query, variables = {}) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "mantukin.github.io-stats-generator",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  return payload.data;
}

async function fetchUserOverview(login) {
  const data = await githubGraphQL(
    `
      query UserOverview($login: String!) {
        user(login: $login) {
          createdAt
          pullRequests(first: 1) {
            totalCount
          }
          issues(first: 1) {
            totalCount
          }
          repositoriesContributedTo(
            first: 1
            includeUserRepositories: true
            privacy: PUBLIC
            contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
          ) {
            totalCount
          }
          contributionsCollection {
            contributionYears
          }
        }
      }
    `,
    { login }
  );

  return data.user;
}

async function fetchOwnedRepositories(login) {
  const repositories = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const data = await githubGraphQL(
      `
        query OwnedRepositories($login: String!, $after: String) {
          user(login: $login) {
            repositories(
              first: 100
              after: $after
              ownerAffiliations: OWNER
              isFork: false
            ) {
              nodes {
                stargazerCount
                isPrivate
                primaryLanguage {
                  name
                  color
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      { login, after: endCursor }
    );

    const batch = data.user.repositories.nodes || [];
    repositories.push(...batch);
    hasNextPage = Boolean(data.user.repositories.pageInfo?.hasNextPage);
    endCursor = data.user.repositories.pageInfo?.endCursor || null;
  }

  return repositories;
}

async function fetchContributionYear(login, year) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const data = await githubGraphQL(
    `
      query ContributionYear($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `,
    { login, from, to }
  );

  return data.user.contributionsCollection;
}

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function diffDays(left, right) {
  const leftDate = new Date(`${left}T00:00:00Z`);
  const rightDate = new Date(`${right}T00:00:00Z`);
  return Math.round((rightDate.getTime() - leftDate.getTime()) / 86400000);
}

function calculateStreaks(contributionDays) {
  const activeDays = Array.from(contributionDays.entries())
    .filter(([, count]) => count > 0)
    .map(([date]) => date)
    .sort((left, right) => left.localeCompare(right));

  if (!activeDays.length) {
    return {
      current: { length: 0, start: "", end: "" },
      longest: { length: 0, start: "", end: "" },
      total: 0,
    };
  }

  let runStart = activeDays[0];
  let runLength = 1;
  let previousDay = activeDays[0];
  let longest = { length: 1, start: activeDays[0], end: activeDays[0] };

  for (let index = 1; index < activeDays.length; index += 1) {
    const day = activeDays[index];
    if (diffDays(previousDay, day) === 1) {
      runLength += 1;
    } else {
      if (runLength > longest.length) {
        longest = { length: runLength, start: runStart, end: previousDay };
      }
      runStart = day;
      runLength = 1;
    }

    previousDay = day;
  }

  if (runLength > longest.length) {
    longest = { length: runLength, start: runStart, end: previousDay };
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakEnd = contributionDays.get(today) > 0 ? today : contributionDays.get(yesterday) > 0 ? yesterday : "";

  if (!streakEnd) {
    return {
      current: { length: 0, start: "", end: "" },
      longest,
      total: activeDays.length,
    };
  }

  let currentStart = streakEnd;
  let cursor = streakEnd;
  while (true) {
    const previous = new Date(new Date(`${cursor}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    if ((contributionDays.get(previous) || 0) <= 0) {
      break;
    }
    currentStart = previous;
    cursor = previous;
  }

  return {
    current: {
      length: diffDays(currentStart, streakEnd) + 1,
      start: currentStart,
      end: streakEnd,
    },
    longest,
    total: activeDays.length,
  };
}

function buildLanguageBreakdown(repositories) {
  const counts = new Map();

  for (const repository of repositories) {
    const language = repository.primaryLanguage;
    if (!language?.name) {
      continue;
    }

    if (counts.has(language.name)) {
      counts.get(language.name).count += 1;
    } else {
      counts.set(language.name, {
        name: language.name,
        count: 1,
        color: language.color || "#59f0ff",
      });
    }
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

async function generateSnapshot() {
  const overview = await fetchUserOverview(USERNAME);
  const repositories = await fetchOwnedRepositories(USERNAME);
  const contributionYears = [...(overview.contributionsCollection?.contributionYears || [])]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => right - left);

  if (!contributionYears.length) {
    throw new Error("No contribution years returned from GitHub.");
  }

  const contributionDays = new Map();
  let totalContributions = 0;
  let yearCommits = 0;

  for (const year of contributionYears) {
    const contributionYear = await fetchContributionYear(USERNAME, year);
    if (year === contributionYears[0]) {
      yearCommits = contributionYear.totalCommitContributions || 0;
    }

    totalContributions += contributionYear.contributionCalendar?.totalContributions || 0;

    for (const week of contributionYear.contributionCalendar?.weeks || []) {
      for (const day of week.contributionDays || []) {
        contributionDays.set(day.date, day.contributionCount);
      }
    }
  }

  const publicRepositories = repositories.filter((repository) => !repository.isPrivate);
  const totalStars = publicRepositories.reduce((sum, repository) => sum + (repository.stargazerCount || 0), 0);
  const streaks = calculateStreaks(contributionDays);

  return {
    year: contributionYears[0],
    stats: {
      totalStars,
      yearCommits,
      totalPrs: overview.pullRequests?.totalCount || 0,
      totalIssues: overview.issues?.totalCount || 0,
      contributedTo: overview.repositoriesContributedTo?.totalCount || 0,
    },
    languages: buildLanguageBreakdown(repositories),
    commits: {
      total: totalContributions,
      current: streaks.current,
      longest: streaks.longest,
      since: overview.createdAt,
    },
  };
}

async function main() {
  const snapshot = await generateSnapshot();
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "github-graphql",
    data: snapshot,
  };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `window.__STATIC_GITHUB_STATS__ = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
  console.log(`Updated ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
