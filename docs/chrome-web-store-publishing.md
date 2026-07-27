# Chrome Web Store publishing

Pushing a tag that matches the manifest version runs
`.github/workflows/publish-chrome.yml`. For example, manifest version `2.0.1`
must be released with tag `v2.0.1`.

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

### Configure Workload Identity Federation

Workload Identity Federation lets GitHub exchange its short-lived OIDC token
for a short-lived Google access token. It avoids downloading or storing a
service-account key.

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
WIF_PROVIDER_ID="extentie"
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
Store service account:

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
projects/123456789/locations/global/workloadIdentityPools/github-actions/providers/extentie
```

IAM changes can take several minutes to propagate. If the first workflow run
fails to exchange its OIDC token, wait five minutes and retry it. If a pool or
provider with the chosen ID already exists, reuse it or choose a different ID
instead of recreating it.

Refer to Google's [deployment-pipeline federation guide][google-wif] and the
[`google-github-actions/auth` setup][google-auth] for more background.

## GitHub environment

Create an environment named `chrome-web-store` in the GitHub repository. Add
these environment variables:

| Variable | Value |
| --- | --- |
| `CWS_EXTENSION_ID` | `bhjkadebkpcekfbjkkmcjhhlfidajfmi` |
| `CWS_PUBLISHER_ID` | Publisher ID from Developer Dashboard → Publisher → Settings |
| `GCP_SERVICE_ACCOUNT` | Service account email |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name, beginning with `projects/` |

No Google credential needs to be stored as a GitHub secret. The workflow
requests a short-lived access token through GitHub's OIDC identity.

Optionally add required reviewers or tag restrictions to the
`chrome-web-store` environment. With no protection rules, matching version tags
publish automatically.

## Release

Update `manifest.json`, merge the release commit, then create and push the tag:

```sh
git tag v2.0.1
git push origin v2.0.1
```

The workflow can also be run manually from the Actions tab. Manual runs publish
the manifest version from the selected ref and do not require a tag.

[cws-service-account]: https://developer.chrome.com/docs/webstore/service-accounts
[gcloud-cli]: https://cloud.google.com/sdk/docs/install
[google-auth]: https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account
[google-wif]: https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
