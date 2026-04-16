// Inicializa a data de hoje
document.addEventListener('DOMContentLoaded', () => {
    const campoVenc = document.getElementById('vencimento');
    if (campoVenc) {
        // O "if" garante que isso só rode se o campo existir na tela
        campoVenc.valueAsDate = new Date();
    }
});

    // --- FUNÇÃO MÁSCARA DE MOEDA ---
    function mascaraMoeda(campo) {
        let valor = campo.value.replace(/\D/g, ""); // Remove tudo que não é número
        
        // Verifica limite de 99.999.999,99 (máximo 10 dígitos)
        const limite = 9999999999;
        const erroMsg = document.getElementById('msgErroValor');
        
        if (parseInt(valor) > limite) {
            valor = valor.substring(0, 10);
            erroMsg.style.display = 'block';
        } else {
            erroMsg.style.display = 'none';
        }

        // Formatação BRL
        valor = (parseInt(valor) / 100).toFixed(2) + "";
        valor = valor.replace(".", ",");
        valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        
        campo.value = (valor === "NaN" || valor === "0,00") ? "" : "R$ " + valor;
    }

// FUNÇÃO LIMPAR (Reset de campos)
function limparCampo(id) {
    const el = document.getElementById(id);
    if (el) {
        el.value = ''; // Funciona para todos os seus Inputs
        el.focus();
    }
    const containerAlerta = document.getElementById('alert-container');
    if (containerAlerta) containerAlerta.innerHTML = '';
}

async function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Detecta se é INPUT (Conversor) ou TEXTO (Gerador)
    const textToCopy = (el.tagName === 'INPUT') ? el.value : el.innerText;

    if (!textToCopy || textToCopy.trim() === "" || textToCopy.includes("aparecerá aqui")) {
        alert("Nada para copiar ainda!");
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy.trim());
            mostrarToastCopiado();
        } else {
            // Fallback para navegadores antigos ou conexões não seguras
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy.trim();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            mostrarToastCopiado();
        }
    } catch (err) {
        console.error('Erro ao copiar', err);
    }
}

// Mensagem visual de sucesso
function mostrarToastCopiado() {
    const toast = document.createElement('div');
    toast.textContent = 'Copiado!';
    Object.assign(toast.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: '#198754', color: '#fff', padding: '10px 20px',
        borderRadius: '5px', zIndex: '9999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1200);
}

    function calcularFatorVencimento(dataVencimento) {
        const dataBase = new Date('2022-05-29T00:00:00Z');
        const dataVenc = new Date(dataVencimento + 'T00:00:00Z');
        const diferencaMs = dataVenc.getTime() - dataBase.getTime();
        return Math.floor(diferencaMs / (1000 * 60 * 60 * 24)).toString().padStart(4, '0');
    }

    function modulo10(bloco) {
        let soma = 0; let peso = 2;
        for (let i = bloco.length - 1; i >= 0; i--) {
            let mult = parseInt(bloco.charAt(i)) * peso;
            if (mult > 9) mult -= 9;
            soma += mult;
            peso = (peso === 2) ? 1 : 2;
        }
        return (10 - (soma % 10)) % 10;
    }

    function modulo11(bloco) {
        let soma = 0; let peso = 2;
        for (let i = bloco.length - 1; i >= 0; i--) {
            soma += parseInt(bloco.charAt(i)) * peso;
            peso = (peso === 9) ? 2 : peso + 1;
        }
        let resto = soma % 11;
        let dv = 11 - resto;
        return (dv === 0 || dv === 10 || dv === 11) ? 1 : dv;
    }

    function gerarBoletoFinal() {
        // 1. Banco
        let bancoSelect = document.getElementById('banco');
        let bancoCodigo = bancoSelect.value;
        let bancoNome = "";

        if (bancoCodigo === "" || bancoCodigo === "aleatorio") {
            const options = document.querySelectorAll('#banco option:not([value=""]):not([value="aleatorio"])');
            const sorteado = options[Math.floor(Math.random() * options.length)];
            bancoCodigo = sorteado.value;
            bancoNome = sorteado.text;
        } else {
            bancoNome = bancoSelect.options[bancoSelect.selectedIndex].text;
        }

        // 2. Valor
        let valorInput = document.getElementById('valor').value.replace(/[^\d]/g, '');
        let valorFinalNumerico = 0;
        
        if (!valorInput || valorInput === "000") {
            valorFinalNumerico = (Math.random() * (50000 - 10) + 10).toFixed(2);
            valorInput = valorFinalNumerico.replace('.', '').padStart(10, '0');
        } else {
            valorFinalNumerico = (parseInt(valorInput) / 100).toFixed(2);
            valorInput = valorInput.padStart(10, '0');
        }

        // 3. Vencimento
        let vencimento = document.getElementById('vencimento').value;
        if (!vencimento) vencimento = new Date().toISOString().split('T')[0];

        // --- Lógica de Geração ---
        const fator = calcularFatorVencimento(vencimento);
        let campoLivre = "";
        for(let i=0; i<25; i++) campoLivre += Math.floor(Math.random() * 10);

        let parte1 = bancoCodigo + "9"; 
        let parte2 = fator + valorInput + campoLivre;
        const dvGeral = modulo11(parte1 + parte2);
        const codigoBarras = parte1 + dvGeral + parte2;

        let b1 = bancoCodigo + "9" + campoLivre.substring(0, 5);
        let b2 = campoLivre.substring(5, 15);
        let b3 = campoLivre.substring(15, 25);

        let linhaPura = b1 + modulo10(b1) + b2 + modulo10(b2) + b3 + modulo10(b3) + dvGeral + fator + valorInput;

        // --- Interface ---
        document.getElementById('resLinha').innerText = linhaPura;
        document.getElementById('resBarras').innerText = codigoBarras;
        document.getElementById('sumBanco').innerText = bancoNome;
        document.getElementById('sumValor').innerText = parseFloat(valorFinalNumerico).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('sumVenc').innerText = vencimento.split('-').reverse().join('/');
        document.getElementById('resultado').classList.remove('d-none');
    }
    
