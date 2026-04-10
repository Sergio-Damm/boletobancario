// ================= UTILITÁRIOS =================
function verificarEntradaNumerica(valor) {
    return /^[0-9]+$/.test(valor);
}

// ================= VALIDAÇÕES =================
function validarCodigoBarras(obj) {
    const valor = obj.value.trim();
    return valor && verificarEntradaNumerica(valor) && valor.length === 44;
}

// ================= LINHA → BARRA =================
function f_barra() {
    const valor = document.getElementById('linhadigitavel1').value.trim();

    if (!valor) return exibirAlertaGeral('Informe a linha digitável');
    if (!verificarEntradaNumerica(valor)) return exibirAlertaGeral('A linha digitável deve conter apenas números');
    if (valor.length !== 47) return exibirAlertaGeral(`A linha digitável deve ter 47 números. Você digitou ${valor.length}.`);

    const barra = calcula_barra(valor);
    if (!barra) return;

    document.getElementById('codigodebarras1').value = barra;
    f_venc(barra);
    generateBarcode(barra);
}

// ================= BARRA → LINHA =================
function f_linha() {
    const valor = document.getElementById('codigodebarras1').value.trim();

    if (!valor) return exibirAlertaGeral('Informe o código de barras');
    if (!verificarEntradaNumerica(valor)) return exibirAlertaGeral('O código de barras deve conter apenas números');
    if (valor.length !== 44) return exibirAlertaGeral(`O código de barras deve ter 44 números. Você digitou ${valor.length}.`);

    const linha = calcula_linha(valor);
    if (!linha) return;

    document.getElementById('linhadigitavel1').value = linha;
    f_venc(valor);
    generateBarcode(valor);
}

// ================= VENCIMENTO E VALOR =================
function f_venc(barra) {
    const fator = barra.substr(5, 4);
    const campoValor = barra.substr(9, 10);

    if (fator === '0000') {
        document.getElementById('vencimento1').value = 'Sem vencimento';
    } else {
        document.getElementById('vencimento1').value = fator_vencimento(fator);
    }

    // Valor sem o R$ conforme solicitado
    let valorNumerico = (parseFloat(campoValor) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById('valor1').value = valorNumerico;
}

// ================= CÁLCULO DE DATA (NOVA REGRA PÓS-2025) =================
function fator_vencimento(diasStr) {
    const dias = parseInt(diasStr, 10);
    if (isNaN(dias)) return "";
    
    // Data-base: 29/05/2022 às 12:00:00 UTC para evitar erros de fuso horário
    const dataBaseNova = new Date("2022-05-29T12:00:00Z");
    const dataVenc = new Date(dataBaseNova.getTime() + (dias * 86400000));
    
    let dia = String(dataVenc.getUTCDate()).padStart(2, '0');
    let mes = String(dataVenc.getUTCMonth() + 1).padStart(2, '0');
    let ano = dataVenc.getUTCFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

// ================= LÓGICA DE CONVERSÃO =================
function calcula_barra(linha) {
    linha = linha.replace(/[^0-9]/g, '');
    if (linha.length !== 47) return '';
    
    let barra = linha.slice(0, 4) + linha.slice(32, 47) + linha.slice(4, 9) + linha.slice(10, 20) + linha.slice(21, 31);
    
    if (modulo11_banco(barra.substr(0, 4) + barra.substr(5, 39)) !== parseInt(barra.substr(4, 1))) {
        exibirAlertaGeral('Linha digitável inválida (Dígito Verificador não confere)');
        return '';
    }
    return barra;
}

function calcula_linha(barra) {
    barra = barra.replace(/[^0-9]/g, '');
    if (barra.length !== 44) return '';
    
    const campo1 = barra.slice(0, 4) + barra.slice(19, 24);
    const campo2 = barra.slice(24, 34);
    const campo3 = barra.slice(34, 44);
    const campo4 = barra.slice(4, 5);
    let campo5 = barra.slice(5, 19);
    
    if (modulo11_banco(barra.substr(0, 4) + barra.substr(5, 39)) !== parseInt(campo4)) {
        exibirAlertaGeral('Código de barras inválido (Dígito Verificador não confere)');
        return '';
    }
    
    if (campo5 === '0') campo5 = '00000000000000';
    
    let linha = campo1 + modulo10(campo1) + campo2 + modulo10(campo2) + campo3 + modulo10(campo3) + campo4 + campo5;
    return linha;
}

// ================= DÍGITOS VERIFICADORES =================
function modulo10(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    let soma = 0;
    let peso = 2;
    for (let i = numero.length - 1; i >= 0; i--) {
        let multiplicacao = parseInt(numero[i]) * peso;
        if (multiplicacao >= 10) multiplicacao = 1 + (multiplicacao - 10);
        soma += multiplicacao;
        peso = (peso === 2) ? 1 : 2;
    }
    let digito = 10 - (soma % 10);
    return digito === 10 ? 0 : digito;
}

function modulo11_banco(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    let soma = 0;
    let peso = 2;
    for (let i = numero.length - 1; i >= 0; i--) {
        soma += parseInt(numero[i]) * peso;
        peso = (peso < 9) ? peso + 1 : 2;
    }
    let resto = soma % 11;
    let dv = 11 - resto;
    if (dv === 0 || dv === 10 || dv === 11) dv = 1;
    return dv;
}

// ================= INTERFACE E ALERTAS =================
function exibirAlertaGeral(mensagem, tipo = 'danger') {
    const container = document.getElementById('alert-container');
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

async function copyToClipboard(elementId) {
    const input = document.getElementById(elementId);
    if (!input || !input.value) return exibirAlertaGeral('Nada para copiar', 'warning');

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(input.value);
            mostrarToastCopiado();
        } else {
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
            mostrarToastCopiado();
        }
    } catch (err) {
        exibirAlertaGeral('Erro ao copiar. Por favor, copie manualmente.');
    }
}

function mostrarToastCopiado() {
    const message = document.createElement('div');
    message.textContent = 'Copiado!';
    Object.assign(message.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: '#198754', color: '#fff', padding: '10px 20px',
        borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: '9999'
    });
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 1500);
}

// ================= BARCODE E LIMPEZA =================
function generateBarcode(codigo) {
    const container = document.getElementById('barcode-container');
    if (!container) return;
    container.innerHTML = '';

    if (codigo && codigo.length === 44) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "barcode";
        container.appendChild(svg);
        if (typeof JsBarcode === "function") {
            JsBarcode("#barcode", codigo, {
                format: "ITF", width: 2, height: 100, displayValue: true
            });
        }
    } else {
        container.innerHTML = '<p class="m-0 text-muted">O código de barras aparecerá aqui</p>';
    }
}

function limparCampo(id) {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.focus(); }
    document.getElementById('alert-container').innerHTML = '';
}

function limparCampoRelacionado(tipo) {
    if (tipo === 'linha') {
        document.getElementById('codigodebarras1').value = '';
    } else {
        document.getElementById('linhadigitavel1').value = '';
    }
    document.getElementById('vencimento1').value = '';
    document.getElementById('valor1').value = '';
    document.getElementById('alert-container').innerHTML = '';
    generateBarcode('');
}

function limparCodigoBarras() {
    document.getElementById('linhadigitavel1').value = '';
    document.getElementById('codigodebarras1').value = '';
    document.getElementById('vencimento1').value = '';
    document.getElementById('valor1').value = '';
    document.getElementById('alert-container').innerHTML = '';
    generateBarcode('');
}

document.addEventListener('DOMContentLoaded', () => {
    generateBarcode('');
});
