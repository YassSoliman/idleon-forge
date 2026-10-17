// SPDX-License-Identifier: GPL-3.0-only
// GitHub access through the Suggestions GitHub App (M13 TR-12, TR-13). "Issues: write" cannot be scoped
// to the bot's own issues, so this client is the boundary: it exposes exactly four writes (create issue,
// add comment, add labels, remove a label), every label it writes is on an allow-list, and every write to
// an existing issue first re-reads that issue and checks it was created by the bot and carries
// `suggestion`. Reads: the bot-created listing and one issue's comments.

import { bytesToBase64Url, pemToDer, stringToBase64Url, utf8Bytes } from './encoding';
import { LABEL } from './render';
import type { IssueComment } from './status';

export const REPO_OWNER = 'YassSoliman';
export const REPO_NAME = 'idleon-forge';
export const BOT_LOGIN = 'idleon-forge-suggestions[bot]';
const API = 'https://api.github.com';
/** Listing pages read per request (100 issues each); far above MVP volume, bounded for subrequests. */
export const MAX_LIST_PAGES = 10;

/** Every label this Worker may add or remove. Listener and outcome labels are never written here. */
export const WRITABLE_LABELS: ReadonlySet<string> = new Set([
  LABEL.suggestion,
  'suggestion:idea',
  'suggestion:wrong',
  'suggestion:confusing',
  LABEL.new,
  LABEL.report,
  LABEL.needsInfo,
]);

export class GitHubUnavailable extends Error {}
/** A write was refused before reaching GitHub (not a bot Suggestion, or a label off the allow-list). */
export class GitHubWriteRefused extends Error {}

export interface RawIssue {
  number: number;
  html_url: string;
  state: 'open' | 'closed';
  state_reason: string | null;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
  labels: Array<{ name: string } | string>;
  pull_request?: unknown;
}

export function labelNames(issue: Pick<RawIssue, 'labels'>): string[] {
  return issue.labels.map((l) => (typeof l === 'string' ? l : l.name));
}

export function isBotSuggestion(issue: RawIssue): boolean {
  return (
    issue.user?.login === BOT_LOGIN && !issue.pull_request && labelNames(issue).includes(LABEL.suggestion)
  );
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface AppCredentials {
  appId: string;
  installationId: string;
  /** PKCS#8 PEM ("BEGIN PRIVATE KEY"). */
  privateKeyPem: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Installation tokens live in isolate memory only, refreshed 5 minutes before expiry (TR-13).
const tokenCache = new Map<string, CachedToken>();
const signingKeys = new Map<string, Promise<CryptoKey>>();

export function clearTokenCache(): void {
  tokenCache.clear();
  signingKeys.clear();
}

function signingKey(pem: string): Promise<CryptoKey> {
  let key = signingKeys.get(pem);
  if (!key) {
    const der = pemToDer(pem, 'PRIVATE KEY');
    if (!der) return Promise.reject(new GitHubUnavailable('app key is not PKCS#8'));
    key = crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
      'sign',
    ]);
    signingKeys.set(pem, key);
  }
  return key;
}

/** A 9-minute App JWT (RS256), backdated 60 s for clock drift. */
export async function appJwt(creds: AppCredentials, nowMs: number): Promise<string> {
  const now = Math.floor(nowMs / 1000);
  const head = stringToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = stringToBase64Url(JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: creds.appId }));
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await signingKey(creds.privateKeyPem),
    utf8Bytes(`${head}.${body}`),
  );
  return `${head}.${body}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

const COMMENTS_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      comments(last: 100) {
        nodes {
          databaseId body createdAt lastEditedAt
          author { __typename login ... on User { databaseId } ... on Bot { databaseId } }
          editor { __typename login ... on User { databaseId } ... on Bot { databaseId } }
        }
      }
    }
  }
}`;

interface GqlActor {
  __typename: string;
  login: string;
  databaseId?: number;
}

interface GqlComment {
  databaseId: number;
  body: string;
  createdAt: string;
  lastEditedAt: string | null;
  author: GqlActor | null;
  editor: GqlActor | null;
}

export class GitHubClient {
  private readonly verified = new Set<number>();

  constructor(
    private readonly creds: AppCredentials,
    private readonly fetchFn: Fetch,
    private readonly clock: () => number = Date.now,
  ) {}

