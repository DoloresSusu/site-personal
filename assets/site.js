(function () {
    document.querySelectorAll(".carousel-button").forEach((button) => {
        button.addEventListener("click", () => {
            const track = document.getElementById(button.dataset.target);
            const firstCard = track && track.querySelector(".gallery-item");
            if (!track || !firstCard) return;
            const cardWidth = firstCard.getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
            const direction = button.dataset.direction === "prev" ? -1 : 1;
            track.scrollBy({ left: direction * (cardWidth + gap), behavior: "smooth" });
        });
    });

    document.querySelectorAll(".language-menu").forEach((menu) => {
        const summary = menu.querySelector("summary");
        summary.setAttribute("aria-expanded", String(menu.open));

        menu.addEventListener("toggle", () => {
            summary.setAttribute("aria-expanded", String(menu.open));
        });

        menu.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && menu.open) {
                menu.open = false;
                summary.focus();
            }
        });
    });

    document.addEventListener("click", (event) => {
        document.querySelectorAll(".language-menu[open]").forEach((menu) => {
            if (!menu.contains(event.target)) menu.open = false;
        });
    });
}());
