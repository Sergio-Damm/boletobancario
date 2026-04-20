function verificarEntradaNumerica(valor) {
    return /^[0-9]+$/.test(valor);
}

function validarCodigoBarras(obj) {
    const valor = obj.value.trim();
    return valor && verificarEntradaNumerica(valor) && valor.length === 44;
}

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

    atualizarNomeBanco();
}

function atualizarNomeBanco() {
    const campoInput = document.getElementById('linhadigitavel1');
    const campoDestino = document.getElementById('nomeBanco');

    if (!campoInput || !campoDestino) return;

    const inputBoleto = campoInput.value.trim();
    const codigoBanco = inputBoleto.substring(0, 3);

    if (mapeamentoBancos[codigoBanco]) {
        campoDestino.value = codigoBanco + " - " + mapeamentoBancos[codigoBanco];
    } else if (codigoBanco.length >= 3) {
        campoDestino.value = codigoBanco + " - Instituição não listada";
    } else {
        campoDestino.value = "";
    }
}

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

    atualizarNomeBanco();
}

function f_venc(barra) {
    const fator = barra.substr(5, 4);
    const campoValor = barra.substr(9, 10);

    if (fator === '0000') {
        document.getElementById('vencimento1').value = 'Sem vencimento';
    } else {
        document.getElementById('vencimento1').value = fator_vencimento(fator);
    }

    let valorNumerico = (parseFloat(campoValor) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById('valor1').value = valorNumerico;
}

function fator_vencimento(diasStr) {
    const dias = parseInt(diasStr, 10);
    if (isNaN(dias)) return "";

    const dataBaseNova = new Date("2022-05-29T12:00:00Z");
    const dataVenc = new Date(dataBaseNova.getTime() + (dias * 86400000));

    let dia = String(dataVenc.getUTCDate()).padStart(2, '0');
    let mes = String(dataVenc.getUTCMonth() + 1).padStart(2, '0');
    let ano = dataVenc.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
}

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

function exibirAlertaGeral(mensagem, tipo = 'danger') {
    const container = document.getElementById('alert-container');
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

async function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

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
    if (el) {
        el.value = '';
        el.focus();
    }
    const containerAlerta = document.getElementById('alert-container');
    if (containerAlerta) containerAlerta.innerHTML = '';
}

function limparCampoRelacionado(tipo) {
    if (tipo === 'linha') {
        document.getElementById('codigodebarras1').value = '';
    } else {
        document.getElementById('linhadigitavel1').value = '';
    }
    document.getElementById('vencimento1').value = '';
    document.getElementById('valor1').value = '';

    if (document.getElementById('nomeBanco')) {
        document.getElementById('nomeBanco').value = '';
    }

    document.getElementById('alert-container').innerHTML = '';
    generateBarcode('');
}

document.addEventListener('DOMContentLoaded', () => {
    generateBarcode('');
});

const mapeamentoBancos = {
    "001": "BCO DO BRASIL S.A.",
    "070": "BRB - BCO DE BRASILIA S.A.",
    "539": "SANTINVEST S.A. - CFI",
    "430": "CCR SEARA",
    "272": "AGK CC S.A.",
    "136": "UNICRED DO BRASIL",
    "407": "SEFER INVESTIMENTOS DTVM LTDA",
    "104": "CAIXA ECONOMICA FEDERAL",
    "714": "FINAMAX S.A. CFI",
    "077": "BANCO INTER",
    "423": "COLUNA S.A. DTVM",
    "741": "BCO RIBEIRAO PRETO S.A.",
    "330": "BANCO BARI S.A.",
    "534": "EWALLY IP S.A.",
    "743": "BANCO SEMEAR",
    "100": "PLANNER CV S.A.",
    "541": "FDO GARANTIDOR CRÉDITOS",
    "096": "BCO B3 S.A.",
    "747": "BCO RABOBANK INTL BRASIL S.A.",
    "362": "CIELO IP S.A.",
    "322": "CCR DE ABELARDO LUZ",
    "748": "BCO COOPERATIVO SICREDI S.A.",
    "350": "COOP DE AGRICULTORES E AEROPORTUÁRIOS DO BRASIL",
    "752": "BCO BNP PARIBAS BRASIL S A",
    "379": "COOP COOPERFORTE LTDA.",
    "399": "Kirton Bank",
    "378": "BCO BRASILEIRO DE CRÉDITO S.A.",
    "413": "BCO BV S.A.",
    "756": "BANCO SICOOB S.A.",
    "360": "TRINUS CAPITAL DTVM",
    "757": "BCO KEB HANA DO BRASIL S.A.",
    "102": "XP INVESTIMENTOS CCTVM S/A",
    "084": "SISPRIME DO BRASIL - COOP",
    "591": "BANVOX DTVM",
    "555": "PAN FINAN",
    "180": "CM CAPITAL MARKETS CCTVM LTDA",
    "066": "BCO MORGAN STANLEY S.A.",
    "015": "UBS BB CCTVM S.A.",
    "143": "INTEX BANK BCO DE CÂMBIO S.A.",
    "074": "BCO. J.SAFRA S.A.",
    "099": "UNIPRIME COOPCENTRAL LTDA.",
    "387": "BCO TOYOTA DO BRASIL S.A.",
    "326": "PARATI - CFI S.A.",
    "025": "BCO ALFA S.A.",
    "075": "BANCO ABN AMRO CLEARING S.A.",
    "040": "BCO CARGILL S.A.",
    "307": "TERRA INVESTIMENTOS DTVM",
    "517": "PAGUEVELOZ IP LTDA.",
    "385": "CECM DOS TRAB.PORT. DA G.VITOR",
    "425": "SOCINAL S.A. CFI",
    "190": "SERVICOOP",
    "296": "OZ CORRETORA DE CÂMBIO S.A.",
    "063": "BANCO BRADESCARD",
    "191": "NOVA FUTURA CTVM LTDA.",
    "764": "INDEPENDÊNCIA CC",
    "382": "FIDUCIA SCMEPP LTDA",
    "064": "GOLDMAN SACHS DO BRASIL BM S.A",
    "097": "CREDISIS - CENTRAL DE COOPERATIVAS DE CRÉDITO LTDA.",
    "016": "CCM DESP TRÂNS SC E RS",
    "299": "BCO AFINZ S.A. - BM",
    "540": "HBI SCD",
    "468": "PORTOSEG S.A. CFI",
    "012": "BANCO INBURSA",
    "003": "BCO DA AMAZONIA S.A.",
    "060": "CONFIDENCE CC S.A.",
    "037": "BCO DO EST. DO PA S.A.",
    "411": "VIA CERTA FINANCIADORA S.A. - CFI",
    "359": "ZEMA CFI S/A",
    "159": "CASA CREDITO S.A. SCM",
    "085": "COOPCENTRAL AILOS",
    "400": "COOP CREDITAG",
    "410": "PLANNER SOCIEDADE DE CRÉDITO DIRETO",
    "328": "CECM FABRIC CALÇADOS SAPIRANGA",
    "548": "RPW S.A. SCFI",
    "036": "BCO BBI S.A.",
    "469": "PICPAY INVEST",
    "394": "BCO BRADESCO FINANC. S.A.",
    "004": "BCO DO NORDESTE DO BRASIL S.A.",
    "458": "HEDGE INVESTMENTS DTVM LTDA.",
    "320": "BOC BRASIL",
    "189": "HS FINANCEIRA",
    "105": "LECCA CFI S.A.",
    "076": "BCO KDB BRASIL S.A.",
    "082": "BANCO TOPÁZIO S.A.",
    "312": "HSCM SCMEPP LTDA.",
    "195": "VALOR S/A SCFI",
    "093": "POLOCRED SCMEPP LTDA.",
    "391": "CCR DE IBIAM",
    "273": "COOP SULCREDI AMPLEA",
    "368": "BCO CSF S.A.",
    "673": "CCR DO AGRESTE ALAGOANO",
    "290": "PAGSEGURO INTERNET IP S.A.",
    "259": "MONEYCORP BCO DE CÂMBIO S.A.",
    "395": "F D GOLD DTVM LTDA",
    "364": "EFÍ S.A. - IP",
    "157": "ICAP DO BRASIL CTVM LTDA.",
    "183": "SOCRED SA - SCMEPP",
    "014": "STATE STREET BR S.A. BCO COMERCIAL",
    "130": "CARUANA SCFI",
    "358": "MIDWAY S.A. - SCFI",
    "127": "CODEPE CVC S.A.",
    "079": "PICPAY BANK - BANCO MÚLTIPLO S.A",
    "141": "MASTER BI S.A. - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "081": "BANCOSEGURO S.A.",
    "475": "BCO YAMAHA MOTOR S.A.",
    "133": "CRESOL CONFEDERAÇÃO",
    "703": "GETNET IP",
    "323": "MERCADO PAGO IP LTDA.",
    "577": "AF DESENVOLVE SP S.A.",
    "121": "BCO AGIBANK S.A.",
    "083": "BCO DA CHINA BRASIL S.A.",
    "138": "GET MONEY CC LTDA",
    "024": "BCO BANDEPE S.A.",
    "384": "GLOBAL SCM LTDA",
    "426": "NEON FINANCEIRA - SCFI S.A.",
    "576": "MERCADO BITCOIN IP LTDA",
    "664": "EAGLE IP LTDA.",
    "088": "BANCO RANDON S.A.",
    "670": "BSN",
    "319": "OM DTVM LTDA",
    "274": "BMP SCMEPP LTDA",
    "095": "BANCO TRAVELEX S.A.",
    "094": "BANCO FINAXIS",
    "478": "GAZINCRED S.A. SCFI",
    "276": "BCO SENFF S.A.",
    "780": "SAFETYPAY BRASIL IP LTDA",
    "447": "MIRAE ASSET (BRASIL) CCTVM LTDA.",
    "569": "CONTA PRONTA IP",
    "686": "BIZ IP LTDA.",
    "047": "BCO DO EST. DE SE S.A.",
    "144": "EBURY BCO DE CÂMBIO S.A.",
    "332": "ACESSO SOLUÇÕES DE PAGAMENTO S.A. - INSTITUIÇÃO DE PAGAMENTO",
    "450": "FITS IP",
    "126": "BR PARTNERS BI",
    "301": "DOCK IP S.A.",
    "173": "BRL TRUST DTVM SA",
    "331": "OSLO CAPITAL DTVM SA",
    "119": "BCO WESTERN UNION",
    "396": "MAGALUPAY",
    "509": "CELCOIN IP S.A.",
    "254": "PARANA BCO S.A.",
    "268": "BARI CIA HIPOTECÁRIA",
    "401": "IUGU IP S.A.",
    "107": "BCO BOCOM BBM S.A.",
    "334": "BANCO BESA S.A.",
    "412": "SOCIAL BANK S/A",
    "124": "BCO WOORI BANK DO BRASIL S.A.",
    "149": "FACTA S.A. CFI",
    "197": "STONE IP S.A.",
    "439": "ID CTVM",
    "690": "BK IP S.A.",
    "142": "BROKER BRASIL CC LTDA.",
    "529": "PINBANK IP",
    "415": "BCO NACIONAL",
    "389": "BCO MERCANTIL DO BRASIL S.A.",
    "634": "BCO TRIANGULO S.A.",
    "545": "SENSO CCVM S.A.",
    "132": "ICBC DO BRASIL BM S.A.",
    "298": "VIPS CC S.A.",
    "377": "BMS SCD S.A.",
    "321": "CREFAZ SCMEPP SA",
    "542": "CLOUDWALK IP LTDA",
    "260": "NU PAGAMENTOS - IP",
    "573": "OXY CH",
    "470": "CDC SCD S.A.",
    "129": "UBS BB BI S.A.",
    "562": "AZIMUT BRASIL DTVM LTDA",
    "128": "BRAZA BANK S.A. BCO DE CÂMBIO",
    "416": "LAMARA SCD S.A.",
    "595": "IFOOD PAGO IP",
    "461": "ASAAS IP S.A.",
    "665": "STARK BANK S.A. - IP",
    "194": "UNIDA DTVM LTDA",
    "538": "SUDACRED SCD S.A.",
    "588": "AVANCARD PROVER IP LTDA",
    "768": "BECKER FINANCEIRA SA - CFI",
    "561": "PAY4FUN IP S.A.",
    "772": "CC MECUNP",
    "536": "NEON PAGAMENTOS S.A. IP",
    "383": "EBANX IP LTDA.",
    "324": "CARTOS SCD S.A.",
    "560": "MAG IP LTDA.",
    "533": "SRM BANK",
    "310": "VORTX DTVM LTDA.",
    "380": "PICPAY",
    "566": "FLAGSHIP IP LTDA",
    "280": "WILL FINANCEIRA S.A.CFI - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "146": "GUITTA CC LTDA",
    "769": "99PAY IP S.A.",
    "651": "PAGARE IP S.A.",
    "671": "ZERO IP",
    "685": "TYCOON TECHNOLOGY IIP S.A",
    "593": "TRANSFEERA IP S.A.",
    "335": "BANCO DIGIO",
    "349": "AL5 S.A. SCFI",
    "427": "CRED.UFES",
    "374": "REALIZE SCFI S.A.",
    "278": "GENIAL INVESTIMENTOS CVM S.A.",
    "271": "BPY CCTVM S.A.",
    "674": "HINOVA PAY IP S.A.",
    "021": "BCO BANESTES S.A.",
    "246": "BCO ABC BRASIL S.A.",
    "292": "GALAPAGOS DTVM S.A.",
    "554": "BCO STONEX S.A.",
    "751": "Scotiabank Brasil",
    "352": "SANTANDER CTVM S.A.",
    "208": "BANCO BTG PACTUAL S.A.",
    "683": "BRASIL CASH IP S.A.",
    "386": "NU FINANCEIRA S.A. CFI",
    "675": "BANQI",
    "557": "PAGPRIME IP",
    "546": "OKTO IP",
    "241": "BCO CLASSICO S.A.",
    "783": "SWAP IP S.A.",
    "398": "IDEAL CTVM S.A.",
    "336": "BCO C6 S.A.",
    "612": "BCO GUANABARA S.A.",
    "604": "BCO INDUSTRIAL DO BRASIL S.A.",
    "505": "BCO UBS BRASIL",
    "550": "BEETELLER IP LTDA.",
    "552": "UZZIPAY IP S.A.",
    "329": "QI SCD S.A.",
    "196": "FAIR CC S.A.",
    "662": "WE PAY OUT IP LTDA.",
    "693": "EFEX IP",
    "342": "CREDITAS SCD",
    "567": "MERCANTIL FINANCEIRA",
    "300": "BCO LA NACION ARGENTINA",
    "477": "CITIBANK N.A.",
    "266": "BCO CEDULA S.A.",
    "122": "BCO BRADESCO BERJ S.A.",
    "376": "BCO J.P. MORGAN S.A.",
    "348": "BCO XP S.A.",
    "473": "BCO CAIXA GERAL BRASIL S.A.",
    "745": "BCO CITIBANK S.A.",
    "708": "BCO INDUSCRED DE INVESTIM. S/A",
    "120": "BCO RODOBENS S.A.",
    "265": "BCO FATOR S.A.",
    "007": "BNDES",
    "583": "SICREDI CENTRO NORTE",
    "582": "SICREDI BRASIL CENTRAL",
    "188": "ATIVA S.A. INVESTIMENTOS CCTVM",
    "134": "BGC LIQUIDEZ DTVM LTDA",
    "719": "BANCO MASTER MÚLTIPLO - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "029": "BANCO ITAÚ CONSIGNADO S.A.",
    "467": "MASTER S/A CCTVM - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "243": "BANCO MASTER - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "774": "MOVA SEP S.A.",
    "397": "LISTO SCD S.A.",
    "078": "HAITONG BI DO BRASIL S.A.",
    "760": "EMCASH SERV FINANC SEP S.A.",
    "525": "INTERCAM CC LTDA",
    "355": "ÓTIMO SCD S.A.",
    "531": "BMP SCD S.A.",
    "660": "PAGME IP LTDA",
    "597": "ISSUER IP LTDA.",
    "528": "CBSF DTVM -EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "659": "ONEKEY PAYMENTS IP S.A.",
    "687": "INCO SEP S.A.",
    "676": "DUFRIO CFI S.A.",
    "695": "BEES IP LTDA.",
    "445": "PLANTAE CFI",
    "788": "PROTOTYPE IP S.A.",
    "586": "Z1 IP LTDA.",
    "373": "UP.P SEP S.A.",
    "111": "OLIVEIRA TRUST DTVM S.A.",
    "512": "FINVEST DTVM",
    "599": "AGORACRED S/A SCFI",
    "516": "QISTA S.A. CFI",
    "408": "BONUSPAGO SCD S.A.",
    "679": "PAY IP S.A.",
    "484": "MAF DTVM SA",
    "402": "COBUCCIO S.A. SCFI",
    "507": "SCFI EFÍ S.A.",
    "404": "SUMUP SCD S.A.",
    "418": "ZIPDIN SCD S.A.",
    "615": "SMART SOLUTIONS GROUP IP LTDA",
    "414": "LEND SCD S.A.",
    "449": "DM",
    "587": "FIDD DTVM LTDA.",
    "518": "MERCADO CRÉDITO SCFI S.A.",
    "406": "ACCREDITO SCD S.A.",
    "403": "CORA SCFI",
    "419": "NUMBRS SCD S.A.",
    "435": "DELCRED SCD S.A.",
    "455": "VIS DTVM LTDA",
    "544": "MULTICRED SCD S.A.",
    "421": "CC LAR CREDI",
    "443": "OCTA SCD S.A. - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "535": "OPEA SCD",
    "457": "UY3 SCD S/A",
    "428": "CREDSYSTEM SCD S.A.",
    "448": "HEMERA DTVM LTDA.",
    "452": "CREDIFIT SCD S.A.",
    "596": "CACTVS IP S.A.",
    "510": "FFCRED SCD S.A.",
    "462": "STARK SCD S.A.",
    "465": "CAPITAL CONSIG SCD S.A.",
    "636": "GIRO - SCD S/A",
    "563": "PROTEGE CASH",
    "306": "PORTOPAR DTVM LTDA",
    "556": "SAYGO CÂMBIO",
    "305": "FOURTRADE COR. DE CAMBIO LTDA",
    "463": "AZUMI DTVM",
    "590": "REPASSES FINANCEIROS E SOLUCOES TECNOLOGICAS IP S.A.",
    "451": "J17 - SCD S/A",
    "444": "TRINUS SCD S.A.",
    "519": "LIONS TRUST DTVM",
    "454": "MÉRITO DTVM LTDA.",
    "460": "UNAVANTI SCD S/A",
    "506": "RJI",
    "482": "ARTTA SCD",
    "017": "BNY MELLON BCO S.A.",
    "759": "BANSUR JM SCD S.A.",
    "174": "PEFISA S.A. - C.F.I.",
    "481": "SUPERLÓGICA SCD S.A.",
    "688": "KIKAI SCD S.A.",
    "521": "PEAK SEP S.A.",
    "433": "BR-CAPITAL DTVM S.A.",
    "495": "BCO LA PROVINCIA B AIRES BCE",
    "523": "HR DIGITAL SCD",
    "527": "ATICCA SCD S.A.",
    "704": "FEATBANK IP LTDA",
    "511": "MAGNUM SCD",
    "520": "SOMAPAY SCD S.A.",
    "513": "ATF SCD S.A.",
    "663": "ACTUAL DTVM S.A.",
    "792": "NIXFIN SCD",
    "697": "JM CORRETORA DE CÂMBIO",
    "125": "BANCO GENIAL",
    "496": "BBVA BRASIL BI S.A.",
    "547": "BNK DIGITAL SCD S.A.",
    "592": "MAPS IP LTDA.",
    "678": "FIDEM SCD S/A",
    "532": "EAGLE SCD S.A.",
    "537": "MICROCASH SCMEPP LTDA.",
    "524": "WNT CAPITAL DTVM",
    "526": "MONETARIE SCD",
    "682": "MONERY IP S.A.",
    "488": "JPMORGAN CHASE BANK",
    "669": "TRANSFERO IP LTDA.",
    "775": "CONTAAZUL IP LTDA.",
    "522": "RED SCD S.A.",
    "530": "SER FINANCE SCD S.A.",
    "667": "LIQUIDO IP LTDA",
    "575": "DGBK CREDIT S.A. - SOCIEDADE DE CRÉDITO DIRETO.",
    "668": "CELCOIN SCD",
    "594": "ASA SCFI S.A.",
    "553": "PERCAPITAL SCD S.A.",
    "574": "A55 SCD S.A.",
    "065": "BCO ANDBANK S.A.",
    "551": "VERT DTVM LTDA.",
    "559": "KANASTRA CFI",
    "579": "QUADRA SCD",
    "619": "TRIO IP LTDA.",
    "568": "BRCONDOS SCD S.A.",
    "696": "LOAN BRASIL SCD S.A.",
    "145": "LEVYCAM CCV LTDA",
    "250": "BANCO BMG CONSIGNADO S.A.",
    "598": "KONECT SCD S/A",
    "681": "MT IP S.A.",
    "585": "SETHI SCD SA",
    "701": "INTEGRAÇÃO DE CRÉDITO E COBRANÇA SCD",
    "689": "NVIO BRASIL SCD S.A.",
    "589": "G5 SCD SA",
    "620": "REVOLUT SCD S.A.",
    "572": "ALL IN CRED SCD S.A.",
    "786": "AWX BRASIL IP LTDA.",
    "614": "SANTS SCD S.A.",
    "632": "Z-ON SCD S.A.",
    "766": "LB PAY IP LTDA",
    "672": "STONE CFI S.A.",
    "269": "BCO HSBC S.A.",
    "700": "MW IP LTDA.",
    "761": "URBANO S.A. SCFI",
    "773": "KIWIFY IP",
    "790": "MAX IP",
    "213": "BCO ARBI S.A.",
    "644": "321 SCD S.A.",
    "694": "WOOVI IP LTDA.",
    "139": "INTESA SANPAOLO BRASIL S.A. BM",
    "661": "FREEX SCC S.A.",
    "680": "DELTA GLOBAL SCD S.A.",
    "763": "VUE IP S.A.",
    "692": "SQUID SCD S.A.",
    "684": "HARMOS S.A. - SCFI",
    "771": "WX IP LTDA.",
    "018": "BCO TRICURY S.A.",
    "781": "BARU DTVM LTDA.",
    "422": "BCO SAFRA S.A.",
    "698": "BIT SCD S.A.",
    "630": "BANCO LETSBANK S.A. - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "224": "BCO FIBRA S.A.",
    "393": "BCO VOLKSWAGEN S.A",
    "600": "BCO LUSO BRASILEIRO S.A.",
    "390": "BCO GM S.A.",
    "623": "BANCO PAN",
    "699": "BFC SCD S.A.",
    "655": "BCO VOTORANTIM S.A.",
    "479": "BCO ITAUBANK S.A.",
    "456": "BCO MUFG BRASIL S.A.",
    "464": "BCO SUMITOMO MITSUI BRASIL S.A.",
    "341": "ITAÚ UNIBANCO S.A.",
    "237": "BCO BRADESCO S.A.",
    "381": "BCO MERCEDES-BENZ S.A.",
    "613": "OMNI BANCO S.A.",
    "637": "BCO SOFISA S.A.",
    "653": "BM PLENO S.A. - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "069": "BCO CREFISA S.A.",
    "370": "BCO MIZUHO S.A.",
    "249": "BANCO INVESTCRED UNIBANCO S.A.",
    "318": "BCO BMG S.A.",
    "626": "BCO C6 CONSIG",
    "508": "AVENUE SECURITIES BI S.A.",
    "366": "BCO SOCIETE GENERALE BRASIL",
    "113": "NEON CTVM S.A.",
    "131": "TULLETT PREBON BRASIL CVC LTDA",
    "011": "UBS (BRASIL) CORRETORA DE VALORES S.A.",
    "611": "BCO PAULISTA S.A.",
    "755": "BOFA MERRILL LYNCH BM S.A.",
    "089": "CREDISAN CC",
    "643": "BCO PINE S.A.",
    "140": "NU INVESTIMENTOS S.A. - CTVM",
    "707": "BCO DAYCOVAL S.A",
    "288": "CAROL DTVM LTDA.",
    "767": "QORE",
    "363": "QI CTVM S.A.",
    "101": "WARREN RENA DTVM",
    "487": "DEUTSCHE BANK S.A.BCO ALEMAO",
    "233": "BANCO BMG SOLUÇÕES FINANCEIRAS S.A.",
    "791": "MULTIPLIKE FINANCEIRA S.A. SCFI",
    "438": "TRUSTEE DTVM LTDA.",
    "365": "SIMPAUL",
    "633": "BCO RENDIMENTO S.A.",
    "581": "CENTRAL NORDESTE",
    "218": "BCO BS2 S.A.",
    "293": "LASTRO RDV DTVM LTDA",
    "285": "FRENTE SCC S.A",
    "514": "EXIM CC LTDA.",
    "080": "BT CC LTDA.",
    "565": "ÁGORA CTVM S.A.",
    "753": "NOVO BCO CONTINENTAL S.A. - BM",
    "222": "BCO CRÉDIT AGRICOLE BR S.A.",
    "281": "CCR COOPAVEL",
    "754": "BANCO SISTEMA",
    "610": "BCO VR S.A.",
    "712": "OURIBANK S.A.",
    "584": "SICREDI PR/SP/RJ",
    "720": "BCO RNX S.A.",
    "010": "CREDICOAMO",
    "440": "COOP CREDI&GENTE",
    "580": "SICREDI SUL/SUDESTE",
    "283": "RB INVESTIMENTOS DTVM LTDA.",
    "033": "BCO SANTANDER (BRASIL) S.A.",
    "646": "DM SCFI",
    "217": "BANCO JOHN DEERE S.A.",
    "041": "BCO DO ESTADO DO RS S.A.",
    "543": "COOPCRECE",
    "654": "BCO DIGIMAIS S.A.",
    "212": "BANCO ORIGINAL",
    "289": "EFX CC LTDA.",
};

