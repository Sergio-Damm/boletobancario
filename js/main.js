setInterval(() => window.location.reload(), 600000);

function updateFooterStyle() {
    const button = document.getElementById("btn-back-to-top");
    const footer = document.getElementById("footer");
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

    updateFooterStyle();
    updateScrollStyle();
});

function gerarIniciais(nome) {
    if (!nome) return 'XX';

    const limpo = nome.replace(/[^a-zA-Z\s]/g, '').trim();

    const partes = limpo.split(' ').filter(Boolean);

    if (partes.length === 1) {
        return partes[0].substring(0, 2).toUpperCase();
    }

    return (partes[0][0] + partes[1][0]).toUpperCase();
}

async function carregarFeed(config) {
    const lista = document.getElementById(config.listaId);
    const loading = document.getElementById(config.loadingId);
    if (!lista || !loading) return;

    lista.innerHTML = '';
    loading.style.display = 'block';

    const iniciais = gerarIniciais(config.nome);

    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'>
<rect width='100%' height='100%' fill='#333'/>
<text x='50%' y='50%' font-size='40' fill='white' text-anchor='middle' dy='.3em'>
${iniciais}
</text>
</svg>
`;

    const placeholder = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

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
                const m = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (m) thumb = m[1];
            }

            const diff = Math.floor((Date.now() - new Date(item.pubDate || Date.now())) / 1000);
            const tempo = diff < 3600 ? Math.floor(Math.max(1, diff / 60)) + ' min atrás' :
                diff < 86400 ? Math.floor(diff / 3600) + 'h atrás' :
                    diff < 172800 ? 'ontem' : Math.floor(diff / 86400) + ' dias atrás';

            htmlItens.push(
                '<div class="col-md-6 col-lg-4 mb-4">' +
                '<a href="' + item.link + '" target="_blank" rel="noopener" class="text-decoration-none text-dark">' +
                '<div class="card card-liftshadow border-light-subtle h-100">' +
                '<img alt="' + item.title.trim() + '" src="' + thumb + '" class="card-img-top" loading="lazy" style="height:200px;object-fit:cover;" ' +
                'onerror="this.onerror=null; this.src=\'' + placeholder + '\'">' +
                '<div class="card-body d-flex flex-column">' +
                '<p class="card-title link-interno mb-2">' + item.title.trim() + '</p>' +
                '<p class="card-text mt-auto text-cerise small">' + config.nome + ' • ' + tempo + '</p>' +
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

document.addEventListener('DOMContentLoaded', () => {
    carregarFeed({
        listaId: 'lista1',
        loadingId: 'loading1',
        rss: 'https://neofeed.com.br/feed/',
        nome: 'NeoFeed',
        letras: 'NF'
    });

    carregarFeed({
        listaId: 'lista3',
        loadingId: 'loading3',
        rss: 'https://www.infomoney.com.br/economia/feed/',
        nome: 'Infomoney',
        letras: 'IM'
    });

    carregarFeed({
        listaId: 'lista5',
        loadingId: 'loading5',
        rss: 'https://www.contabeis.com.br/rss/conteudo/',
        nome: 'Contábeis',
        letras: 'CO',
        filtroPaywall: true
    });

});

function limparCodigoBarras() {
    const ids = [
        'linhadigitavel1', 'codigodebarras1', 'vencimento1', 'valor1', 'nomeBanco',
        'banco', 'valor', 'vencimento', 'resLinha', 'resBarras', 'sumBanco', 'sumValor', 'sumVenc'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                el.value = '';
            } else {
                el.innerText = '';
            }
        }
    });

    const containerAlerta = document.getElementById('alert-container');
    if (containerAlerta) containerAlerta.innerHTML = '';

    const alertaVenc = document.getElementById('vencimento-alerta');
    if (alertaVenc) alertaVenc.style.display = 'none';

    const barcodeContainer = document.getElementById('barcode-container');
    if (barcodeContainer) {
        barcodeContainer.innerHTML = '<p class="m-0 text-muted">O código de barras aparecerá aqui</p>';
    }
}

document.addEventListener('DOMContentLoaded', function () {

    const campoBusca = document.getElementById('buscaBanco');
    if (campoBusca) {
        campoBusca.addEventListener('keyup', function () {
            let filtro = this.value.toLowerCase();
            let linhas = document.querySelectorAll('#tabelaBancos tbody tr');

            linhas.forEach(linha => {
                let textoLinha = linha.innerText.toLowerCase();
                linha.style.display = textoLinha.includes(filtro) ? '' : 'none';
            });
        });
    }

    const campoTexto = document.getElementById('texto');
    if (campoTexto) {
        campoTexto.addEventListener('input', function () {
            const texto = this.value;

            document.getElementById('total').textContent = texto.length;
            document.getElementById('numeros').textContent = texto.replace(/[^0-9]/g, '').length;
            document.getElementById('letras').textContent = texto.replace(/[^A-Za-z]/g, '').length;
            document.getElementById('palavras').textContent = (texto.match(/[A-Za-z]+/g) || []).length;
            document.getElementById('espacos').textContent = (texto.match(/ /g) || []).length;
            document.getElementById('linhas').textContent = texto.length > 0 ? texto.split('\n').length : 0;

            const quebrasDeLinha = (texto.match(/\n/g) || []).length;
            const total = texto.length;
            const numeros = texto.replace(/[^0-9]/g, '').length;
            const letras = texto.replace(/[^A-Za-z]/g, '').length;
            const espacos = (texto.match(/ /g) || []).length;

            document.getElementById('simbolos').textContent = total - (numeros + letras + espacos + quebrasDeLinha);
        });

        const botaoLimparContador = document.getElementById('limpar');
        if (botaoLimparContador) {
            botaoLimparContador.addEventListener('click', function () {
                campoTexto.value = '';
                const ids = ['total', 'numeros', 'letras', 'palavras', 'espacos', 'simbolos', 'linhas'];
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = '0';
                });
            });
        }
    }
});

function applyMask(input) {
    var value = input.value.replace(/[^\d]/g, '');
    var formatted = '';
    if (value.length < 12) {
        for (var i = 0; i < value.length; i++) {
            if (i === 3 || i === 6) formatted += '.';
            else if (i === 9) formatted += '-';
            formatted += value[i];
        }
    } else {
        for (var i = 0; i < value.length; i++) {
            if (i === 2 || i === 5) formatted += '.';
            else if (i === 8) formatted += '/';
            else if (i === 12) formatted += '-';
            formatted += value[i];
        }
    }
    input.value = formatted;
}

function formatDocument(number) {
    number = number.replace(/[^\d]/g, '');
    var formatted = '';
    if (number.length === 11) {
        for (var i = 0; i < number.length; i++) {
            if (i === 3 || i === 6) formatted += '.';
            else if (i === 9) formatted += '-';
            formatted += number[i];
        }
    } else if (number.length === 14) {
        for (var i = 0; i < number.length; i++) {
            if (i === 2 || i === 5) formatted += '.';
            else if (i === 8) formatted += '/';
            else if (i === 12) formatted += '-';
            formatted += number[i];
        }
    }
    return formatted || number;
}

function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var sum = 0, remainder;
    for (var i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    sum = 0;
    for (var i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    return true;
}

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    var weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    var weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    var sum = 0, remainder;
    for (var i = 0; i < 12; i++) sum += parseInt(cnpj.charAt(i)) * weights1[i];
    remainder = sum % 11;
    remainder = remainder < 2 ? 0 : 11 - remainder;
    if (remainder !== parseInt(cnpj.charAt(12))) return false;
    sum = 0;
    for (var i = 0; i < 13; i++) sum += parseInt(cnpj.charAt(i)) * weights2[i];
    remainder = sum % 11;
    remainder = remainder < 2 ? 0 : 11 - remainder;
    if (remainder !== parseInt(cnpj.charAt(13))) return false;
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    const inputDoc = document.getElementById("documentInput");
    const resultDoc = document.getElementById("result");
    const btnValidar = document.getElementById("btnValidar");
    const btnLimparDoc = document.getElementById("btnLimparDoc");

    if (inputDoc && resultDoc) {

        inputDoc.addEventListener('input', function () {
            applyMask(this);
        });

        if (btnValidar) {
            btnValidar.addEventListener('click', function () {
                var input = inputDoc.value;
                var cleanInput = input.replace(/[^\d]/g, '');

                if (cleanInput.length === 11) {
                    if (validateCPF(cleanInput)) {
                        resultDoc.textContent = "O CPF " + formatDocument(cleanInput) + " é válido!";
                        resultDoc.style.color = "#198754";
                    } else {
                        resultDoc.textContent = "O CPF " + formatDocument(cleanInput) + " é inválido!";
                        resultDoc.style.color = "#ff0000";
                    }
                } else if (cleanInput.length === 14) {
                    if (validateCNPJ(cleanInput)) {
                        resultDoc.textContent = "O CNPJ " + formatDocument(cleanInput) + " é válido!";
                        resultDoc.style.color = "#198754";
                    } else {
                        resultDoc.textContent = "O CNPJ " + formatDocument(cleanInput) + " é inválido!";
                        resultDoc.style.color = "#ff0000";
                    }
                } else {
                    resultDoc.textContent = "Digite 11 dígitos para CPF ou 14 para CNPJ!";
                    resultDoc.style.color = "black";
                }
            });
        }

        if (btnLimparDoc) {
            btnLimparDoc.addEventListener('click', function () {
                inputDoc.value = "";
                resultDoc.textContent = "O resultado aparecerá aqui";
                resultDoc.style.color = "#666666";
                setTimeout(() => inputDoc.focus(), 0);
            });
        }
    }
});

function limparTudoGeral() {
    const formulario = document.getElementById('boletoForm');
    if (formulario) formulario.reset();

    const IDsParaLimpar = [
        'linhadigitavel1', 'codigodebarras1', 'vencimento1', 'valor1', 'nomeBanco',
        'resLinha', 'resBarras', 'sumBanco', 'sumValor', 'sumVenc', 'valor', 'vencimento'
    ];

    IDsParaLimpar.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = '';
        }
    });

    const alerta = document.getElementById('alert-container');
    if (alerta) alerta.innerHTML = '';

    const msgErro = document.getElementById('msgErroValor');
    if (msgErro) msgErro.style.display = 'none';

    if (typeof generateBarcode === "function") {
        generateBarcode('');
    }
}

function validateDocument() {
    var input = document.getElementById("documentInput").value;
    var resultElement = document.getElementById("result");
    var cleanInput = input.replace(/[^\d]/g, '');

    if (cleanInput.length === 11) {
        if (validateCPF(cleanInput)) {
            resultElement.textContent = "O CPF " + formatDocument(cleanInput) + " é válido!";
            resultElement.style.color = "#198754";
        } else {
            resultElement.textContent = "O CPF " + formatDocument(cleanInput) + " é inválido!";
            resultElement.style.color = "#ff0000";
        }
    } else if (cleanInput.length === 14) {
        if (validateCNPJ(cleanInput)) {
            resultElement.textContent = "O CNPJ " + formatDocument(cleanInput) + " é válido!";
            resultElement.style.color = "#198754";
        } else {
            resultElement.textContent = "O CNPJ " + formatDocument(cleanInput) + " é inválido!";
            resultElement.style.color = "#ff0000";
        }
    } else {
        resultElement.textContent = "Digite um CPF com 11 dígitos ou um CNPJ com 14 dígitos!";
        resultElement.style.color = "black";
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const whatsappBtn = document.getElementById('shareWhatsapp');
    const genericBtn  = document.getElementById('shareGeneric');

    const url   = window.location.href;
    const title = document.title;

    // WhatsApp
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const whatsappUrl =
                'https://wa.me/?text=' +
                encodeURIComponent(title + ' - ' + url);

            window.open(whatsappUrl, '_blank');
        });
    }

    // generic share
    if (genericBtn) {
        genericBtn.addEventListener('click', async () => {

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: title,
                        url: url
                    });
                } catch (err) {
                    // usuário cancelou → não é erro
                }
            } else {
                await navigator.clipboard.writeText(url);

                const feedback = document.getElementById('shareFeedback');
                if (feedback) {
                    feedback.classList.remove('visually-hidden');
                    setTimeout(() => {
                        feedback.classList.add('visually-hidden');
                    }, 2500);
                }
            }
        });
    }

});
