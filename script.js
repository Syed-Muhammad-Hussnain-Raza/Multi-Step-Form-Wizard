const BASIC_DETAILS = 0;
const PASSWORD_CHANGE = 1;
const MY_CART = 2;
const CART_TOTALS = 3;

// Track active step
let activeStep = BASIC_DETAILS;

const steps = document.querySelectorAll(".nav-head .step");
const forms = document.querySelectorAll(".form-step");
const controlNav = document.querySelector(".control-nav");
const formSubmit = document.getElementById("formSubmit");
const btnBack = document.getElementById("back");
const btnContinue = document.getElementById("continue");
const tableRows = document.querySelectorAll("#cart-body .rows");

// Step icon images
const stepImgsInactive = [
  "assets/step-1.png",
  "assets/step-2.png",
  "assets/step-3.png",
  "assets/step-4.png",
];
const stepImgsActive = [
  "assets/step-1-active.png",
  "assets/step-2-active.png",
  "assets/step-3-active.png",
  "assets/step-4-active.png",
];

// Validation helpers
function showError(input, msg) {
  clearError(input);
  input.classList.add("input-error");
  const err = document.createElement("span");
  err.className = "error-msg";
  err.textContent = msg;
  input.closest(".input-section").after(err);
}

// clear errors
function clearError(input) {
  input.classList.remove("input-error");
  const section = input.closest(".input-section");
  const next = section && section.nextElementSibling;
  if (next && next.classList.contains("error-msg")) next.remove();
}

// email validation
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

// phonenumber validation
function isValidPhone(val) {
  return /^\+?[\d\s\-()]{7,15}$/.test(val);
}

// step validator
function validateStep(index) {
  let valid = true;

  // Step 1 — make sure all personal details are filled in correctly
  if (index === BASIC_DETAILS) {
    const fields = [
      { name: "firstName", label: "First Name" },
      { name: "lastName", label: "Last Name" },
      { name: "emailId", label: "Email ID" },
      { name: "userId", label: "User ID" },
      { name: "country", label: "Country" },
      { name: "state", label: "State" },
      { name: "city", label: "City" },
      { name: "phNumber", label: "Phone Number" },
      { name: "referenceCode", label: "Reference Code" },
    ];
    const form = document.getElementById("form1");

    fields.forEach(({ name, label }) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;

      clearError(input);
      const val = input.value.trim();

      if (!val) {
        showError(input, `${label} is required.`);
        valid = false;
        return;
      }
      if (name === "emailId" && !isValidEmail(val)) {
        showError(input, "Enter a valid email address.");
        valid = false;
      }
      if (name === "phNumber" && !isValidPhone(val)) {
        showError(input, "Enter a valid phone number.");
        valid = false;
      }
    });
  }

  // Step 2 — passwords must be filled in and the pairs must match
  if (index === PASSWORD_CHANGE) {
    const cur = document.getElementById("currentPassword");
    const recur = document.getElementById("recurrentPassword");
    const newP = document.getElementById("newPassword");
    const confP = document.getElementById("confirmNewPassword");

    // Clear any stale errors before re-checking
    [cur, recur, newP, confP].forEach(clearError);

    if (!cur.value.trim()) {
      showError(cur, "Current Password is required.");
      valid = false;
    }

    if (!recur.value.trim()) {
      showError(recur, "Please re-enter your current password.");
      valid = false;
    } else if (cur.value && recur.value !== cur.value) {
      showError(recur, "Does not match your current password.");
      valid = false;
    }

    if (!newP.value.trim()) {
      showError(newP, "New Password is required.");
      valid = false;
    } else if (newP.value.length < 6) {
      showError(newP, "Password must be at least 6 characters.");
      valid = false;
    }

    if (!confP.value.trim()) {
      showError(confP, "Please confirm your new password.");
      valid = false;
    } else if (newP.value && confP.value !== newP.value) {
      showError(confP, "Passwords do not match.");
      valid = false;
    }
  }

  // Step 3 — cart must have at least one item before proceeding
  if (index === MY_CART) {
    const rows = document.querySelectorAll("#cart-body .rows");
    if (rows.length === 0) {
      const cartBody = document.getElementById("cart-body");
      let msg = document.getElementById("cart-empty-msg");
      if (!msg) {
        msg = document.createElement("tr");
        msg.id = "cart-empty-msg";
        msg.innerHTML =
          '<td colspan="5" style="text-align:center;color:#c0392b;padding:10px;">Your cart is empty. Add items to continue.</td>';
        cartBody.appendChild(msg);
      }
      valid = false;
    } else {
      // Cart has items — remove the warning if it was showing
      const msg = document.getElementById("cart-empty-msg");
      if (msg) msg.remove();
    }
  }

  return valid;
}

