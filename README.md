# pdfjs-upgrade-alfresco52-share-amp

Share AMP for Alfresco Community 5.2 that replaces the Document Details PDF previewer with Mozilla PDF.js 6.3.289.

This repository is a single Share AMP. It does not produce a Repository AMP and is not an All-In-One SDK runner.

Native `application/pdf` files are shown in an iframe hosting Mozilla's unmodified standalone viewer. The PDF bytes are requested through Share's existing authenticated proxy. Alfresco's bundled PDF.js under `/share/res/components/preview/pdfjs/` is not replaced.

## Alfresco 5.2 preview extension points used

Inspected against Alfresco Share **5.2.e**, not later ACS APIs.

| Role | Stock 5.2.e location |
| --- | --- |
| MIME-to-plugin mapping | `WEB-INF/classes/alfresco/site-webscripts/org/alfresco/components/preview/web-preview.get.config.xml` |
| Widget model (nodeRef, name, mimeType, size, thumbnails) | `web-preview.get.js` |
| Page markup / JS includes | `web-preview.get.html.ftl` plus `include/web-preview-js-dependencies.lib.ftl` |
| Plugin runtime | `/share/res/components/preview/web-preview.js` (`Alfresco.WebPreview.prototype.Plugins`) |
| Legacy PDF renderer | `/share/res/components/preview/PdfJs.js` and `/share/res/components/preview/pdfjs/` |

`application/pdf` is mapped to plugin `PdfJs`. Office formats that only have a `pdf` thumbnail keep using that stock plugin.

Authenticated content URL, from `web-preview.js` `getContentUrl()`:

```
{protocol}//{host}{URL_CONTEXT}proxy/{proxy}/{api}/node/{store}/{id}/content/{encodedName}?c=force&noCache={ts}&a=false
```

That is same-origin `/share/proxy/alfresco/api/node/...` and uses the Share session. This AMP reuses that helper and does not add a repository endpoint.

Minimum override: a Surf customization on `org.alfresco.components.preview` that prepends plugin `pdfjs-upgrade-alfresco52-share-amp` for `mimeType=application/pdf`, plus a YUI plugin that renders the iframe. Stock `web-preview.get.config.xml` is not copied or replaced.

## Build

```
mvn clean package -DskipTests
```

Expected artifact:

```
target/pdfjs-upgrade-alfresco52-share-amp-1.0.0.amp
```

## Installation

Install into Share only, not `alfresco.war`:

```
java -jar alfresco-mmt.jar install \
    pdfjs-upgrade-alfresco52-share-amp-1.0.0.amp \
    /path/to/tomcat/webapps/share.war \
    -force
```

### Tomcat cleanup

Stop Tomcat first. After MMT install, remove generated Share exploded/work files so the AMP is picked up. Do not delete Alfresco content, database, Solr indexes, or `alf_data`.

Typical paths:

```
/path/to/tomcat/webapps/share
/path/to/tomcat/work/Catalina/localhost/share
```

Leave `share.war` in place. Start Tomcat.

If the previewer does not change, open Share Admin Tools > Module Deployment, confirm `pdfjs-upgrade-alfresco52-share-amp` is deployed, and apply changes.

## Verify installation

```
java -jar alfresco-mmt.jar list /path/to/tomcat/webapps/share.war
```

The list must include `pdfjs-upgrade-alfresco52-share-amp` version `1.0.0`.

In the browser, open a PDF in Document Details and confirm:

* the preview iframe `src` is `/share/res/pdfjs-upgrade-alfresco52-share-amp/modern-pdfjs/web/viewer.html?file=...`
* the `file` query value is the Share proxy content URL, not a public or repository-direct URL
* `/share/res/components/preview/pdfjs/pdf.js` is not used for that PDF

## Disable without uninstalling

In the AMP's `share-config-custom.xml` (or a later Share config that overrides condition `pdfjs-upgrade-alfresco52-share-amp`):

```
<config evaluator="string-compare" condition="pdfjs-upgrade-alfresco52-share-amp">
    <enabled>false</enabled>
</config>
```

Restart Share. `application/pdf` then falls through to Alfresco 5.2 `PdfJs`.

Alternatively undeploy the Surf module `pdfjs-upgrade-alfresco52-share-amp` in Module Deployment.

## Rollback / uninstall

```
java -jar alfresco-mmt.jar uninstall \
    pdfjs-upgrade-alfresco52-share-amp \
    /path/to/tomcat/webapps/share.war
```

Then remove the exploded Share webapp and work directory as above, and restart Tomcat. The original Alfresco 5.2 PDF.js previewer returns.

## PDF.js upgrades

Vendor files live in:

```
src/main/resources/META-INF/resources/pdfjs-upgrade-alfresco52-share-amp/modern-pdfjs/
```

The Alfresco integration is the sibling JS/CSS in that same module namespace plus the Surf webscripts. To upgrade PDF.js, replace the `modern-pdfjs` directory with a newer official `pdfjs-*-dist.zip` (`build/` and `web/` layout must stay the same), rebuild the AMP, and regression-test. Do not edit files under `modern-pdfjs/build` or `modern-pdfjs/web`.

Current bundled version: **6.3.289** (`PDFJS_VERSION.txt`). No Mozilla source files were modified.

## Security and caching

* No usernames, passwords, tickets, or public share links are placed in the viewer URL.
* Users without read permission receive the same 401/403 the Share proxy already returns.
* `getContentUrl()` includes `noCache={timestamp}` and the node id, so a new version does not keep an old PDF in the browser cache.
* PDF.js 6 ships a viewer-level Content-Security-Policy in `viewer.html` (`script-src 'self' 'wasm-unsafe-eval'`, `worker-src 'self' blob:`, `connect-src *`). That policy is scoped to the iframe. Stock Alfresco 5.2 Share does not set a global CSP that blocks this. If a reverse proxy adds a strict CSP, it must allow those iframe directives; do not loosen headers for the whole Share app unless that proxy policy blocks workers or WASM.

## Test checklist

PDF rendering

* [ ] normal PDF
* [ ] large PDF
* [ ] scanned / image-only PDF
* [ ] many pages
* [ ] Oracle ERP export that fails in Alfresco 5.2 PdfJs
* [ ] embedded fonts
* [ ] landscape PDF

Alfresco security

* [ ] admin can preview
* [ ] user with read permission can preview
* [ ] user without read permission cannot fetch the proxy content URL even if they know it

Versions

* [ ] upload new version, preview is the new file
* [ ] previous version preview where Share supports it

Filenames

* [ ] spaces, `&`, `+`, `%`, `#`, apostrophes, parentheses, Unicode

Browsers

* [ ] Chrome
* [ ] Edge
* [ ] Firefox
* [ ] Safari

Internet Explorer is not supported. On IE the plugin reports unsupported and Share falls back to the original PdfJs plugin.

Other preview types (Word, Excel, PowerPoint, images, text, video, audio) must remain unchanged. Document Details actions (download, edit properties, permissions, versions, comments, workflows, favourites, likes, share, custom EisenVault actions) must remain unchanged.

## License

This project is licensed under the GNU Lesser General Public License v3.0. See [LICENSE](LICENSE). The GNU GPL v3 text that LGPL v3 incorporates is in [COPYING](COPYING).

Bundled Mozilla PDF.js remains under the Apache License 2.0. Its license files are under `src/main/resources/META-INF/resources/pdfjs-upgrade-alfresco52-share-amp/modern-pdfjs/`.
