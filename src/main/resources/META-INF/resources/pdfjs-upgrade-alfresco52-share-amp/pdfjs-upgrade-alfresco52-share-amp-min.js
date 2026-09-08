/**
 * Alfresco Share 5.2 WebPreview plugin that embeds Mozilla PDF.js in an iframe.
 * The plugin itself is ES5 so it can load beside YUI. PDF.js runs only inside the iframe.
 */
(function()
{
   var $html = Alfresco.util.encodeHTML;
   var PLUGIN_NAME = "pdfjs-upgrade-alfresco52-share-amp";

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
            return this._fallbackMarkup(false);
         }

         var context = Alfresco.constants.URL_CONTEXT || "/share/";
         if (context.charAt(context.length - 1) !== "/")
         {
            context = context + "/";
         }
         var viewerUrl = context + "res/pdfjs-upgrade-alfresco52-share-amp/modern-pdfjs/web/viewer.html?file=" + encodeURIComponent(contentUrl);
         var previewerEl = this.wp.getPreviewerElement();
         var heightPx = previewerEl && previewerEl.clientHeight > 100 ? previewerEl.clientHeight : 700;

         var html = "";
         html += '<div class="pdfjs-upgrade-alfresco52-share-amp-preview">';
         html += '<iframe class="pdfjs-upgrade-alfresco52-share-amp-frame" src="' + $html(viewerUrl) + '"';
         html += ' title="' + $html(this.wp.options.name || "PDF") + '"';
         html += ' style="height:' + heightPx + 'px;">';
         html += "</iframe>";
         html += this._fallbackMarkup(true);
         html += "</div>";

         previewerEl.innerHTML = html;
         this._bindIframe(previewerEl);
         return null;
      },

      _fallbackMarkup: function PdfjsUpgradeAlfresco52__fallbackMarkup(hidden)
      {
         var downloadUrl = this.wp.getContentUrl(true);
         var html = '<div class="pdfjs-upgrade-alfresco52-share-amp-fallback"' + (hidden ? ' style="display:none;"' : "") + ">";
         html += "<p>" + $html(this.wp.msg("pdfjs.upgrade.error")) + "</p>";
         html += "<p><a class=\"theme-color-1\" href=\"" + $html(downloadUrl) + "\">";
         html += $html(this.wp.msg("pdfjs.upgrade.download"));
         html += "</a></p></div>";
         return html;
      },

      _bindIframe: function PdfjsUpgradeAlfresco52__bindIframe(container)
      {
         var iframe = YAHOO.util.Dom.getElementsByClassName("pdfjs-upgrade-alfresco52-share-amp-frame", "iframe", container)[0];
         var fallback = YAHOO.util.Dom.getElementsByClassName("pdfjs-upgrade-alfresco52-share-amp-fallback", "div", container)[0];
         if (!iframe)
         {
            return;
         }

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
      }
   };
})();