// Core navigation
function goTo(index) {
  // Clamp so we never go out of bounds
  index = Math.max(BASIC_DETAILS, Math.min(CART_TOTALS, index));
  activeStep = index;

  // Show only the target form panel, hide the rest
  forms.forEach((f, i) => {
    f.style.display = i === index ? "block" : "none";
    f.classList.toggle("active", i === index);
  });

  // Swap step icons between active and inactive states
  steps.forEach((s, i) => {
    const img = s.querySelector(".step-img");
    if (img) img.src = i === index ? stepImgsActive[i] : stepImgsInactive[i];
  });

  // No point showing a Back button when you're already on the first step
  btnBack.style.visibility = index === BASIC_DETAILS ? "hidden" : "visible";

  // On the last step, swap the nav for the checkout button and refresh totals
  if (index === CART_TOTALS) {
    controlNav.style.display = "none";
    formSubmit.style.display = "flex";
    updateTotals();
  } else {
    controlNav.style.display = "flex";
    formSubmit.style.display = "none";
  }
}

// Step navigator clicks
steps.forEach((s, i) => {
  s.addEventListener("click", (e) => {
    e.preventDefault();
    if (i < activeStep) goTo(i);
  });
});

// Back and Continue button handlers
btnBack.addEventListener("click", (e) => {
  e.preventDefault();
  if (activeStep > BASIC_DETAILS) goTo(activeStep - 1);
});

btnContinue.addEventListener("click", (e) => {
  e.preventDefault();
  // Don't move forward if the current step has errors
  if (!validateStep(activeStep)) return;
  if (activeStep < CART_TOTALS) goTo(activeStep + 1);
});

// Cart — quantity controls and live price updates
function bindCartRow(row) {
  const addBtn = row.querySelector(".addQuantity");
  const minusBtn = row.querySelector(".minusQuantity");
  const qtyInput = row.querySelector(".productQuantity");
  const totalEl = row.querySelector(".totalQuantityPrice");
  const priceEl = row.querySelector(".productPrice");

  // Read the unit price from the data attribute, fall back to text content
  const getPrice = () =>
    parseInt(priceEl.dataset.price) || parseInt(priceEl.textContent) || 0;

  addBtn.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value) + 1;
    qtyInput.value = qty;
    totalEl.textContent = qty * getPrice();
    updateTotals(); // keep the summary in sync
  });

  minusBtn.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value);
    if (qty > 1) {
      qtyInput.value = qty - 1;
      totalEl.textContent = (qty - 1) * getPrice();
      updateTotals();
    }
  });
}

tableRows.forEach(bindCartRow);

// Remove an item from the cart entirely and recalculate
document.querySelectorAll(".btn-remove").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest("tr").remove();
    updateTotals();
  });
});

// Cart totals — recalculates subtotal and grand total from live DOM
function getCartDetail() {
  const rows = document.querySelectorAll("#cart-body .rows");
  let subtotal = 0;
  const items = [];

  rows.forEach((row) => {
    const name = row.querySelector(".productName")?.textContent.trim() || "";
    const price = parseInt(
      row.querySelector(".productPrice")?.dataset.price || 0,
    );
    const qty = parseInt(row.querySelector(".productQuantity")?.value || 0);
    const lineTotal = price * qty;
    subtotal += lineTotal;
    items.push({ name, price, qty, lineTotal });
  });

  // Update the subtotal display in the DOM
  const subTotalEl = document.getElementById("subTotal");
  if (subTotalEl) subTotalEl.textContent = subtotal.toFixed(2);

  return { items, subtotal };
}

function updateTotals() {
  const { subtotal } = getCartDetail();
  const service =
    parseFloat(document.getElementById("serviceCharges")?.textContent) || 0;
  const totalEl = document.getElementById("totalBill");
  if (totalEl) totalEl.textContent = (subtotal + service).toFixed(2);
}

// Password step — show the eye icon only once the user starts typing
document.querySelectorAll("#form2 .input-section").forEach((wrap) => {
  const input = wrap.querySelector("input");
  const eyeIcon = wrap.querySelector(".eye-toggle");
  if (!input || !eyeIcon) return;

  input.addEventListener("input", () => {
    eyeIcon.style.display = input.value.length > 0 ? "block" : "none";
    clearError(input); // wipe the error as soon as they start fixing it
  });
});

// Same early-clear behaviour for the Basic Details step
document.querySelectorAll("#form1 input").forEach((input) => {
  input.addEventListener("input", () => clearError(input));
});

// Toggle password visibility when the eye icon is clicked
document.querySelectorAll(".showPass").forEach((eyeIcon) => {
  eyeIcon.addEventListener("click", () => {
    const inputEl = eyeIcon.parentNode.querySelector("input");
    if (!inputEl) return;
    inputEl.type = inputEl.type === "password" ? "text" : "password";
  });
});

// Form submission — bundle everything up and POST to the server
document.getElementById("mainForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));
  const payload = {
    personalData: { ...formData },
    cartDetail: getCartDetail(),
  };

  console.log("Submitting payload:", payload);

  try {
    const res = await fetch("http://localhost:3000/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Server returned HTTP " + res.status);

    const data = await res.json();
    if (data) {
      alert("Form submitted successfully!");
      location.reload();
    }
  } catch (err) {
    console.error("Submission failed:", err);
  }
});

goTo(BASIC_DETAILS);
updateTotals();
