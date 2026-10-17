// SPDX-License-Identifier: GPL-3.0-only
// The GitHub client's write boundary (M13 TR-13): bot-authorship check on every write, a label
// allow-list, and an App JWT that verifies with the App's public key.

import { beforeEach, describe, expect, it } from 'vitest';
import { base64UrlToBytes, utf8Bytes } from '../src/encoding';
import { appJwt, clearTokenCache, GitHubClient, GitHubWriteRefused } from '../src/github';
import { FakeGitHub, NOW, pkcs8Pem, rsaKeyPair } from './helpers';

let gh: FakeGitHub;
let client: GitHubClient;

beforeEach(async () => {
  clearTokenCache();
  gh = new FakeGitHub();
  const pair = await rsaKeyPair();
  client = new GitHubClient(
    { appId: '1', installationId: '2', privateKeyPem: await pkcs8Pem(pair.privateKey) },
    gh.fetch,
    () => NOW,
  );
});

describe('write guard', () => {
  it('refuses to comment on or label an issue the bot did not create', async () => {
    const human = gh.addIssue({ body: 'decision ticket', user: { login: 'YassSoliman' } });
    await expect(client.addComment(human.number, 'x')).rejects.toBeInstanceOf(GitHubWriteRefused);
    await expect(client.addLabels(human.number, ['suggestion:new'])).rejects.toBeInstanceOf(
      GitHubWriteRefused,
    );
    await expect(client.removeLabel(human.number, 'suggestion:new')).rejects.toBeInstanceOf(
      GitHubWriteRefused,
    );
    expect(gh.calls.filter((c) => !c.startsWith('GET') && !c.includes('access_tokens'))).toEqual([]);
  });

  it('refuses a bot issue without the suggestion label', async () => {
    const issue = gh.addIssue({ body: 'x', labels: [{ name: 'other' }] });
    await expect(client.addComment(issue.number, 'x')).rejects.toBeInstanceOf(GitHubWriteRefused);
  });

  it('refuses labels off the allow-list, before any call', async () => {
    const issue = gh.addIssue({ body: 'x' });
    for (const label of [
      'ready-for-agent',
      'needs-triage',
      'outcome:wontfix',
      'listener:claimed',
      'wontfix',
    ]) {
      await expect(client.addLabels(issue.number, [label])).rejects.toBeInstanceOf(GitHubWriteRefused);
    }
    await expect(
      client.createIssue({ title: 't', body: 'b', labels: ['suggestion', 'ready-for-human'] }),
    ).rejects.toBeInstanceOf(GitHubWriteRefused);
    expect(gh.calls).toEqual([]);
  });

  it('allows writes to a bot Suggestion', async () => {
    const issue = gh.addIssue({
      body: 'x',
      labels: [{ name: 'suggestion' }, { name: 'suggestion:needs-info' }],
    });
    await client.addComment(issue.number, 'hi');
    await client.removeLabel(issue.number, 'suggestion:needs-info');
    await client.removeLabel(issue.number, 'suggestion:needs-info');
    await client.addLabels(issue.number, ['suggestion:new']);
    expect(gh.labelsOf(issue.number)).toEqual(['suggestion', 'suggestion:new']);
  });

  it('asks for a token scoped to this repository and issues only', async () => {
    let tokenBody: unknown;
    const inner = gh.fetch;
    const spy = new GitHubClient(
      { appId: '1', installationId: '2', privateKeyPem: await pkcs8Pem((await rsaKeyPair()).privateKey) },
      async (input, init) => {
        if (input.includes('access_tokens')) tokenBody = JSON.parse(String(init?.body));
        return inner(input, init);
      },
      () => NOW,
    );
    clearTokenCache();
    await spy.listSuggestionIssues();
    expect(tokenBody).toEqual({
      repositories: ['idleon-forge'],
      permissions: { issues: 'write', metadata: 'read' },
    });
  });
});

describe('appJwt', () => {
  it('is a 9-minute RS256 JWT, backdated a minute, that verifies with the public key', async () => {
    const pair = await rsaKeyPair();
    const jwt = await appJwt(
      { appId: '42', installationId: '1', privateKeyPem: await pkcs8Pem(pair.privateKey) },
      NOW,
    );
    const [h, p, s] = jwt.split('.') as [string, string, string];
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(p) ?? new Uint8Array()));
    const now = Math.floor(NOW / 1000);
    expect(payload).toEqual({ iat: now - 60, exp: now + 540, iss: '42' });
    const sig = base64UrlToBytes(s);
    expect(sig).not.toBeNull();
    expect(
      await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        pair.publicKey,
        sig as Uint8Array<ArrayBuffer>,
        utf8Bytes(`${h}.${p}`),
      ),
    ).toBe(true);
  });
});
