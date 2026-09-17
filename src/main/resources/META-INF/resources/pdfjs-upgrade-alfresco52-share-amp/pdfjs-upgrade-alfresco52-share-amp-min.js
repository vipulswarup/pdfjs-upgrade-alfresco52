/**
 * Alfresco Share 5.2 WebPreview plugin that embeds Mozilla PDF.js in an iframe.
 * The plugin itself is ES5 so it can load beside YUI. PDF.js runs only inside the iframe.
 */
(function()
{
   var $html = Alfresco.util.encodeHTML;
   var PLUGIN_NAME = "pdfjs-upgrade-alfresco52-share-amp";
   var ANNOTATION_EDITOR_DISABLE = -1;

   Alfresco.WebPreview.prototype.Plugins[PLUGIN_NAME] = function(wp, attributes)
   {
      this.wp = wp;
      this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
      return this;
   };

   Alfresco.WebPreview.prototype.Plugins[PLUGIN_NAME].prototype =
   {
      attributes: {},

      report: function PdfjsUpgradeAlfresco52_report()
      {
         var mimeType = this.wp.options.mimeType ? String(this.wp.options.mimeType).toLowerCase() : "";
         if (mimeType !== "application/pdf")
         {
            return "pdfjs-upgrade-alfresco52-share-amp skips non-PDF content";
         }
         if (YAHOO.env.ua.ie > 0)
         {
            return this.wp.msg("pdfjs.upgrade.unsupportedBrowser");
         }
      },

      display: function PdfjsUpgradeAlfresco52_display()
      {
         var mimeType = this.wp.options.mimeType ? String(this.wp.options.mimeType).toLowerCase() : "";
         if (mimeType !== "application/pdf")
         {
            throw new Error("pdfjs-upgrade-alfresco52-share-amp is only for application/pdf");
         }

         var contentUrl = this.wp.getContentUrl(false);
         if (!contentUrl)
         {
            if (window.console && console.error)
            {
               console.error(PLUGIN_NAME + ": no authenticated content URL was available for nodeRef " + this.wp.options.nodeRef);
            }
            return this._fallbackMarkup(false, false);
         }

         var context = Alfresco.constants.URL_CONTEXT || "/share/";
         if (context.charAt(context.length - 1) !== "/")
         {
            context = context + "/";
         }
         var viewerUrl = context + "res/pdfjs-upgrade-alfresco52-share-amp/modern-pdfjs/web/viewer.html?file=" + encodeURIComponent(contentUrl);
         var previewerEl = this.wp.getPreviewerElement();
         var heightPx = previewerEl && previewerEl.clientHeight > 100 ? previewerEl.clientHeight : 700;
         var access = this._resolveAccess();

         var html = "";
         html += '<div class="pdfjs-upgrade-alfresco52-share-amp-preview">';
         html += '<iframe class="pdfjs-upgrade-alfresco52-share-amp-frame" src="about:blank"';
         html += ' title="' + $html(this.wp.options.name || "PDF") + '"';
         html += ' style="height:' + heightPx + 'px;">';
         html += "</iframe>";
         html += this._fallbackMarkup(true, access.allowDownload);
         html += "</div>";

         previewerEl.innerHTML = html;
         this._bindIframe(previewerEl, viewerUrl, access);
         return null;
      },

      _fallbackMarkup: function PdfjsUpgradeAlfresco52__fallbackMarkup(hidden, allowDownload)
      {
         var html = '<div class="pdfjs-upgrade-alfresco52-share-amp-fallback"' + (hidden ? ' style="display:none;"' : "") + ">";
         html += "<p>" + $html(this.wp.msg("pdfjs.upgrade.error")) + "</p>";
         if (allowDownload)
         {
            var downloadUrl = this.wp.getContentUrl(true);
            html += "<p><a class=\"theme-color-1\" href=\"" + $html(downloadUrl) + "\">";
            html += $html(this.wp.msg("pdfjs.upgrade.download"));
            html += "</a></p>";
         }
         html += "</div>";
         return html;
      },

      _bindIframe: function PdfjsUpgradeAlfresco52__bindIframe(container, viewerUrl, access)
      {
         var me = this;
         var iframe = YAHOO.util.Dom.getElementsByClassName("pdfjs-upgrade-alfresco52-share-amp-frame", "iframe", container)[0];
         var fallback = YAHOO.util.Dom.getElementsByClassName("pdfjs-upgrade-alfresco52-share-amp-fallback", "div", container)[0];
         if (!iframe)
         {
            return;
         }

         var applyAccess = function(ev)
         {
            var source = ev.detail && ev.detail.source;
            if (!source || source !== iframe.contentWindow || !source.PDFViewerApplicationOptions)
            {
               return;
            }
            me._applyViewerAccess(source.PDFViewerApplicationOptions, access);
         };

         if (this._webViewerLoadedHandler)
         {
            document.removeEventListener("webviewerloaded", this._webViewerLoadedHandler, true);
         }
         this._webViewerLoadedHandler = applyAccess;
         document.addEventListener("webviewerloaded", applyAccess, true);

         YAHOO.util.Event.addListener(iframe, "error", function()
         {
            if (window.console && console.error)
            {
               console.error(PLUGIN_NAME + ": Mozilla PDF.js viewer failed to load");
            }
            if (fallback)
            {
               fallback.style.display = "block";
            }
         });

         iframe.src = viewerUrl;
      },

      _applyViewerAccess: function PdfjsUpgradeAlfresco52__applyViewerAccess(appOptions, access)
      {
         appOptions.set("disablePreferences", true);
         if (!access.allowDownload)
         {
            appOptions.set("supportsDownloading", false);
            appOptions.set("supportsPrinting", false);
         }
         if (!access.allowEdit)
         {
            appOptions.set("annotationEditorMode", ANNOTATION_EDITOR_DISABLE);
         }
      },

      _resolveAccess: function PdfjsUpgradeAlfresco52__resolveAccess()
      {
         var perms = this._getUserPermissions();
         return {
            allowEdit: this._hasWriteAccess(perms),
            allowDownload: this._hasDownloadAccess(perms)
         };
      },

      _getUserPermissions: function PdfjsUpgradeAlfresco52__getUserPermissions()
      {
         var perms = this.wp.options.userPermissions;
         if (perms)
         {
            return perms;
         }
         return this._findUserPermissionsFromPage();
      },

      _findUserPermissionsFromPage: function PdfjsUpgradeAlfresco52__findUserPermissionsFromPage()
      {
         var names = ["Alfresco.DocumentActions", "Alfresco.FolderActions", "Alfresco.DocumentList"];
         var i, j, found, options, item, node, nodeRef;
         if (!Alfresco.util.ComponentManager || !Alfresco.util.ComponentManager.find)
         {
            return null;
         }
         for (i = 0; i < names.length; i++)
         {
            found = Alfresco.util.ComponentManager.find(names[i]) || [];
            for (j = 0; j < found.length; j++)
            {
               options = found[j].options || {};
               item = options.documentDetails && options.documentDetails.item ? options.documentDetails.item : null;
               node = item && item.node ? item.node : null;
               if (node && node.permissions && node.permissions.user)
               {
                  nodeRef = node.nodeRef || item.nodeRef;
                  if (this._sameNodeRef(nodeRef, this.wp.options.nodeRef))
                  {
                     return node.permissions.user;
                  }
               }
            }
         }
         return null;
      },

      _sameNodeRef: function PdfjsUpgradeAlfresco52__sameNodeRef(left, right)
      {
         if (!left || !right)
         {
            return false;
         }
         return String(left).replace("://", "/") === String(right).replace("://", "/");
      },

      _permTrue: function PdfjsUpgradeAlfresco52__permTrue(perms, name)
      {
         if (!perms)
         {
            return false;
         }
         var value = perms[name];
         return value === true || String(value).toLowerCase() === "true";
      },

      _hasWriteAccess: function PdfjsUpgradeAlfresco52__hasWriteAccess(perms)
      {
         return this._permTrue(perms, "Write");
      },

      _hasDownloadAccess: function PdfjsUpgradeAlfresco52__hasDownloadAccess(perms)
      {
         if (!perms)
         {
            return false;
         }
         if (typeof perms.Download !== "undefined")
         {
            return this._permTrue(perms, "Download");
         }
         if (typeof perms.DownloadContent !== "undefined")
         {
            return this._permTrue(perms, "DownloadContent");
         }
         return this._permTrue(perms, "Write") ||
            this._permTrue(perms, "CreateChildren") ||
            this._permTrue(perms, "Delete") ||
            this._permTrue(perms, "ChangePermissions");
      }
   };
})();
