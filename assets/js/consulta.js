const token = localStorage.getItem('token');
// Recupera o email do profissional logado (assumindo que foi salvo no login)
// Caso não tenha salvo, você precisará decodificar o JWT ou fazer um fetch de "meus-dados"
const emailProfissional = localStorage.getItem('userEmail'); 

// Estado da aplicação
let consultaAtualId = null;
let acaoAtual = null; // 'NEGAR' ou 'CANCELAR'

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'index.html'; // Redireciona se não logado
        return;
    }
    carregarConsultas();
    
    // Listener do Formulário do Modal
    document.getElementById('form-justificativa').addEventListener('submit', handleSubmitJustificativa);
});

async function carregarConsultas() {
    const tbodyPendentes = document.getElementById('lista-pendentes');
    const tbodyAgendados = document.getElementById('lista-agendados');

    try {
        const response = await fetch(`http://localhost:8080/profissionais/consultas`, {
            method: 'GET',
            headers: { 'token': token }
        });

        if (response.ok) {
            const consultas = await response.json();
            
            // Limpa as tabelas
            tbodyPendentes.innerHTML = '';
            tbodyAgendados.innerHTML = '';

            let pendentesCount = 0;
            let agendadosCount = 0;

            consultas.forEach(c => {
                // Formatação de data e hora para exibição
                const dataFormatada = new Date(c.dataConsulta).toISOString().split('T')[0].split('-').reverse().join('/'); // DD/MM/YYYY
                const horaFormatada = c.horaInicio.substring(0, 5); // Pega apenas HH:mm

                // Verifica Status
                if (c.statusConsulta === 'SOLICITADA') {
                    renderLinhaPendente(c, dataFormatada, horaFormatada, tbodyPendentes);
                    pendentesCount++;
                } else if (c.statusConsulta === 'CONFIRMADA' || c.statusConsulta === 'CANCELADA') {
                    renderLinhaAgendada(c, dataFormatada, horaFormatada, tbodyAgendados);
                    agendadosCount++;
                }
            });

            if (pendentesCount === 0) tbodyPendentes.innerHTML = '<tr><td colspan="5" align="center">Nenhuma solicitação pendente.</td></tr>';
            if (agendadosCount === 0) tbodyAgendados.innerHTML = '<tr><td colspan="5" align="center">Nenhum agendamento futuro.</td></tr>';

        } else {
            mostrarErro('Erro ao buscar consultas.');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Falha na conexão com o servidor.');
    }
}

// Renderiza linha na tabela de Solicitações (Botões Aceitar e Negar)
function renderLinhaPendente(c, data, hora, tbody) {
    const tr = document.createElement('tr');
    // Obs: c.nomePaciente ou c.emailPaciente deve vir do backend. 
    // Se o backend só manda emailDestinatario (médico), o backend precisa ser ajustado para mandar quem solicitou.
    const pacienteInfo = c.nomeDestinatario || "Paciente não identificado";

    tr.innerHTML = `
        <td>${pacienteInfo}</td>
        <td>${c.tipoConsulta}</td>
        <td>${data}</td>
        <td>${hora}</td>
        <td class="row">
            <button class="button" onclick="aceitarConsulta(${c.id})">Aceitar</button>
            <button class="button danger" onclick="abrirModal('NEGAR', ${c.id})">Negar</button>
        </td>
    `;
    tbody.appendChild(tr);
}

// Renderiza linha na tabela de Agendados (Botão Cancelar)
function renderLinhaAgendada(c, data, hora, tbody) {
    const tr = document.createElement('tr');
    const pacienteInfo = c.nomeDestinatario;

    let statusClass = '';
    if (c.statusConsulta === 'CONFIRMADA') statusClass = 'color: #28a745; font-weight: bold;'; // Verde
    else if (c.statusConsulta === 'CANCELADA' || c.statusConsulta === 'NEGADA') statusClass = 'color: #dc3545; font-weight: bold;'; // Vermelho
    else statusClass = 'color: #e0a800; font-weight: bold;'; // Amarelo/Laranja (Solicitada)

    tr.innerHTML = `
        <td>${pacienteInfo}</td>
        <td>${data}</td>
        <td>${hora}</td>
        <td>${c.tipoConsulta}</td>
        <td style="${statusClass}">${c.statusConsulta}</td>
    `;
    tbody.appendChild(tr);
}

// --- LÓGICA DE AÇÕES ---

// 1. ACEITAR
async function aceitarConsulta(id) {
    if(!confirm("Deseja confirmar esta consulta?")) return;

    try {
        // Endpoint sugerido: PUT /consultas/{id}/confirmar ou similar
        // Ajuste a URL conforme seu Controller Java
        const response = await fetch(`http://localhost:8080/profissionais/consultas/${id}/confirmar`, {
            method: 'PATCH',
            headers: { 
                'token': token,
                'Content-Type': 'application/json' 
            }
        });

        if (response.ok) {
            mostrarSucesso('Consulta confirmada com sucesso!');
            carregarConsultas(); // Recarrega as tabelas
        } else {
            mostrarErro('Erro ao confirmar consulta.');
        }
    } catch (error) {
        mostrarErro('Erro de conexão.');
    }
}

// 2. MODAL E SUBMIT (Negar e Cancelar)
function abrirModal(acao, id) {
    acaoAtual = acao;
    consultaAtualId = id;
    
    const titulo = document.getElementById('modal-titulo');
    const btnSubmit = document.querySelector('#form-justificativa button[type="submit"]');

    if (acao === 'NEGAR') {
        titulo.textContent = "Negar Solicitação";
        btnSubmit.textContent = "Enviar Negação";
    } else {
        titulo.textContent = "Cancelar Consulta";
        btnSubmit.textContent = "Confirmar Cancelamento";
    }
    
    document.getElementById('texto-justificativa').value = '';
    document.getElementById('modal-justificativa').classList.add('active');
}

function fecharModal() {
    document.getElementById('modal-justificativa').classList.remove('active');
    consultaAtualId = null;
    acaoAtual = null;
}

async function handleSubmitJustificativa(e) {
    e.preventDefault();
    const justificativa = document.getElementById('texto-justificativa').value;

    if (!justificativa.trim()) {
        alert("A justificativa é obrigatória.");
        return;
    }

    // Define endpoint baseado na ação
    let url = '';
    
    // CORREÇÃO 1: Usar 'consultaAtualId' em vez de 'id'
    // CORREÇÃO 2: Ajustar os endpoints (estava enviando /confirmar na negação)
    if (acaoAtual === 'NEGAR') {
        url = `http://localhost:8080/profissionais/consultas/${consultaAtualId}/negar`;
    }

    // Verificação de segurança caso url continue vazia
    if (!url) {
        mostrarErro('Ação desconhecida.');
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: justificativa
        });

        if (response.ok) {
            mostrarSucesso(`Consulta ${acaoAtual === 'NEGAR' ? 'negada' : 'cancelada'} com sucesso.`);
            fecharModal();
            carregarConsultas();
        } else {
            // Tenta pegar mensagem de erro do backend, se houver
            const errorText = await response.text(); 
            mostrarErro(errorText || 'Erro ao processar a solicitação.');
        }
    } catch (error) {
        console.error(error);
        mostrarErro('Erro de conexão ao enviar justificativa.');
    }
}

// --- UTILITÁRIOS DE MENSAGEM ---

function mostrarErro(msg) {
    const box = document.getElementById('msg-feedback');
    box.style.display = 'block';
    box.style.backgroundColor = '#fee';
    box.style.color = '#c33';
    box.style.border = '1px solid #fcc';
    box.textContent = msg;
    setTimeout(() => { box.style.display = 'none'; }, 5000);
}

function mostrarSucesso(msg) {
    const box = document.getElementById('msg-feedback');
    box.style.display = 'block';
    box.style.backgroundColor = '#efe';
    box.style.color = '#3c3';
    box.style.border = '1px solid #cfc';
    box.textContent = msg;
    setTimeout(() => { box.style.display = 'none'; }, 5000);
}