function pdfjsUpgradeAlfresco52IsEnabled()
{
   try
   {
      var section = config.scoped["pdfjs-upgrade-alfresco52-share-amp"];
      if (section && section.getChildValue)
      {
         var value = section.getChildValue("enabled");
         if (value != null && String(value).toLowerCase() === "false")
         {
            return false;
         }
      }
   }
   catch (e)
   {
      // Default to enabled if Share config cannot be read.
   }
   return true;
}

function pdfjsUpgradeAlfresco52PrependPlugin()
{
   if (!model.widgets || !pdfjsUpgradeAlfresco52IsEnabled())
   {
      return;
   }

   var prefix = '{"attributes":{"mimeType":"application/pdf"},"plugins":[{"name":"pdfjs-upgrade-alfresco52-share-amp","attributes":{}}]}';

   for (var i = 0; i < model.widgets.length; i++)
   {
      var widget = model.widgets[i];
      if (widget.id != "WebPreview" || !widget.options)
      {
         continue;
      }

      var raw = widget.options.pluginConditions;
      if (raw == null || raw === "")
      {
         widget.options.pluginConditions = "[" + prefix + "]";
         continue;
      }

      // jsonUtils.toJSONString() returns a java.lang.String. In Rhino, typeof is
      // "object", so treating non-JS-strings as empty wiped every stock previewer.
      var json = String(raw);
      if (json.indexOf("pdfjs-upgrade-alfresco52-share-amp") != -1)
      {
         continue;
      }

      if (json.charAt(0) == "[")
      {
         if (json.length < 2 || json.charAt(1) == "]")
         {
            widget.options.pluginConditions = "[" + prefix + "]";
         }
         else
         {
            widget.options.pluginConditions = "[" + prefix + "," + json.substring(1);
         }
      }
   }
}

pdfjsUpgradeAlfresco52PrependPlugin();
