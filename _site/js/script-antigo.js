// --- 2. Full Script (Old Page - Due dates until by February 21, 2025) ---  
function showAlert(message, type = 'danger') {
    console.log('showAlert chamado com mensagem:', message);
    var container = document.getElementById('alert-container');
    var alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    container.appendChild(alertDiv);
    var closeButton = alertDiv.querySelector('.btn-close');
    closeButton.addEventListener('click', function() {
        document.forms['form'].reset();
        resetBarcode();
    });
}

function f_barra() {
    var linha = form.linha.value.replace(/[^0-9]/g, '');
    if (linha.length != 47) {
        showAlert('Linha Digitável inválida!');
        return false;
    }
    var barra = calcula_barra(linha);
    if (barra === false) return false;
    form.barra.value = barra;
    f_venc();
    generateBarcode(barra);
    return false;
}

function f_linha() {
    var barra = form.barra.value.replace(/[^0-9]/g, '');
    if (barra.length != 44) {
        showAlert('Código de Barras inválido!');
        return false;
    }
    var linha = calcula_linha(barra);
    if (linha === false) return false;
    form.linha.value = linha;
    f_venc();
    generateBarcode(barra);
    return false;
}

function calcula_barra(linha) {
    var barra = linha.substr(0, 4) + linha.substr(32, 15) + linha.substr(4, 5) + linha.substr(10, 10) + linha.substr(21, 10);
    if (barra.length != 44) {
        showAlert('Linha Digitável inválida!');
        return false;
    }
    var digitoCalculado = modulo11_banco(barra.substr(0, 4) + barra.substr(5, 39));
    var digitoInformado = barra.substr(4, 1);
    if (digitoCalculado != digitoInformado) {
        showAlert('Linha Digitável inválida! Dígito verificador incorreto.');
        return false;
    }
    return barra;
}

function calcula_linha(barra) {
    var campo1 = barra.substr(0, 4) + barra.substr(19, 1) + barra.substr(20, 4);
    var campo2 = barra.substr(24, 10);
    var campo3 = barra.substr(34, 10);
    var campo4 = barra.substr(4, 1);
    var campo5 = barra.substr(5, 14);
    if (modulo11_banco(barra.substr(0, 4) + barra.substr(5, 39)) != campo4) {
        showAlert('Código de Barras inválido! Dígito verificador incorreto.');
        return false;
    }
    if (campo5 == 0) campo5 = '000';
    var linha = campo1 + modulo10(campo1) + campo2 + modulo10(campo2) + campo3 + modulo10(campo3) + campo4 + campo5;
    return linha;
}

function f_venc() {
    var fator = form.barra.value.substr(5, 4);
    if (fator == 0) {
        form.venc.value = 'O boleto pode ser pago em qualquer data';
    } else {
        form.venc.value = fator_vencimento(fator);
    }
    form.valor.value = (form.barra.value.substr(9, 8) * 1) + ',' + form.barra.value.substr(17, 2);
    return false;
}

function fator_vencimento(dias) {
    var baseDate = new Date(1997, 9, 7); // 07/10/1997
    var vencimento = new Date(baseDate.getTime() + (dias * 24 * 60 * 60 * 1000));
    var dia = vencimento.getDate();
    var mes = vencimento.getMonth() + 1;
    var ano = vencimento.getFullYear();
    if (dia < 10) dia = "0" + dia;
    if (mes < 10) mes = "0" + mes;
    return dia + "." + mes + "." + ano;
}

function modulo10(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    var soma = 0;
    var peso = 2;
    var contador = numero.length - 1;
    while (contador >= 0) {
        var multiplicacao = (numero.substr(contador, 1) * peso);
        if (multiplicacao >= 10) { multiplicacao = 1 + (multiplicacao - 10); }
        soma += multiplicacao;
        peso = (peso == 2) ? 1 : 2;
        contador--;
    }
    var digito = 10 - (soma % 10);
    if (digito == 10) digito = 0;
    return digito;
}

function modulo11_banco(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    var soma = 0;
    var peso = 2;
    var base = 9;
    var contador = numero.length - 1;
    for (var i = contador; i >= 0; i--) {
        soma += (parseInt(numero.charAt(i)) * peso);
        peso = (peso < base) ? peso + 1 : 2;
    }
    var digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (digito == 0 || digito == 1 || digito == 10) digito = 1;
    return digito;
}

function generateBarcode(codigo) {
    var container = document.getElementById('barcode-container');
    if (codigo && codigo.length === 44) {
        container.innerHTML = '<svg id="barcode" style="max-width: 100%; height: auto;"></svg>';
        var screenWidth = window.innerWidth;
        var barWidth = screenWidth < 576 ? 1 : 2;
        var barHeight = screenWidth < 576 ? 50 : 100;
        JsBarcode("#barcode", codigo, {
            format: "ITF",
            width: barWidth,
            height: barHeight,
            displayValue: true,
            background: "#fff",
            lineColor: "#000",
            margin: 10
        });
    } else {
        container.innerHTML = '<p class="form-control" id="barcode-placeholder" style="min-height: 60px; padding: 15px;">O código de barras aparecerá aqui</p>';
    }
}

function resetBarcode() {
    var container = document.getElementById('barcode-container');
    container.innerHTML = '<p class="form-control" id="barcode-placeholder" style="min-height: 60px; padding: 15px;">O código de barras aparecerá aqui</p>';
}

function copyToClipboard(inputId, iconId) {
    var input = document.getElementById(inputId);
    var icon = document.getElementById(iconId);
    if (!input.value) {
        showAlert('Nenhum texto para copiar!');
        return;
    }
    var text = input.value.replace(/[^0-9]/g, '');
    var isValid = false;
    var copyText = text;
    if (text.length === 47) {
        isValid = (calcula_barra(text) !== false);
    } else if (text.length === 44) {
        isValid = (calcula_linha(text) !== false);
    }
    if (!isValid) {
        showAlert('Texto inválido! Use uma linha digitável (47 dígitos) ou código de barras (44 dígitos) válido.');
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText)
            .then(function() {
                var message = document.getElementById('copy-message');
                message.style.display = 'block';
                setTimeout(() => {
                    message.style.display = 'none';
                }, 2000);
                icon.setAttribute('fill', '#28a745');
                setTimeout(() => {
                    icon.setAttribute('fill', '#666');
                }, 2000);
            })
            .catch(function(err) {
                fallbackCopyToClipboard(input, icon, copyText);
            });
    } else {
        fallbackCopyToClipboard(input, icon, copyText);
    }
}

function fallbackCopyToClipboard(input, icon, text) {
    try {
        var tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        var successful = document.execCommand('copy');
        document.body.removeChild(tempInput);
        if (successful) {
            var message = document.getElementById('copy-message');
            message.style.display = 'block';
            setTimeout(() => {
                message.style.display = 'none';
            }, 2000);
            icon.setAttribute('fill', '#28a745');
            setTimeout(() => {
                icon.setAttribute('fill', '#666');
            }, 2000);
        } else {
            showAlert('Falha ao copiar. Copie manualmente.');
        }
    } catch (err) {
        showAlert('Erro ao copiar: ' + err);
    }
}

function fullCheck(input) {
    var value = input.value;
    if (/[^0-9]/.test(value)) {
        showAlert('A "Linha Digitável" deve conter apenas números. Remova letras, espaços ou caracteres especiais.');
    }
}
