// ================= UTIL =================
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

// ================= VENCIMENTO =================
function f_venc(barra) {
    const fator = barra.substr(5, 4);

    if (fator === '0000') {
        document.getElementById('vencimento1').value = 'Sem vencimento';
    } else {
        const data = fator_vencimento(fator);
        document.getElementById('vencimento1').value = data;
    }

    let inteiro = parseInt(barra.substr(9, 8), 10);
    let centavos = barra.substr(17, 2).padStart(2, '0');
    document.getElementById('valor1').value = `${inteiro},${centavos}`;
}

// ================= CÁLCULOS =================
function calcula_barra(linha) {
    linha = linha.replace(/[^0-9]/g, '');

    if (linha.length !== 47) {
        exibirAlertaGeral('Linha digitável inválida');
        return '';
    }

    linha = linha.slice(0, 4) + linha.slice(32, 47) + linha.slice(4, 9) + linha.slice(10, 20) + linha.slice(21, 31);

    if (modulo11_banco(linha.substr(0, 4) + linha.substr(5, 39)) !== parseInt(linha.substr(4, 1))) {
        exibirAlertaGeral('Linha digitável inválida');
        return '';
    }

    return linha;
}

function calcula_linha(barra) {
    barra = barra.replace(/[^0-9]/g, '');

    if (barra.length !== 44) {
        exibirAlertaGeral('Código de barras inválido');
        return '';
    }

    const campo1 = barra.slice(0, 4) + barra.slice(19, 20) + '.' + barra.slice(20, 24);
    const campo2 = barra.slice(24, 29) + '.' + barra.slice(29, 34);
    const campo3 = barra.slice(34, 39) + '.' + barra.slice(39, 44);
    const campo4 = barra.slice(4, 5);
    let campo5 = barra.slice(5, 19);

    if (modulo11_banco(barra.substr(0, 4) + barra.substr(5, 39)) !== parseInt(campo4)) {
        exibirAlertaGeral('Código de barras inválido');
        return '';
    }

    if (campo5 === '0') campo5 = '000';

    let linha = campo1 + modulo10(campo1) + ' ' +
                campo2 + modulo10(campo2) + ' ' +
                campo3 + modulo10(campo3) + ' ' +
                campo4 + ' ' + campo5;

    return linha.replace(/[^0-9]/g, '');
}

// ================= DATA =================
function fator_vencimento(dias) {
    const base = new Date(2022, 4, 29);
    const data = new Date(base.getTime() + (dias * 86400000));

    let dia = String(data.getDate()).padStart(2, '0');
    let mes = String(data.getMonth() + 1).padStart(2, '0');

    return `${dia}.${mes}.${data.getFullYear()}`;
}

// ================= DV =================
function modulo10(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    let soma = 0;
    let peso = 2;

    for (let i = numero.length - 1; i >= 0; i--) {
        let multiplicacao = numero[i] * peso;
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
        soma += numero[i] * peso;
        peso = (peso < 9) ? peso + 1 : 2;
    }

    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (digito === 0) digito = 1;

    return digito;
}

// ================= ALERTA =================
function exibirAlertaGeral(mensagem, tipo = 'danger') {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// ================= COPIAR =================
async function copyToClipboard(elementId) {
    try {
        const input = document.getElementById(elementId);

        if (!input || !input.value) {
            return exibirAlertaGeral('Nada para copiar');
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(input.value);
        } else {
            input.select();
            document.execCommand('copy');
        }

        const message = document.createElement('div');
        message.textContent = 'Copiado para a área de transferência!';
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = '#198754';
        message.style.color = '#fff';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '5px';
        message.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        message.style.zIndex = '9999';

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 2000);

    } catch (err) {
        exibirAlertaGeral('Erro ao copiar.');
    }
}

// ================= BARCODE =================
function generateBarcode(codigo) {
    const container = document.getElementById('barcode-container');
    container.innerHTML = '';

    if (codigo && codigo.length === 44) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "barcode";
        container.appendChild(svg);

        JsBarcode("#barcode", codigo, {
            format: "ITF",
            width: 2,
            height: 100,
            displayValue: true
        });
    } else {
        container.innerHTML = '<span>O código de barras aparecerá aqui</span>';
    }
}

// ================= LIMPEZA =================
function limparCampo(id) {
    document.getElementById(id).value = '';
    document.getElementById(id).focus();
    document.getElementById('alert-container').innerHTML = '';
}

function limparCodigoBarras() {
    document.getElementById('linhadigitavel1').value = '';
    document.getElementById('codigodebarras1').value = '';
    document.getElementById('vencimento1').value = '';
    document.getElementById('valor1').value = '';
    document.getElementById('alert-container').innerHTML = '';
    generateBarcode('');
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
    generateBarcode('');

// ================= LIMPEZA ADICIONAL SE USER ESQUECER DE LIMPAR ERRO =================

function limparCampoRelacionado(tipo) {
    if (tipo === 'linha') {
        document.getElementById('codigodebarras1').value = '';
    } else {
        document.getElementById('linhadigitavel1').value = '';
    }

    // limpa resultados também (evita inconsistência)
    document.getElementById('vencimento1').value = '';
    document.getElementById('valor1').value = '';
    document.getElementById('alert-container').innerHTML = '';

    generateBarcode('');
}

});
