document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .product-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});

function copyIP() {
    const ip = "play.vinonetwork.com"; // Placeholder IP
    navigator.clipboard.writeText(ip).then(() => {
        const btn = document.querySelector('.btn-secondary');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Kopyalandı!';
        btn.style.borderColor = "#4cd137";
        btn.style.color = "#4cd137";

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.borderColor = "";
            btn.style.color = "";
        }, 2000);
    });
}
