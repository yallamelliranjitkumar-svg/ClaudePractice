(function () {
  "use strict";

  // DEMO LOGIN ONLY. This is a static page with no server, so these credentials are visible
  // to anyone who opens the page source. Do not rely on this to protect real data.
  var DEMO_USERNAME = "admin";
  var DEMO_PASSWORD = "physician123";

  var STORAGE_KEY = "nonstaff-physician-directory:v1";

  var SPECIALTIES = [
    "Anesthesiology", "Cardiology", "Dermatology", "Emergency Medicine", "Endocrinology",
    "Family Medicine", "Gastroenterology", "General Surgery", "Internal Medicine", "Neurology",
    "Obstetrics & Gynecology", "Oncology", "Ophthalmology", "Orthopedics", "Pediatrics",
    "Psychiatry", "Pulmonology", "Radiology", "Urology", "Other"
  ];

  var screens = {
    login: document.getElementById("screen-login"),
    menu: document.getElementById("screen-menu"),
    insert: document.getElementById("screen-insert"),
    find: document.getElementById("screen-find"),
    record: document.getElementById("screen-record")
  };
  var logoutBtn = document.getElementById("logout-btn");

  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");

  var formPerson = document.getElementById("form-person");
  var formAddress = document.getElementById("form-address");
  var formPhone = document.getElementById("form-phone");
  var insertDone = document.getElementById("insert-done");
  var phoneFormError = document.getElementById("phone-form-error");

  var findForm = document.getElementById("find-form");
  var findStatus = document.getElementById("find-status");
  var resultsEl = document.getElementById("results");

  var providers = loadProviders();

  // Draft of the provider being inserted; only written to storage after the last step is saved.
  var draft = null;
  var saved = { person: false, address: false, phone: false };

  /* ---------- storage ---------- */

  function loadProviders() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function persistProviders() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- screens ---------- */

  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = key !== name;
    });
    logoutBtn.hidden = name === "login";
  }

  function focusFirst(container) {
    var first = container.querySelector("input:not([type=hidden]), select");
    if (first) first.focus();
  }

  /* ---------- validation helpers ---------- */

  function clearErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach(function (p) {
      p.hidden = true;
      p.textContent = "";
    });
    Array.prototype.forEach.call(form.elements, function (field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function fieldError(form, name, message) {
    var p = form.querySelector('[data-error-for="' + name + '"]');
    if (p) {
      p.textContent = message;
      p.hidden = false;
    }
    form.elements[name].setAttribute("aria-invalid", "true");
  }

  // errors: [[fieldName, message], ...]. Shows them all and focuses the first invalid field.
  function reportErrors(form, errors) {
    clearErrors(form);
    errors.forEach(function (e) { fieldError(form, e[0], e[1]); });
    if (errors.length) form.elements[errors[0][0]].focus();
    return errors.length === 0;
  }

  function value(form, name) {
    return form.elements[name].value.trim();
  }

  function isPhoneLike(text) {
    return /^[\d\s()+.\-]+$/.test(text) && text.replace(/\D/g, "").length >= 7;
  }

  /* ---------- step handling for the insert flow ---------- */

  function setLocked(form, locked) {
    form.querySelector("fieldset").disabled = locked;
    var saveBtn = form.querySelector("[data-save]");
    var editBtn = form.querySelector("[data-edit]");
    saveBtn.hidden = locked;
    if (editBtn) editBtn.hidden = !locked;
  }

  function resetInsert() {
    draft = { address: {} };
    saved = { person: false, address: false, phone: false };
    [formPerson, formAddress, formPhone].forEach(function (form) {
      form.reset();
      clearErrors(form);
      setLocked(form, false);
    });
    phoneFormError.hidden = true;
    formAddress.hidden = true;
    formPhone.hidden = true;
    insertDone.hidden = true;
  }

  function startInsert() {
    resetInsert();
    show("insert");
    focusFirst(formPerson);
  }

  function revealAfterSave(nextForm) {
    if (nextForm.hidden) {
      nextForm.hidden = false;
      focusFirst(nextForm);
    }
    nextForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  formPerson.addEventListener("submit", function (e) {
    e.preventDefault();
    var pid = value(formPerson, "pid");
    var errors = [];

    if (!pid) errors.push(["pid", "PID is required."]);
    else if (providers.some(function (p) { return p.pid.toLowerCase() === pid.toLowerCase(); })) {
      errors.push(["pid", "A provider with this PID already exists."]);
    }
    if (!value(formPerson, "firstName")) errors.push(["firstName", "First name is required."]);
    if (!value(formPerson, "lastName")) errors.push(["lastName", "Last name is required."]);
    if (!value(formPerson, "specialty")) errors.push(["specialty", "Please select a speciality."]);
    if (!reportErrors(formPerson, errors)) return;

    draft.pid = pid;
    draft.firstName = value(formPerson, "firstName");
    draft.middleInitial = value(formPerson, "middleInitial").toUpperCase();
    draft.lastName = value(formPerson, "lastName");
    draft.specialty = value(formPerson, "specialty");
    saved.person = true;
    setLocked(formPerson, true);
    revealAfterSave(formAddress);
  });

  formAddress.addEventListener("submit", function (e) {
    e.preventDefault();
    var errors = [];
    var pincode = value(formAddress, "pincode");

    if (!value(formAddress, "line1")) errors.push(["line1", "Address first line is required."]);
    if (!value(formAddress, "city")) errors.push(["city", "City is required."]);
    if (!pincode) errors.push(["pincode", "Pincode is required."]);
    else if (!/^[A-Za-z0-9][A-Za-z0-9 \-]{2,9}$/.test(pincode)) {
      errors.push(["pincode", "Enter a valid pincode (3 to 10 letters or digits)."]);
    }
    if (!value(formAddress, "state")) errors.push(["state", "State is required."]);
    if (!reportErrors(formAddress, errors)) return;

    draft.address = {
      line1: value(formAddress, "line1"),
      city: value(formAddress, "city"),
      pincode: pincode,
      state: value(formAddress, "state")
    };
    saved.address = true;
    setLocked(formAddress, true);
    revealAfterSave(formPhone);
  });

  formPhone.addEventListener("submit", function (e) {
    e.preventDefault();
    var errors = [];
    var phone = value(formPhone, "phone");
    var fax = value(formPhone, "fax");

    if (!phone) errors.push(["phone", "Phone number is required."]);
    else if (!isPhoneLike(phone)) errors.push(["phone", "Enter a valid phone number."]);
    if (fax && !isPhoneLike(fax)) errors.push(["fax", "Enter a valid fax number, or leave it blank."]);
    if (!reportErrors(formPhone, errors)) return;

    phoneFormError.hidden = true;
    if (!saved.person || !saved.address) {
      phoneFormError.textContent = "Please save the sections above before saving the phone and fax numbers.";
      phoneFormError.hidden = false;
      return;
    }

    var record = {
      pid: draft.pid,
      firstName: draft.firstName,
      middleInitial: draft.middleInitial,
      lastName: draft.lastName,
      specialty: draft.specialty,
      address: draft.address,
      phone: phone,
      fax: fax
    };

    providers.push(record);
    if (!persistProviders()) {
      providers.pop();
      phoneFormError.textContent = "Could not save: browser storage is unavailable or full.";
      phoneFormError.hidden = false;
      return;
    }

    saved.phone = true;
    // Once the provider is stored, the earlier sections can no longer be edited.
    [formPerson, formAddress, formPhone].forEach(function (form) {
      form.querySelector("fieldset").disabled = true;
      form.querySelectorAll("[data-save], [data-edit]").forEach(function (b) { b.hidden = true; });
    });
    document.getElementById("insert-done-msg").textContent =
      fullName(record) + " (PID " + record.pid + ") has been added to the directory.";
    insertDone.hidden = false;
    insertDone.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Edit buttons reopen a saved step (only until the provider is finally stored).
  [formPerson, formAddress].forEach(function (form) {
    form.querySelector("[data-edit]").addEventListener("click", function () {
      setLocked(form, false);
      focusFirst(form);
      if (form === formPerson) saved.person = false;
      if (form === formAddress) saved.address = false;
    });
  });

  document.getElementById("insert-another").addEventListener("click", startInsert);

  /* ---------- find ---------- */

  // The record screen lists these in order. `group` means the value lives under p.address.
  // PID is the record's identifier, so it is shown but cannot be deleted on its own.
  var FIELD_DEFS = [
    { key: "pid", label: "PID", fixed: true },
    { key: "firstName", label: "First name" },
    { key: "middleInitial", label: "Middle initial" },
    { key: "lastName", label: "Last name" },
    { key: "specialty", label: "Speciality" },
    { key: "line1", label: "Address first line", group: "address" },
    { key: "city", label: "City", group: "address" },
    { key: "pincode", label: "Pincode", group: "address" },
    { key: "state", label: "State", group: "address" },
    { key: "phone", label: "Phone number" },
    { key: "fax", label: "Fax number" }
  ];

  var lastQuery = "";   // so "Back to results" can re-run the search that led to a record
  var openPid = null;   // PID of the record currently shown on the record screen

  var recordName = document.getElementById("record-name");
  var recordFields = document.getElementById("record-fields");
  var recordStatus = document.getElementById("record-status");

  // Name as typed, without a placeholder. Used for searching.
  function nameParts(p) {
    return [p.firstName, p.middleInitial ? p.middleInitial + "." : "", p.lastName]
      .filter(Boolean).join(" ");
  }

  // Name for display. A record can lose its name fields, so fall back to a placeholder.
  function fullName(p) {
    return nameParts(p) || "(no name on record)";
  }

  function addressLine(p) {
    var a = p.address;
    return [a.line1, a.city, [a.state, a.pincode].filter(Boolean).join(" ")]
      .filter(Boolean).join(", ") || "not provided";
  }

  function getField(p, def) {
    return (def.group ? p[def.group][def.key] : p[def.key]) || "";
  }

  function setField(p, def, val) {
    if (def.group) p[def.group][def.key] = val;
    else p[def.key] = val;
  }

  function findProvider(pid) {
    return providers.filter(function (p) { return p.pid === pid; })[0];
  }

  function el(tag, text, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderResult(p) {
    var li = el("li", undefined, "result-card");
    li.appendChild(el("h3", fullName(p)));
    li.appendChild(el("p", "PID: " + p.pid));
    if (p.specialty) li.appendChild(el("p", p.specialty, "muted"));
    li.appendChild(el("p", addressLine(p)));
    li.appendChild(el("p", "Phone: " + (p.phone || "not provided")));
    li.appendChild(el("p", "Fax: " + (p.fax || "not provided")));

    var open = el("button", "Open record", "btn small");
    open.type = "button";
    open.addEventListener("click", function () { openRecord(p.pid); });
    li.appendChild(open);
    return li;
  }

  function normalize(text) {
    return text.toLowerCase().replace(/[.\s]+/g, " ").trim();
  }

  function search(query) {
    var q = normalize(query);
    return providers.filter(function (p) {
      if (p.pid.toLowerCase() === query.toLowerCase()) return true;
      var full = normalize(nameParts(p));
      var reversed = normalize([p.lastName, p.firstName, p.middleInitial].filter(Boolean).join(" "));
      return full.indexOf(q) !== -1 || reversed.indexOf(q) !== -1;
    });
  }

  // `notice` is an optional message (for example "Provider deleted.") shown before the result count.
  function runSearch(query, notice) {
    lastQuery = query;
    resultsEl.textContent = "";

    if (!query) {
      findStatus.textContent = notice || "Enter a PID or a name to search.";
      return;
    }
    var matches = search(query);
    var summary = matches.length === 0
      ? "No provider found for \"" + query + "\"."
      : matches.length + (matches.length === 1 ? " provider found." : " providers found.");
    findStatus.textContent = notice ? notice + " " + summary : summary;
    matches.forEach(function (p) { resultsEl.appendChild(renderResult(p)); });
  }

  findForm.addEventListener("submit", function (e) {
    e.preventDefault();
    runSearch(value(findForm, "query"));
  });

  function startFind() {
    findForm.reset();
    lastQuery = "";
    findStatus.textContent = "";
    resultsEl.textContent = "";
    show("find");
    findForm.elements.query.focus();
  }

  /* ---------- record: view, delete a field, delete the provider ---------- */

  function renderRecord() {
    var p = findProvider(openPid);
    if (!p) { backToResults(); return; }

    recordName.textContent = fullName(p);
    recordFields.textContent = "";
    FIELD_DEFS.forEach(function (def) {
      var val = getField(p, def);
      var row = el("li", undefined, "record-row");
      row.appendChild(el("span", def.label, "record-label"));
      row.appendChild(el("span", val || "not provided", val ? "record-value" : "record-value muted"));
      if (!def.fixed && val) {
        var del = el("button", "Delete", "btn small danger");
        del.type = "button";
        del.setAttribute("aria-label", "Delete " + def.label);
        del.addEventListener("click", function () { deleteField(p.pid, def); });
        row.appendChild(del);
      }
      recordFields.appendChild(row);
    });
  }

  function openRecord(pid) {
    openPid = pid;
    recordStatus.textContent = "";
    renderRecord();
    show("record");
    window.scrollTo(0, 0);
  }

  function backToResults(notice) {
    openPid = null;
    show("find");
    runSearch(lastQuery, notice);
  }

  function deleteField(pid, def) {
    var p = findProvider(pid);
    if (!p) return;
    if (!window.confirm("Delete the " + def.label.toLowerCase() + " (\"" + getField(p, def) + "\") for " + fullName(p) + "?")) return;

    var previous = getField(p, def);
    setField(p, def, "");
    if (!persistProviders()) {
      setField(p, def, previous);
      recordStatus.textContent = "Could not delete: browser storage is unavailable or full.";
    } else {
      recordStatus.textContent = def.label + " deleted.";
    }
    renderRecord();
  }

  function deleteProvider() {
    var p = findProvider(openPid);
    if (!p) return;
    if (!window.confirm("Permanently delete " + fullName(p) + " (PID " + p.pid + ")? This cannot be undone.")) return;

    var index = providers.indexOf(p);
    providers.splice(index, 1);
    if (!persistProviders()) {
      providers.splice(index, 0, p);
      recordStatus.textContent = "Could not delete: browser storage is unavailable or full.";
      return;
    }
    backToResults("Provider " + p.pid + " was deleted.");
  }

  document.getElementById("record-delete").addEventListener("click", deleteProvider);
  document.getElementById("record-back").addEventListener("click", function () { backToResults(); });

  /* ---------- login / navigation ---------- */

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = loginForm.elements.username.value.trim() === DEMO_USERNAME &&
             loginForm.elements.password.value === DEMO_PASSWORD;
    if (!ok) {
      loginError.hidden = false;
      loginForm.elements.password.value = "";
      loginForm.elements.password.focus();
      return;
    }
    loginError.hidden = true;
    loginForm.reset();
    show("menu");
  });

  logoutBtn.addEventListener("click", function () {
    resetInsert();
    findForm.reset();
    lastQuery = "";
    openPid = null;
    resultsEl.textContent = "";
    findStatus.textContent = "";
    show("login");
    loginForm.elements.username.focus();
  });

  document.getElementById("menu-insert").addEventListener("click", startInsert);
  document.getElementById("menu-find").addEventListener("click", startFind);
  document.querySelectorAll("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () { show("menu"); });
  });

  /* ---------- init ---------- */

  var specialtySelect = document.getElementById("specialty");
  SPECIALTIES.forEach(function (name) {
    var opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    specialtySelect.appendChild(opt);
  });

  resetInsert();
  show("login");
  loginForm.elements.username.focus();
})();
