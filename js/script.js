// // --- 1. Full Script (New Page - Due Dates from 22/fev/2025) ---
function verificarEntradaNumerica(valor) {
    return /^[0-9]+$/.test(valor);
}

function validarCodigoBarras(obj) {
    const valor = obj.value.trim();
    if (!valor) return false;
    if (!verificarEntradaNumerica(valor)) return false;
    if (valor.length !== 44) return false;
    return true;
}

function f_barra() {
    const input = document.getElementById('linhadigitavel1');
    const valor = input.value.trim();

    if (!valor) {
        exibirAlertaGeral('A linha digitável é necessária para calcular o código de barras.');
        form.barra.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }
    if (!verificarEntradaNumerica(valor)) {
        exibirAlertaGeral('A linha digitável só aceita números.');
        form.barra.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }
    if (valor.length !== 47) {
        exibirAlertaGeral('A linha digitável deve ter 47 números. Você digitou ' + valor.length + ' números.');
        form.barra.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }

    var linhaNumerica = valor.replace(/[^0-9]/g, '');
    var depois = calcula_barra(linhaNumerica);
    if (!depois) {
        return false;
    }

    form.barra.value = depois;
    f_venc();
    generateBarcode(form.barra.value);
    return false;
}

function f_linha() {
    const input = document.getElementById('codigodebarras1');
    const valor = input.value.trim();

    if (!valor) {
        exibirAlertaGeral('O código de barras é necessário para calcular a linha digitável.');
        form.linha.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }
    if (!verificarEntradaNumerica(valor)) {
        exibirAlertaGeral('O código de barras só aceita números.');
        form.linha.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }
    if (valor.length !== 44) {
        exibirAlertaGeral('O código de barras deve ter 44 números. Você digitou ' + valor.length + ' números.');
        form.linha.value = '';
        form.venc.value = '';
        form.valor.value = '';
        generateBarcode('');
        return false;
    }

    var barraNumerica = valor.replace(/[^0-9]/g, '');
    var depois = calcula_linha(barraNumerica);
    if (!depois) {
        return false;
    }

    form.linha.value = depois;
    f_venc();
    generateBarcode(form.barra.value);
    return false;
}

function f_venc() {
    if (form.barra.value.substr(5, 4) == 0) {
        form.venc.value = 'O boleto pode ser pago em qualquer data';
    } else {
        var dataVencimento = fator_vencimento(form.barra.value.substr(5, 4));
        form.venc.value = dataVencimento;
        var dataAtual = new Date();
        var vencimento = new Date(dataVencimento.split('.')[2], dataVencimento.split('.')[1] - 1, dataVencimento.split('.')[0]);
        var diffDias = Math.ceil((vencimento - dataAtual) / (1000 * 60 * 60 * 24));
        if (diffDias > 90) {
            exibirAlerta(dataVencimento, form.barra.value.substr(5, 4));
        }
    }
    form.valor.value = (form.barra.value.substr(9, 8) * 1) + ',' + form.barra.value.substr(17, 2);
    return (false);
}

function calcula_barra(linha) {
    linha = linha.replace(/[^0-9]/g, '');
    if (linha.length !== 47) {
        exibirAlertaGeral('Linha digitável inválida.');
        return '';
    }
    linha = linha.slice(0, 4) + linha.slice(32, 47) + linha.slice(4, 9) + linha.slice(10, 20) + linha.slice(21, 31); // Usa slice()
    if (modulo11_banco(linha.substr(0, 4) + linha.substr(5, 39)) != linha.substr(4, 1)) {
        exibirAlertaGeral('Linha digitável inválida.');
        return '';
    }
    return (linha);
}

function calcula_linha(barra) {
    barra = barra.replace(/[^0-9]/g, '');
    if (barra.length !== 44) {
        exibirAlertaGeral('Código de barras inválido. O código de barras deve ter 44 números.');
        return '';
    }
    var campo1 = barra.slice(0, 4) + barra.slice(19, 20) + '.' + barra.slice(20, 24); // Usa slice()
    var campo2 = barra.slice(24, 29) + '.' + barra.slice(29, 34); // Usa slice()
    var campo3 = barra.slice(34, 39) + '.' + barra.slice(39, 44); // Usa slice()
    var campo4 = barra.slice(4, 5); // Usa slice()
    var campo5 = barra.slice(5, 19); // Usa slice()
    if (modulo11_banco(barra.substr(0, 4) + barra.substr(5, 99)) != campo4) {
        exibirAlertaGeral('Código de barras inválido.');
        return '';
    }
    if (campo5 == 0) campo5 = '000';
    linha = campo1 + modulo10(campo1) + ' ' + campo2 + modulo10(campo2) + ' ' + campo3 + modulo10(campo3) + ' ' + campo4 + ' ' + campo5;
    linha = linha.replace(/[^0-9]/g, '');
    return (linha);
}

function fator_vencimento(dias) {
    var currentDate, t, mes, dia;
    t = new Date();
    currentDate = new Date();
    currentDate.setFullYear(2022, 4, 29);
    t.setTime(currentDate.getTime() + (1000 * 60 * 60 * 24 * dias));
    mes = (t.getMonth() + 1); if (mes < 10) mes = "0" + mes;
    dia = (t.getDate()); if (dia < 10) dia = "0" + dia;
    return (dia + "." + mes + "." + t.getFullYear());
}

