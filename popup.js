/** RegExp to detect a Funnelback URL */
var FUNNELBACK_URL_RE = new RegExp(/\/search\.(html|json|xml)/);
/** RegExp to extract the profile parameter from the URL */
var FUNNELBACK_PROFILE_RE = new RegExp(/([&?])profile=([^&]+)/);

document.addEventListener("DOMContentLoaded", function() {

  getCurrentTab( function(tab) {
    var match = FUNNELBACK_URL_RE.exec(tab.url);

    // Is it a Funnelback URL?
    if (match) {

      showControls(true);
      setupViewSwitcher(match[1]);

      // Do we have a profile parameter in the URL?
      var profileMatch = FUNNELBACK_PROFILE_RE.exec(tab.url);
      if (profileMatch) {

        var isPreview = /_preview$/.test(profileMatch[2]);
        var profileName = profileMatch[2].replace(/_preview$/, "");

        document.getElementById("profile-name").innerText = profileName;
        setupProfileSwitcher(isPreview, profileName);

      } else {
        setupProfileSwitcher(isPreview);
      }

    } else {
      showControls(false);
    }
  });
});


/**
 * Get the current tab and call a callback
 * @param callback Callback to call with the current tab
 */
function getCurrentTab(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    callback(tabs[0]);
  });
}

/**
 * Show or hide the Funnelback specific controls
 * @param show true to show controls, false to hide them
 */
function showControls(show) {
  if (show) {
    document.getElementById("funnelback-controls").style.display = "block";
    document.getElementById("funnelback-not-detected").style.display = "none";
  } else {
    document.getElementById("funnelback-controls").style.display = "none";
    document.getElementById("funnelback-not-detected").style.display = "block";
  }
}

/**
 * Setup the view switcher click handlers and disable
 * the button with the currently active view
 * @param currentView Current view (e.g. "html", "json", "xml")
 */
function setupViewSwitcher(currentView) {
  var elements = document.getElementsByClassName("view-switch");

  for (var i=0; i<elements.length; i++) {
    var element = elements[i];

    // Click handler to switch view
    element.addEventListener("click", function(evt) {
      switchView(evt.target.getAttribute("data-view"));
    });

    // Disable currently used view
    if (element.getAttribute("data-view") === currentView) {
      element.disabled = true;
    }
  }
}

/**
 * Setup the profile switcher click handlers, disable the current
 * profile and show the `_default` button if the profile is not the
 * default one
 * @param isPreview Wether the profile currently display is the preview one
 * @param profile Optional, name of the current profile
 */
function setupProfileSwitcher(isPreview, profile) {
  var elements = document.getElementsByClassName("profile-switch");

  for (var i=0; i<elements.length; i++) {
    var element = elements[i];

    // If we have a profile, we can show the live/preview buttons
    if (profile) {
      element.parentElement.style.display = "inline";

      if (element.getAttribute("data-profile") === "_preview" && isPreview) {
        // Current profile is preview, disable the preview button
        element.disabled = true;
      } else if (element.getAttribute("data-profile") === "" && !isPreview) {
        // Current profile is live, disable the live button
        element.disabled = true;
      }

      // Click handler to switch profile
      element.addEventListener("click", function(evt) {
        switchProfile(profile + evt.target.getAttribute("data-profile"))
      });

    } else {
      element.parentElement.style.display = "none";
    }
  }

  var element = document.getElementById("profile-reset")
  element.addEventListener("click", function(evt) {
    switchProfile("_default");
  });

  // If we are already viewing the default profile, hide the button
  if (profile && profile === "_default" || profile === "_default_preview") {
    element.parentElement.style.display = "none";
  }
}

/**
 * Switch the view by updating `search.(html|json|xml)` in the URL
 * @param view View to switch to
 */
function switchView(view) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url.replace(FUNNELBACK_URL_RE, "/search." + view);
    chrome.tabs.update(tab.id, {url: url});

    window.close();
  });
}

/**
 * Switch the profile by updating the `profile` parameter in the URL
 * @param profile Profile to switch to
 */
function switchProfile(profile) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url.replace(FUNNELBACK_PROFILE_RE, "$1profile=" + profile);
    if (!FUNNELBACK_PROFILE_RE.test(url)) {
      // URL didn"t contain profile. Naively append it (that won"t work
      // properly with fragments, or if the profile is the sole parameter
      // as we should prepend it with "?" rather than "&")
      url += "&profile=" + profile;
    }
    chrome.tabs.update(tab.id, {url: url});

    window.close();
  });
}

// vim: set expandtab ts=2 sw=2 sts=2 :
