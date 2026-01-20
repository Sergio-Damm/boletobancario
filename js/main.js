// --- Auto-refresh a cada 10 minutos ---
setInterval(() => window.location.reload(), 600000);

// --- Botão Voltar ao Topo ---
function updateFooterStyle() {
  const button = document.getElementById("btn-back-to-top");
  const footer = document.getElementById("my-footer");
  if (!button || !footer) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const footerOffset = footer.offsetTop;
  const winHeight = window.innerHeight;

  if (scrollTop + winHeight >= footerOffset) {
    button.classList.add("on-footer");
  } else {
    button.classList.remove("on-footer");
  }
}

function updateScrollStyle() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  if (scrollTop > 20) {
    document.body.classList.add("scrolled");
  } else {
    document.body.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", function () {
  updateFooterStyle();
  updateScrollStyle();
});

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("btn-back-to-top");
  if (!button) return;

  button.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Inicialização
  updateFooterStyle();
  updateScrollStyle();
});