  private async installationToken(): Promise<string> {
    const cached = tokenCache.get(this.creds.installationId);
    if (cached && cached.expiresAt - 5 * 60 * 1000 > this.clock()) return cached.token;
    const jwt = await appJwt(this.creds, this.clock());
    const res = await this.fetchFn(`${API}/app/installations/${this.creds.installationId}/access_tokens`, {
      method: 'POST',
      headers: { ...this.baseHeaders(), Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      // Least privilege for each token: this repository, issues only.
      body: JSON.stringify({ repositories: [REPO_NAME], permissions: { issues: 'write', metadata: 'read' } }),
    });
    if (!res.ok) throw new GitHubUnavailable(`installation token: HTTP ${res.status}`);
    const json = (await res.json()) as { token: string; expires_at: string };
    tokenCache.set(this.creds.installationId, { token: json.token, expiresAt: Date.parse(json.expires_at) });
    return json.token;
  }

  private baseHeaders(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'activeon-suggestions',
    };
  }

  private async call(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.installationToken();
    let res: Response;
    try {
      res = await this.fetchFn(`${API}${path}`, {
        ...init,
        headers: {
          ...this.baseHeaders(),
          Authorization: `Bearer ${token}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch (e) {
      throw new GitHubUnavailable(`fetch failed: ${(e as Error).message}`);
    }
    return res;
  }

  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.call(path, init);
    if (!res.ok)
      throw new GitHubUnavailable(`${init?.method ?? 'GET'} ${path.split('?')[0]}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  private repoPath(rest: string): string {
    return `/repos/${REPO_OWNER}/${REPO_NAME}${rest}`;
  }

  /** Every bot-created Suggestion, newest first (TR-12). No search: the REST listing is consistent. */
  async listSuggestionIssues(): Promise<RawIssue[]> {
    const out: RawIssue[] = [];
    const creator = encodeURIComponent(BOT_LOGIN);
    for (let page = 1; page <= MAX_LIST_PAGES; page++) {
      const batch = await this.json<RawIssue[]>(
        this.repoPath(
          `/issues?labels=${LABEL.suggestion}&creator=${creator}&state=all&sort=created&direction=desc&per_page=100&page=${page}`,
        ),
      );
      out.push(...batch.filter(isBotSuggestion));
      if (batch.length < 100) break;
    }
    return out;
  }

  async listComments(issueNumber: number): Promise<IssueComment[]> {
    const res = await this.json<{
      data?: { repository?: { issue?: { comments: { nodes: GqlComment[] } } | null } };
      errors?: unknown;
    }>('/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: COMMENTS_QUERY,
        variables: { owner: REPO_OWNER, name: REPO_NAME, number: issueNumber },
      }),
    });
    const nodes = res.data?.repository?.issue?.comments.nodes;
    if (!nodes) throw new GitHubUnavailable('graphql: no comments');
    return nodes.map((n) => ({
      id: n.databaseId,
      body: n.body,
      createdAt: n.createdAt,
      authorId: n.author?.databaseId ?? null,
      authorLogin: n.author?.login ?? null,
      authorIsBot: n.author?.__typename === 'Bot',
      lastEditedAt: n.lastEditedAt,
      editorId: n.editor?.databaseId ?? null,
    }));
  }

  private checkLabels(labels: readonly string[]): void {
    for (const l of labels) if (!WRITABLE_LABELS.has(l)) throw new GitHubWriteRefused(`label ${l}`);
  }

  /** Re-reads the issue: it must be created by the bot and carry `suggestion` (TR-13). */
  private async assertBotSuggestion(issueNumber: number): Promise<void> {
    if (this.verified.has(issueNumber)) return;
    const issue = await this.json<RawIssue>(this.repoPath(`/issues/${issueNumber}`));
    if (!isBotSuggestion(issue)) throw new GitHubWriteRefused(`issue ${issueNumber} is not a bot Suggestion`);
    this.verified.add(issueNumber);
  }

  async createIssue(input: { title: string; body: string; labels: string[] }): Promise<RawIssue> {
    this.checkLabels(input.labels);
    if (!input.labels.includes(LABEL.suggestion)) throw new GitHubWriteRefused('missing suggestion label');
    const issue = await this.json<RawIssue>(this.repoPath('/issues'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
    this.verified.add(issue.number);
    return issue;
  }

  async addComment(issueNumber: number, body: string): Promise<{ id: number; created_at: string }> {
    await this.assertBotSuggestion(issueNumber);
    return this.json(this.repoPath(`/issues/${issueNumber}/comments`), {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    this.checkLabels(labels);
    await this.assertBotSuggestion(issueNumber);
    await this.json(this.repoPath(`/issues/${issueNumber}/labels`), {
      method: 'POST',
      body: JSON.stringify({ labels }),
    });
  }

  /** Removing a label that is already gone counts as success. */
  async removeLabel(issueNumber: number, label: string): Promise<void> {
    this.checkLabels([label]);
    await this.assertBotSuggestion(issueNumber);
    const res = await this.call(this.repoPath(`/issues/${issueNumber}/labels/${encodeURIComponent(label)}`), {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 404) throw new GitHubUnavailable(`remove label: HTTP ${res.status}`);
  }
}
