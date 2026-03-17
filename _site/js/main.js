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

// --- 6. feed de noticias (rss) ---
async function carregarFeed(config) {
    const lista = document.getElementById(config.listaId);
    const loading = document.getElementById(config.loadingId);
    if (!lista || !loading) return;

    lista.innerHTML = ''; 
    loading.style.display = 'block';

    const placeholders = {
        'VE': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA2NmNjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BRTwvdGV4dD48L3N2Zz4=',
        'AB': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA2NDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OTTwvdGV4dD48L3N2Zz4=',
        'ES': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2MwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FUzwvdGV4dD48L3N2Zz4='
    };
    const placeholder = placeholders[config.letras] || placeholders['SD'];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.rss)}`, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Erro na rede');

        const data = await res.json();
        if (data.status !== 'ok') throw new Error('Erro na API');

        let itens = data.items.filter(i => i.title && i.link);

        if (config.filtroPaywall) {
            itens = itens.filter(i => {
                const t = i.title.toLowerCase();
                return !t.includes('prêmio') && !t.includes('exclusivo') && !t.includes('assinante') && !t.includes('mobilidade 202');
            });
        }

        let htmlItens = []; 

        itens.slice(0, 6).forEach(item => {
            let thumb = placeholder;
            
            if (item.enclosure?.link && item.enclosure.type?.includes('image')) {
                thumb = item.enclosure.link;
            } else if (item.thumbnail) {
                thumb = item.thumbnail;
            } else if (item.description) {
                const m = item.description.match(/src=["']([^"']+\.(jpe?g|png|gif|webp))["']/i);
                if (m) thumb = m[1];
            }

            const diff = Math.floor((Date.now() - new Date(item.pubDate || Date.now())) / 1000);
            const tempo = diff < 3600 ? Math.floor(Math.max(1, diff/60))+' min atrás' :
                          diff < 86400 ? Math.floor(diff/3600)+'h atrás' :
                          diff < 172800 ? 'ontem' : Math.floor(diff/86400)+' dias atrás';

            htmlItens.push(
                '<div class="col-md-6 col-lg-4 mb-4">' +
                '<a href="'+item.link+'" target="_blank" rel="noopener" class="text-decoration-none text-dark">' +
                '<div class="card card-liftshadow border-light-subtle h-100">' +
                '<img alt="'+item.title.trim()+'" src="'+thumb+'" class="card-img-top" loading="lazy" style="height:200px;object-fit:cover;" ' +
                'onerror="this.onerror=null; this.src=\''+placeholder+'\'">' +
                '<div class="card-body d-flex flex-column">' +
                '<p class="card-title link-interno mb-2">'+item.title.trim()+'</p>' +
                '<p class="card-text mt-auto text-cerise small">'+config.nome+' • '+tempo+'</p>' +
                '</div>' +
                '</div>' +
                '</a>' +
                '</div>'
            );
        });

        lista.innerHTML = htmlItens.join('');

    } catch (error) {
        console.error("Erro no feed:", config.nome, error);
        lista.innerHTML = `<div class="col-12 text-center py-5 text-danger">${config.nome} indisponível no momento</div>`;
    } finally {
        loading.style.display = 'none';
    }
}

// --- Feed - execucao das chamadas ---
document.addEventListener('DOMContentLoaded', () => {
    // Autoesporte
    carregarFeed({
        listaId: 'lista1', 
        loadingId: 'loading1', 
        rss: 'https://pox.globo.com/rss/valor', 
        nome: 'Valor Econômico', 
        letras: 'VE'
    });

    // NewsMotor
    carregarFeed({
        listaId: 'lista3', 
        loadingId: 'loading3', 
        rss: 'https://www.infomoney.com.br/feed/', 
        nome: 'Infomoney', 
        letras: 'IM'
    });

    // Estadao (Jornal do Carro)
    carregarFeed({
        listaId: 'lista5', 
        loadingId: 'loading5', 
        rss: 'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/jornal-do-carro/', 
        nome: 'Estadão', 
        letras: 'ES', 
        filtroPaywall: true
    });
});
