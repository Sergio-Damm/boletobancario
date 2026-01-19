// --- Auto-refresh a cada 10 minutos ---
setInterval(() => window.location.reload(), 600000);

// --- Botão Voltar ao Topo ---
function updateScrollEffects() {
    const button = document.getElementById('btn-back-to-top');
    const footer = document.querySelector('footer'); // Ou o ID do seu footer
    if (!button) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Mostrar/Esconder botão
    if (scrollTop > 300) {
        button.style.display = "block";
    } else {
        button.style.display = "none";
    }

    // Evitar que o botão cubra o rodapé
    if (footer && (window.innerHeight + scrollTop >= footer.offsetTop)) {
        button.style.bottom = (window.innerHeight + scrollTop - footer.offsetTop + 20) + "px";
    } else {
        button.style.bottom = "20px";
    }
}

window.onscroll = updateScrollEffects;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-back-to-top')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
