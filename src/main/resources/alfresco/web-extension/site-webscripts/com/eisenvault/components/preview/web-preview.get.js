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

function pdfjsUpgradeAlfresco52CopyUserPermissions(user)
{
   var copy = {}, key;
   if (!user)
   {
      return null;
   }
   for (key in user)
   {
      copy[key] = (user[key] === true || String(user[key]).toLowerCase() === "true");
   }
   return copy;
}

function pdfjsUpgradeAlfresco52LoadUserPermissions(nodeRef)
{
   if (!nodeRef)
   {
      return null;
   }
   try
   {
      var uri = "/slingshot/doclib2/node/" + String(nodeRef).replace("://", "/");
      var result = remote.connect("alfresco").get(uri);
      if (result.status != 200)
      {
         return null;
      }
      var data = jsonUtils.toObject(result.response);
      var user = data && data.item && data.item.node && data.item.node.permissions
         ? data.item.node.permissions.user
         : null;
      return pdfjsUpgradeAlfresco52CopyUserPermissions(user);
   }
   catch (e)
   {
      return null;
   }
}

function pdfjsUpgradeAlfresco52AttachPermissions()
{
   if (!model.widgets || !pdfjsUpgradeAlfresco52IsEnabled())
   {
      return;
   }

   var perms = pdfjsUpgradeAlfresco52LoadUserPermissions(model.nodeRef);
   if (!perms)
   {
      return;
   }

   for (var i = 0; i < model.widgets.length; i++)
   {
      var widget = model.widgets[i];
      if (widget.id == "WebPreview" && widget.options)
      {
         widget.options.userPermissions = perms;
      }
   }
}

pdfjsUpgradeAlfresco52PrependPlugin();
pdfjsUpgradeAlfresco52AttachPermissions();