function modulo10(numero) {
    numero = numero.replace(/[^0-9]/g, '');
    var soma = 0;
    var peso = 2;
    var contador = numero.length - 1;
    while (contador >= 0) {
        multiplicacao = (numero.substr(contador, 1) * peso);
        if (multiplicacao >= 10) { multiplicacao = 1 + (multiplicacao - 10); }
        soma = soma + multiplicacao;
        if (peso == 2) {
            peso = 1;
        } else {
            peso = 2;
        }
        contador = contador - 1;
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
    var resto = 0;
    var contador = numero.length - 1;
    for (var i = contador; i >= 0; i--) {
        soma = soma + (numero.substring(i, i + 1) * peso);
        if (peso < base) {
            peso++;
        } else {
            peso = 2;
        }
    }
    var digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (digito == 0) digito = 1;
    return digito;
}

function exibirAlerta(dataVencimento, fator) {
    var alertaDiv = document.getElementById('vencimento-alerta');
    alertaDiv.classList.add('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
    document.getElementById('dataVencimento').textContent = dataVencimento;
    document.getElementById('fator').textContent = fator;
    document.getElementById('fator-valor-1').textContent = fator;
    alertaDiv.style.display = 'block';
    var closeButton = alertaDiv.querySelector('.btn-close');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    closeButton.style.right = '0';

    // Função para remover o ouvinte de eventos
    function removerOuvinte() {
        alertaDiv.style.display = 'none';
        alertaDiv.classList.remove('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
        closeButton.removeEventListener('click', removerOuvinte); // Remove o ouvinte de eventos
    }

    closeButton.addEventListener('click', removerOuvinte); // Adiciona o ouvinte de eventos
}

function exibirAlertaGeral(mensagem, tipo = 'danger', campoErro = null) {
    var alerta = document.createElement('div');
    alerta.classList.add('alert', 'alert-' + tipo, 'alert-dismissible', 'fade', 'show');
    alerta.innerHTML = `<p>${mensagem}</p><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;

    // Adiciona um ID único ao alerta
    var alertaId = 'alerta-' + Date.now();
    alerta.setAttribute('id', alertaId);

    document.getElementById('alert-container').innerHTML = '';
    document.getElementById('alert-container').appendChild(alerta);

    if (campoErro) {
        document.getElementById(campoErro).focus();
    }
}

function generateBarcode(codigo) {
    var container = document.getElementById('barcode-container');
    container.innerHTML = ''; // Limpa o conteúdo existente

    if (codigo && codigo.length === 44) {
        // Cria o elemento SVG do código de barras
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "barcode");
        svg.setAttribute("style", "max-width: 100%; height: auto;");

        // Adiciona o SVG ao contêiner
        container.appendChild(svg);

        // Gera o código de barras usando JsBarcode
        JsBarcode("#barcode", codigo, {
            format: "ITF",
            width: 2,
            height: 100,
            displayValue: true,
            lineColor: "#000",
            margin: 10,
            fontOptions: "font-size: 20px"
        });
    } else if (container.innerHTML === '') {
        // Exibe a mensagem de espaço reservado apenas se o contêiner estiver vazio
        container.innerHTML = 'O código de barras aparecerá aqui';
    }
}

function limparCodigoBarras() {
    // Limpa os campos de entrada
    form.linha.value = '';
    form.barra.value = '';
    form.venc.value = '';
    form.valor.value = '';

    // Limpa o código de barras gerado
    var container = document.getElementById('barcode-container');
    container.innerHTML = ''; // Remove o conteúdo existente

    // Exibe a mensagem de espaço reservado usando a função generateBarcode()
    generateBarcode('');

    // Remove o alerta geral, se existir
    var alertaGeral = document.querySelector('#alert-container .alert');
    if (alertaGeral) {
        alertaGeral.remove();
    }

    // Remove o alerta de vencimento, se existir
    var alertaVencimento = document.getElementById('vencimento-alerta');
    if (alertaVencimento) {
        alertaVencimento.remove();
    }

    // Recarrega a página após um pequeno atraso
    setTimeout(function() {
        location.reload();
    }, 100); // 100 milissegundos de atraso
}

function removerOuvinte() {
    var alertaDiv = document.getElementById('vencimento-alerta');
    alertaDiv.style.display = 'none';
    alertaDiv.classList.remove('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
}

function fullCheck(obj) {
    const valor = obj.value.trim();
    if (!valor) return false;
    if (!verificarEntradaNumerica(valor)) return false;
    if (valor.length !== 47) return false;
    return true;
}

async function copyToClipboard(elementId) {
    try {
        var inputField = document.getElementById(elementId);
        if (!inputField) {
            throw new Error('Campo não encontrado: ' + elementId);
        }
        if (!inputField.value) {
            const fieldNames = {
                'linhadigitavel1': 'Digite aqui a linha digitável',
                'codigodebarras1': 'Informe aqui o código de barras'
            };
            const fieldName = fieldNames[elementId] || 'desconhecido';
            throw new Error(`O campo "${fieldName}" está vazio!`);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(inputField.value);
        } else {
            inputField.select();
            document.execCommand('copy');
        }

        var message = document.createElement('div');
        message.textContent = 'Copiado para a área de transferência!';
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = '#da3458';
        message.style.color = '#fff';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '5px';
        message.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        message.style.zIndex = '9999';
        document.body.appendChild(message);

        setTimeout(function() {
            document.body.removeChild(message);
        }, 2000);
    } catch (err) {
        console.error('Erro ao copiar: ', err.message);
        exibirAlertaGeral('Não foi possível copiar: ' + err.message);
    }
}

function limparCampo(campo) {
    document.getElementById(campo).value = '';
    document.getElementById(campo).focus(); // Adiciona esta linha

    // Remove todos os alertas
    var alertas = document.querySelectorAll('#alert-container .alert');
    alertas.forEach(function(alerta) {
        alerta.remove();
    });
}

  document.addEventListener('DOMContentLoaded', function() {
    generateBarcode('');
});
