document.addEventListener("DOMContentLoaded", () => {
  const passcodeInput = document.getElementById("passcode-input");
  const messageArea = document.getElementById("message-area");

  if (passcodeInput) {
    // Check if we need to run boot sequence
    const bootSequence = document.getElementById("boot-sequence");
    const inputLine = document.querySelector(".input-line");

    // Only run if we are on index and haven't run it this session (optional, for now always run)
    if (bootSequence && inputLine) {
      runBootSequence(bootSequence, inputLine, passcodeInput);
    } else {
      passcodeInput.focus();
    }

    document.addEventListener("click", (e) => {
      // Only refocus if not clicking interactable elements
      if (
        e.target.tagName !== "A" &&
        e.target.tagName !== "BUTTON" &&
        !inputLine.classList.contains("boot-hidden")
      ) {
        passcodeInput.focus();
      }
    });

    passcodeInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        validatePasscode(passcodeInput.value.toLowerCase()); // Handle 'Guest' vs 'guest'
      }
    });
  }

  async function runBootSequence(container, inputLine, input) {
    // 1. Hide input
    inputLine.classList.add("boot-hidden");

    // 2. Clone structure before clearing
    // Use Array.from to get a static list of elements to clone
    const linesToType = Array.from(container.children).map((p) =>
      p.cloneNode(true),
    );
    container.innerHTML = ""; // Clear

    // 3. Add glitch effect
    document
      .querySelector(".terminal-container")
      .classList.add("glitch-active");

    // 4. Recursive Typing
    for (const lineTemplate of linesToType) {
      // Create a new empty P tag in the real container
      const p = document.createElement("p");
      container.appendChild(p);

      // Random lag/glitch intensity
      if (Math.random() > 0.7) {
        document.querySelector(".terminal-container").style.animationDuration =
          "0.05s"; // Fast flicker
      } else {
        document.querySelector(".terminal-container").style.animationDuration =
          "0.15s"; // Normal
      }

      // Type the content of the cloned template into the new P
      await typeNode(p, lineTemplate);

      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    // 5. Build Complete
    document
      .querySelector(".terminal-container")
      .classList.remove("glitch-active");
    document.querySelector(".terminal-container").style.animationDuration =
      "0.15s"; // Reset
    inputLine.classList.remove("boot-hidden");
    input.focus();
  }

  async function typeNode(targetParent, sourceNode) {
    const childNodes = Array.from(sourceNode.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        await typeText(targetParent, node.nodeValue);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const newElement = document.createElement(node.tagName);
        // Copy attributes (class, title, etc.)
        Array.from(node.attributes).forEach((attr) => {
          newElement.setAttribute(attr.name, attr.value);
        });
        targetParent.appendChild(newElement);

        // Recurse to type that content.
        await typeNode(newElement, node);
      }
    }
  }
  const shala = "696742";
  const ahlan = "148842";
  function typeText(element, text) {
    return new Promise((resolve) => {
      // Append a new text node to type into, so we don't overwrite siblings
      const textNode = document.createTextNode("");
      element.appendChild(textNode);

      let i = 0;

      function type() {
        if (i < text.length) {
          textNode.nodeValue += text.charAt(i);
          i++;

          // Random typing speed (5ms to 25ms) - FASTER
          // Occasional "lag" (50ms)
          let delay = Math.random() * 20 + 5;
          if (Math.random() > 0.98) delay += 50;

          // If we hit "...", make it slower but less than before
          if (text.substring(i - 3, i) === "...") delay += 150;

          setTimeout(type, delay);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  function validatePasscode(code) {
    if (code === ahlan) {
      loginUser("admin");
    } else if (code === shala) {
      loginUser("guest");
    } else {
      messageArea.innerHTML =
        '<p class="error-msg">> ACCESS DENIED. INVALID PASSCODE.</p>';
      passcodeInput.value = "";
    }
  }

  function loginUser(role) {
    messageArea.innerHTML = `<p class="success">> ACCESS GRANTED [${role.toUpperCase()}]. LOADING DIRECTORY...</p>`;
    messageArea.style.color = "var(--text-color)";

    setTimeout(() => {
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("role", role);
      window.location.href = "home.html";
    }, 1000);
  }

  // --- Session Check & Access Control ---
  if (!document.getElementById("passcode-input")) {
    checkSession();
    applyAccessControl();
    initLightbox();
  }

  function checkSession() {
    if (sessionStorage.getItem("authenticated") !== "true") {
      window.location.href = "index.html";
    }

    // Update footer status if exists
    const footerStatus = document.querySelector(".footer-status p");
    if (footerStatus) {
      const role = sessionStorage.getItem("role") || "UNKNOWN";
      footerStatus.innerHTML = `USER: ${role.toUpperCase()} | SESSION: ACTIVE | CLEARANCE: <span class="redacted">${role === "admin" ? "LEVEL 5" : "LEVEL 1"}</span>`;
    }
  }

  function applyAccessControl() {
    const role = sessionStorage.getItem("role");
    const restrictedItems = document.querySelectorAll(".restricted-link");

    if (role === "admin") {
      restrictedItems.forEach((item) => {
        const realText = item.getAttribute("data-text");
        const realHref = item.getAttribute("data-href");

        // Create new link element
        const link = document.createElement("a");
        link.href = realHref || "#";
        link.textContent = realText || item.textContent;
        link.className = "unredacted-link"; // Add style for unredacted

        // Replace the redacted span with the real link
        item.parentNode.replaceChild(link, item);
      });

      // Hide "(ACCESS DENIED)" labels near revealed links
      document.querySelectorAll("li").forEach((li) => {
        if (li.querySelector(".unredacted-link")) {
          const deniedSpan = li.querySelector('span[style*="color: gray"]');
          if (deniedSpan) deniedSpan.style.display = "none";
        }
      });
    }
  }

  // --- Image Viewer (Lightbox) ---
  function initLightbox() {
    // Inject Lightbox HTML if not present
    if (!document.getElementById("lightbox-modal")) {
      const lightbox = document.createElement("div");
      lightbox.id = "lightbox-modal";
      // Updated Structure for Window-like appearance
      lightbox.innerHTML = `
            <div class="lightbox-window">
                <div class="window-header">
                    <span class="window-title">IMAGE_VIEWER.EXE</span>
                    <span class="window-close-btn">[X]</span>
                </div>
                <div class="window-body">
                    <div class="lightbox-watermark">CLASSIFIED</div>
                    <img id="lightbox-img" src="">
                    <div id="lightbox-caption"></div>
                </div>
            </div>
        `;
      document.body.appendChild(lightbox);
    }

    const modal = document.getElementById("lightbox-modal");
    const modalImg = document.getElementById("lightbox-img");
    const captionText = document.getElementById("lightbox-caption");
    const closeBtn = document.querySelector(".window-close-btn");

    // Add click event to gallery items (or placeholders for now)
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        const text = item.querySelector("span").textContent;
        const imgElement = item.querySelector("img");

        modal.style.display = "flex";
        modalImg.src = ""; // Clear previous
        modalImg.style.display = "none";

        if (imgElement && imgElement.src) {
          modalImg.src = imgElement.src;
          modalImg.style.display = "block";
          captionText.innerHTML = `> VIEWING: ${text}<br>[RES: REAL] [FMT: JPG]`;
        } else {
          // Generate placeholder image
          modalImg.src = `https://placehold.co/800x600/000000/33ff33?text=${encodeURIComponent(text)}`;
          modalImg.style.display = "block";
          captionText.innerHTML = `> VIEWING: ${text}<br>[RES: 800x600] [FMT: JPG]`;
        }
      });
    });

    // Close logic
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.addEventListener("click", (e) => {
      // Close if clicking outside the window (on the blurred background)
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
});
