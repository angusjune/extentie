# Chrome Web Store publishing

Pushing a tag that matches the manifest version runs
`.github/workflows/publish-chrome.yml`. For example, manifest version `2.5.0`
must be released with tag `v2.5.0`.

Only tag pushes trigger the workflow. The `push` trigger filters on `tags`
alone, so pushing a branch — including `main` — never publishes anything.

The workflow builds the extension, saves the ZIP as a GitHub Actions artifact,
uploads it through Chrome Web Store API v2, and submits it with
`DEFAULT_PUBLISH`. Chrome will review the submission and publish it
automatically after approval.

## One-time Google Cloud setup

1. Create or select a Google Cloud project and enable the
   **Chrome Web Store API**.
2. Create a service account. It does not need a Google Cloud project role.
3. In the Chrome Web Store Developer Dashboard, open **Account** and add the
   service account email under
   [Chrome Web Store API access][cws-service-account].
4. Configure a GitHub Actions Workload Identity Federation provider restricted
   to this repository, then grant that identity
   `roles/iam.workloadIdentityUser` on the service account.

Step 4 has two halves — creating the provider, and granting the service account
binding. Skipping the second half leaves a setup that looks complete but fails
every release at the authentication step. Run the checks in
[Verify the setup](#verify-the-setup) once you are done.

Workload Identity Federation lets GitHub exchange its short-lived OIDC token
for a short-lived Google access token. It avoids downloading or storing a
service-account key.

Follow either [the gcloud CLI](#configure-with-the-gcloud-cli) or
[the Google Cloud Console](#configure-with-the-google-cloud-console) below —
they produce the same result.

### Configure with the gcloud CLI

The commands below require the [Google Cloud CLI][gcloud-cli]. Authenticate with
an account allowed to manage IAM and service accounts in the selected project:

```sh
gcloud auth login
```

Set these values for the current shell. Replace the first two values with the
Google Cloud project and service-account email created in the previous steps:

```sh
GCP_PROJECT_ID="replace-with-project-id"
GCP_SERVICE_ACCOUNT="replace-with-service-account@replace-with-project-id.iam.gserviceaccount.com"
WIF_POOL_ID="github-actions"
WIF_PROVIDER_ID="extentie-releases"
GITHUB_REPOSITORY="angusjune/extentie"

gcloud config set project "${GCP_PROJECT_ID}"
```

Enable the APIs required to create the federation and mint short-lived service
account tokens. The Chrome Web Store API itself should already be enabled from
step 1.

```sh
gcloud services enable \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  --project="${GCP_PROJECT_ID}"
```

Create a workload identity pool:

```sh
gcloud iam workload-identity-pools create "${WIF_POOL_ID}" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions"
```

Create an OIDC provider for this repository. The attribute condition is
important: GitHub uses one shared token issuer, so an unrestricted provider
could accept tokens from other repositories.

```sh
gcloud iam workload-identity-pools providers create-oidc "${WIF_PROVIDER_ID}" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${WIF_POOL_ID}" \
  --display-name="Extentie releases" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == '${GITHUB_REPOSITORY}'"
```

Read the pool's full resource name. The IAM member in the next command must use
the numeric project path returned here, not the human-readable project ID.

```sh
WIF_POOL_RESOURCE="$(
  gcloud iam workload-identity-pools describe "${WIF_POOL_ID}" \
    --project="${GCP_PROJECT_ID}" \
    --location="global" \
    --format="value(name)"
)"

echo "${WIF_POOL_RESOURCE}"
```

Allow only workflows from `angusjune/extentie` to impersonate the Chrome Web
Store service account. Do not skip this command — without it every release
fails with `iam.serviceAccounts.getAccessToken` denied:

```sh
gcloud iam service-accounts add-iam-policy-binding "${GCP_SERVICE_ACCOUNT}" \
  --project="${GCP_PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WIF_POOL_RESOURCE}/attribute.repository/${GITHUB_REPOSITORY}"
```

Finally, obtain the provider resource name and copy the two printed values into
the GitHub environment variables described in the next section:

```sh
GCP_WORKLOAD_IDENTITY_PROVIDER="$(
  gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER_ID}" \
    --project="${GCP_PROJECT_ID}" \
    --location="global" \
    --workload-identity-pool="${WIF_POOL_ID}" \
    --format="value(name)"
)"

echo "GCP_SERVICE_ACCOUNT=${GCP_SERVICE_ACCOUNT}"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=${GCP_WORKLOAD_IDENTITY_PROVIDER}"
```

The provider name should look like:

```text
projects/123456789/locations/global/workloadIdentityPools/github-actions/providers/extentie-releases
```

### Configure with the Google Cloud Console

This achieves the same result as the CLI section without installing anything.
Console labels shift occasionally; match on meaning if a button has been
renamed.

**1. Enable the APIs.** Open [APIs & Services → Library][console-api-library],
then search for and **Enable** each of:

- Chrome Web Store API
- Identity and Access Management (IAM) API
- IAM Service Account Credentials API
- Cloud Resource Manager API
- Security Token Service API

**2. Create the service account.** Open
[IAM & Admin → Service Accounts][console-service-accounts] and click
**Create service account**. Give it a name, then click **Done** — skip the
"Grant this service account access to project" step, because it needs no
project role. Copy the generated email; it is the `GCP_SERVICE_ACCOUNT` value.

**3. Add the service account to the Chrome Web Store.** In the Chrome Web Store
Developer Dashboard, open **Account** and add that email under
[Chrome Web Store API access][cws-service-account]. Without this the workflow
authenticates to Google but is rejected by the store.

**4. Create the pool and provider.** Open
[IAM & Admin → Workload Identity Federation][console-wif] and start the
**New workload provider and pool** flow.

On the pool step:

| Field | Value |
| --- | --- |
| Name | `github-actions` |
| Description | Anything, for example `GitHub Actions` |

Click **Continue**. On the provider step:

| Field | Value |
| --- | --- |
| Select a provider | `OpenID Connect (OIDC)` |
| Provider name | `Extentie releases` |
| Provider ID | `extentie-releases` |
| Issuer URL | `https://token.actions.githubusercontent.com` |
| Audiences | `Default audience` |

Click **Continue**. Under **Configure provider attributes**, add both mappings:

| Google attribute | OIDC claim |
| --- | --- |
| `google.subject` | `assertion.sub` |
| `attribute.repository` | `assertion.repository` |

Under **Attribute conditions**, enter:

```text
assertion.repository == 'angusjune/extentie'
```

This condition is important. GitHub uses one shared token issuer, so an
unrestricted provider could accept tokens from other repositories. Click
**Save**.

**5. Grant the service account binding.** This is the step most easily missed.
Still on the [Workload Identity Federation][console-wif] page, open the pool and
click **Grant access**, then:

1. Choose **Grant access using Service Account impersonation**.
2. Select the service account created in step 2.
3. Under the attribute filter, choose **Only identities matching the filter**.
4. Set **Attribute name** to `repository` and **Attribute value** to
   `angusjune/extentie`.
5. Click **Save**, then **Dismiss** the credential-configuration download — the
   workflow does not need that file.

**6. Collect the provider resource name.** The Console does not display the full
resource path directly. Build it from your project number, which appears on the
[Cloud overview → Dashboard][console-dashboard] under **Project info**:

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/extentie-releases
```

Use the numeric project number, not the project ID. That string is the
`GCP_WORKLOAD_IDENTITY_PROVIDER` value for the next section.

## Verify the setup

Run these after either setup path. They are read-only, and they catch the
misconfigurations that otherwise stay invisible until a release fails.

The service account policy must list `roles/iam.workloadIdentityUser` with a
`principalSet://` member ending in `/attribute.repository/angusjune/extentie`.
An empty policy means step 5 above never took effect:

```sh
gcloud iam service-accounts get-iam-policy "${GCP_SERVICE_ACCOUNT}" \
  --project="${GCP_PROJECT_ID}"
```

The provider must map `attribute.repository` and carry the repository
condition, and both the pool and provider must be `ACTIVE`:

```sh
gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER_ID}" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${WIF_POOL_ID}"
```

Both of these APIs must appear:

```sh
gcloud services list --enabled --project="${GCP_PROJECT_ID}" \
  | grep -E 'iamcredentials|chromewebstore'
```

All four GitHub variables must be present, and the project number inside
`GCP_WORKLOAD_IDENTITY_PROVIDER` must match the project number in the
service account policy's `principalSet://` member:

```sh
gh api repos/angusjune/extentie/environments/chrome-web-store/variables \
  --jq '.variables[] | "\(.name) = \(.value)"'
```

## GitHub environment

Create an environment named `chrome-web-store` in the GitHub repository. Add
these environment variables:

| Variable | Value |
| --- | --- |
| `CWS_EXTENSION_ID` | `bhjkadebkpcekfbjkkmcjhhlfidajfmi` |
| `CWS_PUBLISHER_ID` | Publisher ID from Developer Dashboard → Publisher → Settings |
| `GCP_SERVICE_ACCOUNT` | Service account email |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name, beginning with `projects/` |

In the GitHub web interface these live under **Settings → Environments → New
environment**, then **Add environment variable** on the created environment.
Add them as *variables*, not secrets — the workflow reads them through
`vars.*`, so values stored as secrets are read as empty strings.

No Google credential needs to be stored as a GitHub secret. The workflow
requests a short-lived access token through GitHub's OIDC identity.

Optionally add required reviewers or tag restrictions to the
`chrome-web-store` environment. With no protection rules, matching version tags
publish automatically with no manual approval.

## Release

Bump the version in **both** `manifest.json` and `package.json`. The two must
match — `test/source-invariants.test.mjs` asserts it, so a mismatch fails
`npm test` before it can reach a release.

```sh
npm test
npm run build
```

Merge the release commit, then create and push the tag:

```sh
git tag v2.5.0
git push origin v2.5.0
```

The workflow can also be run manually from the Actions tab. Manual runs publish
the manifest version from the selected ref and do not require a tag.

> **Manual runs skip the version guard.** The tag-matches-manifest check is
> conditioned on the event being a tag push, so a `workflow_dispatch` run
> publishes whatever version the selected ref's `manifest.json` contains, with
> no cross-check. Dispatching from a work-in-progress branch will submit that
> branch's version to the Chrome Web Store.

## Troubleshooting

### `Permission 'iam.serviceAccounts.getAccessToken' denied`

The workflow reached Google but could not impersonate the service account. The
OIDC exchange itself already succeeded, so the pool and provider are fine — the
problem is the service-account binding. Two causes, in order of likelihood:

1. **The binding is missing.** Run the first check in
   [Verify the setup](#verify-the-setup). An empty policy confirms it, and the
   `add-iam-policy-binding` command fixes it.
2. **The binding is too new.** IAM changes take several minutes to propagate.
   Retrying about twenty seconds after creating the binding still fails;
   allowing roughly five minutes succeeds.

The message ends with "(or it may not exist)", which also covers a deleted
service account or a disabled `iamcredentials.googleapis.com`. Both are covered
by the verification checks.

### Retrying a failed release

Re-run the existing run rather than re-tagging. The run is already attached to
the tag, so a re-run picks up the corrected IAM state without touching git
history:

```sh
gh run rerun RUN_ID
gh run watch RUN_ID --exit-status
```

Deleting and re-pushing the tag is never necessary and rewrites a published
ref. Only build a new tag when the code or version actually changes.

### Confirming what the store received

A successful run ends with the submission state from the store:

```json
{
  "itemId": "bhjkadebkpcekfbjkkmcjhhlfidajfmi",
  "state": "PENDING_REVIEW"
}
```

`PENDING_REVIEW` means the upload was accepted and the item is queued for
Google's review; it publishes automatically once approved. The built ZIP is
also retained as a workflow artifact for 30 days, so a failed publish never
requires a rebuild to submit manually:

```sh
gh run download RUN_ID
```

Refer to Google's [deployment-pipeline federation guide][google-wif] and the
[`google-github-actions/auth` setup][google-auth] for more background.

[console-api-library]: https://console.cloud.google.com/apis/library
[console-dashboard]: https://console.cloud.google.com/home/dashboard
[console-service-accounts]: https://console.cloud.google.com/iam-admin/serviceaccounts
[console-wif]: https://console.cloud.google.com/iam-admin/workload-identity-pools
[cws-service-account]: https://developer.chrome.com/docs/webstore/service-accounts
[gcloud-cli]: https://cloud.google.com/sdk/docs/install
[google-auth]: https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account
[google-wif]: https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
